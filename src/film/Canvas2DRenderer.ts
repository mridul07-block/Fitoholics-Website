/**
 * Canvas 2D film renderer (§7.4) — the fallback, ship quality on its own.
 *
 * Sub frame blending: draw frame A, then frame B at globalAlpha = blend.
 * Grade: CSS filter on the canvas element (compositor side, free).
 * Vignette and grain: one static CSS overlay element, painted once by the
 *   compositor. Compositing them into the 2D context every frame cost a full
 *   canvas multiply plus a blit per noise tile, for output that never changed.
 * Wash and atmosphere: gradient fills, the only per frame compositing left.
 * Never per pixel JS, never getImageData. Holds the last frame when the
 * playhead reaches undecoded footage — a held frame reads as a pause,
 * a blank flash reads as broken.
 */
import type { FrameSource } from './FrameLoader'

const DPR_CAP = 1.5
const GRAIN_SIZE = 128
/** must match MIN_WIDTH_FRAC in film.frag.glsl */
const MIN_WIDTH_FRAC = 0.46

/** one 128px noise tile as a data URI, built once at module scope */
let grainUri: string | null = null
function grainTileUri(): string {
  if (grainUri) return grainUri
  const c = document.createElement('canvas')
  c.width = GRAIN_SIZE
  c.height = GRAIN_SIZE
  const ctx = c.getContext('2d')!
  const img = ctx.createImageData(GRAIN_SIZE, GRAIN_SIZE)
  const d = img.data
  for (let i = 0; i < d.length; i += 4) {
    const v = (Math.random() * 255) | 0
    d[i] = v
    d[i + 1] = v
    d[i + 2] = v
    d[i + 3] = 12 // the grain's whole strength lives in the alpha
  }
  ctx.putImageData(img, 0, 0)
  grainUri = c.toDataURL('image/png')
  return grainUri
}

export type Rgb = readonly [number, number, number]

export interface FilmRenderState {
  index: number
  blend: number
  velocity: number
  wash: number
  /** act atmosphere, crossfaded by the clock; 0..1 rgb */
  atmTop: Rgb
  atmBottom: Rgb
  /** ember bloom strength for the act, 0..1 */
  glow: number
  /** how far the plate is pulled toward the ramp, 0..1 */
  grade: number
  /** where the crop centres horizontally, 0..1 in texture space */
  focalX: number
  /** 0..1 impulse fired on a hard cut in the footage */
  cut: number
  /** 0..1 night to morning, quantised to 1/256 by FilmLayer; see daylight.ts */
  daylight: number
}

export const css = (c: Rgb, a = 1): string =>
  `rgba(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)},${a})`

/**
 * Scrub diagnostics, shared by both renderers.
 *
 * `stalls` is the playhead reaching a frame that is not decoded, which shows as
 * the film freezing. `blendMisses` is the NEXT frame being absent, which forces
 * blend to 0 and turns continuous motion into visible frame stepping. Stepping
 * is the failure people describe as "not smooth" long before an actual freeze.
 */
export const scrubDiag = { stalls: 0, blendMisses: 0, uploads: 0, uploadMs: 0 }

export class Canvas2DRenderer {
  readonly kind = 'canvas2d' as const
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private source: FrameSource
  private overlay: HTMLDivElement | null = null
  private lastDrawnIndex = -1
  private lastBlend = -1
  private lastWash = -1
  private lastCut = 0
  private lastDaylight = -1
  /** the grade and overlay are element styles; rebuilt only when this moves */
  private lastDaylightQ = -1
  private overlayKey = ''
  private drawCount = 0
  /** cached atmosphere gradient, rebuilt only when the act colours move */
  private atmGrad: CanvasGradient | null = null
  private atmKey = ''

  constructor(host: HTMLElement, source: FrameSource) {
    this.source = source
    this.canvas = document.createElement('canvas')
    this.canvas.style.position = 'absolute'
    this.canvas.style.inset = '0'
    this.canvas.style.width = '100%'
    this.canvas.style.height = '100%'
    // decorative: the host is already aria-hidden, and the canvas says so itself
    this.canvas.setAttribute('aria-hidden', 'true')
    this.canvas.setAttribute('role', 'presentation')
    this.applyGrade(0)
    const ctx = this.canvas.getContext('2d', { alpha: false })
    if (!ctx) throw new Error('2d context unavailable')
    this.ctx = ctx
    this.ctx.imageSmoothingQuality = 'low'
    host.appendChild(this.canvas)
    this.buildOverlay(host)
    this.resize()
  }

