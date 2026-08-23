/**
 * Watermark removal for the source sequences.
 *
 * The generator stamps a four point sparkle at a fixed 180 px inset from the
 * bottom right corner of every frame. Both renders carry it, at mirrored
 * positions and at the same 72x72 size:
 *
 *   1920x1080 landscape   bbox x 1704..1775, y 864..935   centre 1740,900
 *   1080x1920 portrait    bbox x 864..935, y 1704..1775   centre 900,1740
 *
 * Both were located the same way, by taking the per pixel minimum across
 * frames sampled from all six shots: a static overlay stays bright even when
 * the plate behind it goes dark, so only the constant mark survives.
 *
 * Cropping it out would cost 20% of the frame, so the disc is erased and
 * refilled by diffusion from the surrounding ring: Jacobi relaxation seeded
 * with the ring mean. The area is out of focus background in every shot, so a
 * smooth fill is indistinguishable from the plate, and the film vignette
 * darkens it further.
 *
 * Because the mark is the same size in both renders, the hole, ring and
 * iteration counts are shared and only the centre changes.
 *
 * Mutates the raw RGB buffer in place.
 */
const RECT = { hole: 58, ring: 78, iterations: 220 }

/** 1920x1080 source: bbox x 1704..1775, y 864..935 */
export const WM_LANDSCAPE = { cx: 1740, cy: 900, ...RECT }
/** 1080x1920 source: bbox x 864..935, y 1704..1775 */
export const WM_PORTRAIT = { cx: 900, cy: 1740, ...RECT }

/** back compat: the manifest field and the encode report both name this one */
export const WM = WM_LANDSCAPE

/**
 * @param {Uint8Array|Buffer} data RGB, 3 channels
 * @param {number} w @param {number} h
 * @param {{cx:number,cy:number,hole:number,ring:number,iterations:number}} wm
 */
export function inpaintWatermark(data, w, h, wm = WM_LANDSCAPE) {
  const { cx, cy, hole, ring, iterations } = wm
  const x0 = Math.max(0, cx - ring)
  const y0 = Math.max(0, cy - ring)
  const x1 = Math.min(w - 1, cx + ring)
  const y1 = Math.min(h - 1, cy + ring)
  const bw = x1 - x0 + 1
  const bh = y1 - y0 + 1

  // 1 = solve for this pixel, 0 = fixed boundary condition
  const unknown = new Uint8Array(bw * bh)
  let ringSum = [0, 0, 0]
  let ringCount = 0
  for (let y = 0; y < bh; y++) {
    for (let x = 0; x < bw; x++) {
      const d = Math.hypot(x0 + x - cx, y0 + y - cy)
      if (d <= hole) unknown[y * bw + x] = 1
      else if (d <= ring) {
        const p = ((y0 + y) * w + (x0 + x)) * 3
        ringSum[0] += data[p]
        ringSum[1] += data[p + 1]
        ringSum[2] += data[p + 2]
        ringCount++
      }
    }
  }
  if (!ringCount) return

  const cur = new Float32Array(bw * bh * 3)
  const next = new Float32Array(bw * bh * 3)
  const mean = [ringSum[0] / ringCount, ringSum[1] / ringCount, ringSum[2] / ringCount]
  for (let y = 0; y < bh; y++) {
    for (let x = 0; x < bw; x++) {
      const i = (y * bw + x) * 3
      const p = ((y0 + y) * w + (x0 + x)) * 3
      if (unknown[y * bw + x]) {
        cur[i] = mean[0]
        cur[i + 1] = mean[1]
        cur[i + 2] = mean[2]
      } else {
        cur[i] = data[p]
        cur[i + 1] = data[p + 1]
        cur[i + 2] = data[p + 2]
      }
    }
  }
  next.set(cur)

  // Jacobi relaxation of the Laplace equation on the hole
  for (let it = 0; it < iterations; it++) {
    for (let y = 1; y < bh - 1; y++) {
      for (let x = 1; x < bw - 1; x++) {
        if (!unknown[y * bw + x]) continue
        const i = (y * bw + x) * 3
        const l = i - 3
        const r = i + 3
        const u = i - bw * 3
        const d = i + bw * 3
        next[i] = (cur[l] + cur[r] + cur[u] + cur[d]) * 0.25
        next[i + 1] = (cur[l + 1] + cur[r + 1] + cur[u + 1] + cur[d + 1]) * 0.25
        next[i + 2] = (cur[l + 2] + cur[r + 2] + cur[u + 2] + cur[d + 2]) * 0.25
      }
    }
    cur.set(next)
  }

  // Diffusion alone leaves a flat disc that reads as a smudge against grainy,
  // textured surroundings. Borrow the high frequency detail from a clean donor
  // patch to the left of the mark and add it back on top of the smooth fill.
  const dox = -2 * ring // donor offset, entirely clear of the sparkle
  const detail = extractDetail(data, w, h, x0 + dox, y0, bw, bh)

  // write back, feathering the last pixels into the plate so the seam cannot
  // register as an edge
  const feather = 8
  for (let y = 0; y < bh; y++) {
    for (let x = 0; x < bw; x++) {
      const dist = Math.hypot(x0 + x - cx, y0 + y - cy)
      if (dist > hole) continue
      let a = 1
      if (dist > hole - feather) {
        const t = 1 - (dist - (hole - feather)) / feather
        a = t * t * (3 - 2 * t)
      }
      const i = (y * bw + x) * 3
      const p = ((y0 + y) * w + (x0 + x)) * 3
      for (let c = 0; c < 3; c++) {
        const filled = clamp8(cur[i + c] + detail[i + c] * 0.6)
        data[p + c] = Math.round(data[p + c] * (1 - a) + filled * a)
      }
    }
  }
}