  /**
   * Grade toward the ramp, compositor side (§7.4). sepia carries the plate
   * into the warm end, the hue rotation lands it on ember rather than tan.
   * As the day comes up the warm cast eases off and the plate is let brighter,
   * the cheap counterpart of the shader's grade and air (film.frag.glsl).
   */
  private applyGrade(daylight: number): void {
    const f = (v: number) => v.toFixed(3)
    this.canvas.style.filter =
      `sepia(${f(0.26 * (1 - 0.5 * daylight))}) hue-rotate(-14deg) saturate(${f(1.22 - 0.12 * daylight)}) ` +
      `contrast(${f(1.06 - 0.1 * daylight)}) brightness(${f(0.98 + 0.16 * daylight)})`
  }

  /**
   * Vignette and grain as one static, GPU composited element. Identical output
   * to compositing them per frame, at zero per frame cost.
   */
  private buildOverlay(host: HTMLElement): void {
    const el = document.createElement('div')
    el.setAttribute('aria-hidden', 'true')
    // fades in with the canvas (App.module.css .film[data-film-ready])
    el.dataset.filmOverlay = ''
    el.style.position = 'absolute'
    el.style.inset = '0'
    el.style.pointerEvents = 'none'
    el.style.backgroundRepeat = 'no-repeat, repeat'
    el.style.backgroundSize = 'cover, 128px 128px'
    el.style.opacity = '1'
    this.overlay = el
    host.appendChild(el)
    this.applyOverlay([0, 0, 0], 0)
  }

  /**
   * The vignette falls to the act ground, never to a neutral black that would
   * sit outside the palette — and it loosens as the light comes up, so a
   * daylit plate is not ringed by a dark smudge.
   */
  private applyOverlay(ground: Rgb, daylight: number): void {
    if (!this.overlay) return
    const edge = Number((0.45 - 0.25 * daylight).toFixed(3))
    this.overlay.style.backgroundImage =
      `radial-gradient(120% 88% at 50% 50%, ${css(ground, 0)} 42%, ${css(ground, edge)} 100%), url("${grainTileUri()}")`
  }

  resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP)
    const w = Math.round(this.canvas.clientWidth * dpr)
    const h = Math.round(this.canvas.clientHeight * dpr)
    if (w === this.canvas.width && h === this.canvas.height) return
    this.canvas.width = w
    this.canvas.height = h
    this.lastDrawnIndex = -1 // force redraw at new size
  }

  /** true = painted; false = held the previous frame */
  render(s: FilmRenderState): boolean {
    const unchanged =
      s.index === this.lastDrawnIndex &&
      Math.abs(s.blend - this.lastBlend) < 1 / 512 &&
      Math.abs(s.wash - this.lastWash) < 1e-3 &&
      Math.abs(s.cut - this.lastCut) < 1e-3 &&
      Math.abs(s.daylight - this.lastDaylight) < 1 / 256
    if (unchanged) return false

    // element styles, not canvas work: a handful of writes over the whole page
    const dq = Math.round(s.daylight * 32) / 32
    if (dq !== this.lastDaylightQ) {
      this.lastDaylightQ = dq
      this.applyGrade(dq)
    }
    const overlayKey = `${css(s.atmBottom)}|${dq}`
    if (overlayKey !== this.overlayKey) {
      this.overlayKey = overlayKey
      this.applyOverlay(s.atmBottom, dq)
    }

    const a = this.source.get(s.index)
    if (!a) {
      // hold: do not clear, do not draw
      scrubDiag.stalls++
      return false
    }
    const b = s.blend > 1 / 512 ? this.source.get(s.index + 1) : null
    if (s.blend > 1 / 512 && !b) scrubDiag.blendMisses++

    const { width: cw, height: ch } = this.canvas
    const ctx = this.ctx

    // ground first: on a portrait viewport the frame is zoomed out and does
    // not reach the top and bottom edges
    ctx.fillStyle = css(s.atmBottom)
    ctx.fillRect(0, 0, cw, ch)

    const band = this.drawFrame(a, cw, ch, s.focalX)
    if (b) {
      ctx.globalAlpha = s.blend
      this.drawFrame(b, cw, ch, s.focalX)
      ctx.globalAlpha = 1
    }

    // soften the letterbox edges so the frame dissolves into the ground
    // instead of ending on a ruled line (matches the shader's vertical fade)
    if (band.h < ch - 1) {
      const fade = Math.min(48, band.h * 0.12)
      const ground = css(s.atmBottom)
      const clear = css(s.atmBottom, 0)
      const top = ctx.createLinearGradient(0, band.y, 0, band.y + fade)
      top.addColorStop(0, ground)
      top.addColorStop(1, clear)
      ctx.fillStyle = top
      ctx.fillRect(0, band.y, cw, fade)
      const bot = ctx.createLinearGradient(0, band.y + band.h, 0, band.y + band.h - fade)
      bot.addColorStop(0, ground)
      bot.addColorStop(1, clear)
      ctx.fillStyle = bot
      ctx.fillRect(0, band.y + band.h - fade, cw, fade)
    }

    // Vignette and grain are NOT drawn here. Both are constant per frame, and
    // compositing them in the 2D context cost a full canvas multiply plus one
    // overlay blit per 256px tile, every frame. They live in a static CSS
    // overlay instead, which the compositor paints once and reuses.

    // atmosphere: the act's gradient added over the plate, so the film and the
    // page share one colour field (the shader does the same with uAtmTop/Bottom)
    const key = `${s.atmTop.join()}|${s.atmBottom.join()}|${ch}`
    if (key !== this.atmKey) {
      const g = ctx.createLinearGradient(0, 0, 0, ch)
      g.addColorStop(0, css(s.atmTop))
      g.addColorStop(1, css(s.atmBottom))
      this.atmGrad = g
      this.atmKey = key
    }
    // additive at night; screen once the air is bright, which lifts the blacks
    // to the ground and leaves white at white, so a daylit plate cannot blow
    // out (the shader crossfades between the same two)
    ctx.globalCompositeOperation = s.daylight >= 0.3 ? 'screen' : 'lighter'
    ctx.fillStyle = this.atmGrad!
    ctx.fillRect(0, 0, cw, ch)

    // ember bloom off the lower edge, strongest in the late acts
    if (s.glow > 0.01) {
      const bg = ctx.createLinearGradient(0, ch, 0, ch * 0.1)
      bg.addColorStop(0, `rgba(255,94,26,${(s.glow * 0.16).toFixed(3)})`)
      bg.addColorStop(1, 'rgba(255,94,26,0)')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, cw, ch)
    }
    ctx.globalCompositeOperation = 'source-over'

    // wash toward the act ground, never to a neutral black
    if (s.wash < 1) {
      ctx.globalAlpha = 1 - s.wash
      ctx.fillStyle = css(s.atmBottom)
      ctx.fillRect(0, 0, cw, ch)
      ctx.globalAlpha = 1
    }

    // cut flare: a fast wipe of light when the footage hard cuts
    if (s.cut > 0.001) {
      const x = (1 - s.cut) * cw * 1.2 + cw * 0.05
      const fg = ctx.createLinearGradient(x - cw * 0.24, 0, x + cw * 0.24, 0)
      fg.addColorStop(0, 'rgba(255,162,58,0)')
      fg.addColorStop(0.5, `rgba(255,162,58,${(s.cut * 0.3).toFixed(3)})`)
      fg.addColorStop(1, 'rgba(255,162,58,0)')
      ctx.globalCompositeOperation = 'lighter'
      ctx.fillStyle = fg
      ctx.fillRect(0, 0, cw, ch)
      ctx.globalCompositeOperation = 'source-over'
    }

    this.lastDrawnIndex = s.index
    this.lastBlend = s.blend
    this.lastWash = s.wash
    this.lastCut = s.cut
    this.lastDaylight = s.daylight
    this.drawCount++
    return true
  }

  get draws(): number {
    return this.drawCount
  }

  get lastIndex(): number {
    return this.lastDrawnIndex
  }

  dispose(): void {
    this.canvas.remove()
    this.overlay?.remove()
  }

  /**
   * Mirrors frameUv() in the fragment shader, so both renderers frame the film
   * identically: cover on a wide viewport, and on a portrait one a zoom out to
   * MIN_WIDTH_FRAC of the frame's width centred on the act's focal point, with
   * the uncovered strips left to the ground fill.
   */
  private drawFrame(bmp: ImageBitmap, cw: number, ch: number, focalX: number): { y: number; h: number } {
    const ra = cw / ch
    const ta = bmp.width / bmp.height
    let widthFrac: number
    if (ra > ta) {
      widthFrac = 1
    } else {
      widthFrac = Math.max(ra / ta, MIN_WIDTH_FRAC)
    }
    const half = widthFrac / 2
    const cx = Math.min(Math.max(focalX, half), 1 - half) * bmp.width
    const sw = bmp.width * widthFrac
    const scale = cw / sw
    const dw = bmp.width * scale
    const dh = bmp.height * scale
    const dy = (ch - dh) / 2
    this.ctx.drawImage(bmp, -(cx - sw / 2) * scale, dy, dw, dh)
    return { y: dy, h: dh }
  }


}