const clamp8 = (v) => (v < 0 ? 0 : v > 255 ? 255 : v)

/**
 * donor detail = donor - blur(donor), a zero mean texture field carrying the
 * grain and micro contrast of the plate at this exact position in the frame
 */
function extractDetail(data, w, h, dx, dy, bw, bh) {
  const src = new Float32Array(bw * bh * 3)
  for (let y = 0; y < bh; y++) {
    for (let x = 0; x < bw; x++) {
      const sx = Math.min(w - 1, Math.max(0, dx + x))
      const sy = Math.min(h - 1, Math.max(0, dy + y))
      const p = (sy * w + sx) * 3
      const i = (y * bw + x) * 3
      src[i] = data[p]
      src[i + 1] = data[p + 1]
      src[i + 2] = data[p + 2]
    }
  }
  const blurred = boxBlur(src, bw, bh, 3, 2)
  const out = new Float32Array(bw * bh * 3)
  for (let i = 0; i < out.length; i++) out[i] = src[i] - blurred[i]
  return out
}

/** separable box blur, `passes` repeats approximate a gaussian */
function boxBlur(src, w, h, radius, passes) {
  let cur = Float32Array.from(src)
  let tmp = new Float32Array(src.length)
  for (let p = 0; p < passes; p++) {
    blurAxis(cur, tmp, w, h, radius, true)
    blurAxis(tmp, cur, w, h, radius, false)
  }
  return cur
}

function blurAxis(src, dst, w, h, r, horizontal) {
  const outer = horizontal ? h : w
  const inner = horizontal ? w : h
  const step = horizontal ? 3 : w * 3
  for (let o = 0; o < outer; o++) {
    const base = horizontal ? o * w * 3 : o * 3
    for (let c = 0; c < 3; c++) {
      let sum = 0
      let n = 0
      for (let i = 0; i <= r && i < inner; i++) {
        sum += src[base + i * step + c]
        n++
      }
      for (let i = 0; i < inner; i++) {
        dst[base + i * step + c] = sum / n
        const add = i + r + 1
        const rem = i - r
        if (add < inner) {
          sum += src[base + add * step + c]
          n++
        }
        if (rem >= 0) {
          sum -= src[base + rem * step + c]
          n--
        }
      }
    }
  }
}
