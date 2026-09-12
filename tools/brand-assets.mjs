/**
 * brand-assets.mjs — derives every shipped brand asset from the client masters.
 *
 * Masters (read only, never shipped):
 *   FITOHOLIX LOGO Removed Background.png   2400x714  lockup, alpha
 *   favicon.png                             1320x1192 runner mark, alpha
 *
 * The masters are 340 KB and 478 KB of PNG. Nothing that size belongs in a
 * preloader, which has to paint before anything else on the page, so every
 * shipped size is derived here and committed as WebP.
 *
 * The runner is already tightly cropped (88% of its box is art), so it is not
 * re-trimmed — trimming would gain a couple of percent and lose the optical
 * breathing room the designer left around the figure.
 *
 * Apple touch icons are composited onto the page's own ground rather than left
 * transparent: iOS does not honour alpha there and would otherwise flatten the
 * mark onto white, which is not a surface this brand ever sits on.
 *
 * Run: node tools/brand-assets.mjs
 */
import sharp from 'sharp'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const PUBLIC = path.join(ROOT, 'public')
const BRAND = path.join(PUBLIC, 'brand')

const MARK = path.join(ROOT, 'favicon.png')
const LOCKUP = path.join(ROOT, 'FITOHOLIX LOGO Removed Background.png')

/** the ground the icon sits on where alpha is not honoured (iOS home screen) */
const GROUND = { r: 10, g: 7, b: 16, alpha: 1 }

/** --bone from tokens.css, the one type colour that holds the whole arc */
const BONE = [0xf7, 0xf1, 0xe9]

/**
 * Anything below this saturation is the strapline, not the brand.
 * The master holds exactly two kinds of ink: the runner and FITOHOLIX are
 * saturated orange (measured 0.8–1.0), and "FIT FOR LIFE" is a flat #555555
 * at 0.0. There is nothing in between, so the split is unambiguous.
 */
const NEUTRAL_MAX_SAT = 0.18

const webp = (out, quality) => ({ out, quality })

/**
 * Relight the lockup for a dark ground, and report where its parts are.
 *
 * The master was drawn for white stationery: "FIT FOR LIFE" is #555555, which
 * lands at about 1.6:1 on this page's ground and simply is not there. Every
 * dark-ground variant recolours that line and leaves alpha untouched, so the
 * antialiased edges stay smooth and the letterforms do not thicken.
 *
 * It is recoloured to --bone, and the reason is the daylight arc. This page has
 * no single ground: it travels from #08060A at the top to #5E4C40 at the close
 * (film/daylight.ts), and the footer lockup sits at the lit end, where the
 * bright film also reads through the glass — the ground behind it measures
 * about #705445 in practice. A baked image cannot follow --daylight the way the
 * CSS tokens do, so it has to pick one value that survives both ends. --stone
 * does not: it is comfortable at the top (≈7.4:1) and gone at the bottom
 * (measured 2.5:1, which is what the strapline looked like). --bone is the
 * colour this page defines as constant for exactly this reason, and it clears
 * the floor everywhere the lockup appears — ≈18:1 in the masthead, ≈6.2:1 in
 * the footer.
 *
 * Only low-saturation pixels move. The runner contains none — measured, its
 * darkest shading still reads 0.6 saturation — so the figure and the orange
 * wordmark come through bit for bit.
 *
 * It also returns the two bounding boxes, measured rather than hardcoded, so
 * the wordmark crop below survives the client redrawing the file.
 */
async function relight(src) {
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info

  // column coverage first, to find the gutter between the runner and the words
  const cols = new Float64Array(width)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) cols[x] += data[(y * width + x) * channels + 3]
  }
  const peak = Math.max(...cols)
  // the first empty gutter wide enough to be a gap and not a letter space
  let split = 0
  for (let x = 0, run = 0; x < width; x++) {
    if (cols[x] / peak < 0.005) {
      if (++run > 12) { split = x - run + 1; break }
    } else run = 0
  }
  if (!split) throw new Error('brand-assets: no gutter found between the mark and the wordmark')

  // repaint the strapline and measure the wordmark half in one pass
  let x0 = width, x1 = 0, y0 = height, y1 = 0
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels
      const a = data[i + 3]
      if (a < 8) continue
      if (x >= split) {
        if (x < x0) x0 = x
        if (x > x1) x1 = x
        if (y < y0) y0 = y
        if (y > y1) y1 = y
      }
      const r = data[i], g = data[i + 1], b = data[i + 2]
      const mx = Math.max(r, g, b)
      if (mx === 0 || (mx - Math.min(r, g, b)) / mx >= NEUTRAL_MAX_SAT) continue
      data[i] = BONE[0]
      data[i + 1] = BONE[1]
      data[i + 2] = BONE[2]
    }
  }

  return {
    raw: { data, info: { width, height, channels } },
    wordmark: { left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 },
  }
}

/** a fresh sharp over the relit pixels — the buffer is reused, the pipeline is not */
const lit = (r) => sharp(r.data, { raw: { width: r.info.width, height: r.info.height, channels: r.info.channels } })

async function main() {
  await fs.mkdir(BRAND, { recursive: true })

  const relitLockup = await relight(LOCKUP)

  // ---- display assets, WebP with alpha ----
  // The runner alone, for the preloader, which draws it three times over to
  // light it from the feet up. It is the only place the figure appears without
  // the words: the masthead used to carry a 96px crop of it beside type, and
  // now carries the real lockup instead, so that size is no longer built.
  await sharp(MARK)
    .resize({ width: 640, withoutEnlargement: true })
    .webp({ quality: 86, effort: 6, alphaQuality: 100 })
    .toFile(path.join(BRAND, 'mark.webp'))

  // The full lockup. It carries the masthead now as well as the footer, and the
  // masthead is the larger of the two at ~200 css px, so 720 still covers 2x.
  await lit(relitLockup.raw)
    .resize({ width: 720, withoutEnlargement: true })
    .webp({ quality: 88, effort: 6, alphaQuality: 100 })
    .toFile(path.join(BRAND, 'lockup.webp'))

  // The wordmark alone, for the preloader — which already draws the runner
  // itself, three times over, to light it from the feet up. Cropping to the
  // measured box rather than reusing the lockup keeps the gate from paying for
  // a figure it is compositing separately, and lets the two sit at the sizes
  // the gate wants rather than at the ratio the stationery wants.
  await lit(relitLockup.raw)
    .extract(relitLockup.wordmark)
    .resize({ width: 560, withoutEnlargement: true })
    .webp({ quality: 88, effort: 6, alphaQuality: 100 })
    .toFile(path.join(BRAND, 'wordmark.webp'))

  // ---- favicons ----
  // PNG rather than ICO: every browser in support has taken PNG favicons for a
  // decade, and an ICO would mean shipping a second encoder for one file.
  for (const size of [16, 32, 48]) {
    await sharp(MARK)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9 })
      .toFile(path.join(PUBLIC, `favicon-${size}.png`))
  }

  // iOS: opaque, and inset so the mark is not clipped by the rounded mask
  const inset = Math.round(180 * 0.16)
  const marked = await sharp(MARK)
    .resize(180 - inset * 2, 180 - inset * 2, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer()
  await sharp({ create: { width: 180, height: 180, channels: 4, background: GROUND } })
    .composite([{ input: marked, left: inset, top: inset }])
    .png({ compressionLevel: 9 })
    .toFile(path.join(PUBLIC, 'apple-touch-icon.png'))

  // ---- web app manifest icons, opaque like the iOS one ----
  for (const size of [192, 512]) {
    const pad = Math.round(size * 0.14)
    const figure = await sharp(MARK)
      .resize(size - pad * 2, size - pad * 2, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer()
    await sharp({ create: { width: size, height: size, channels: 4, background: GROUND } })
      .composite([{ input: figure, left: pad, top: pad }])
      .png({ compressionLevel: 9 })
      .toFile(path.join(PUBLIC, `icon-${size}.png`))
  }

  // ---- social cards ----
  // What a share of this page shows in WhatsApp, Instagram DMs and search:
  // the one daylit shot of the film (physical frame 276, THE PROOF), veiled
  // toward the ground so the lockup sits on something quiet, and the relit
  // lockup itself. No text: the title and description carry the words, and
  // a card that repeats them in a face nobody can read at 300px is noise.
  // Two shapes, because WhatsApp crops a landscape card to a square.
  const PLATE = path.join(PUBLIC, 'film', '1920', 'f_276.webp')
  const socialCard = async (out, w, h) => {
    const plate = await sharp(PLATE)
      .resize(w, h, { fit: 'cover', position: 'centre' })
      .modulate({ brightness: 0.62, saturation: 0.9 })
      .toBuffer()
    const lockup = await lit(relitLockup.raw)
      .resize({ width: Math.round(w * 0.42) })
      .png()
      .toBuffer()
    const lm = await sharp(lockup).metadata()
    const veil = Buffer.from(
      `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">` +
        `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">` +
        `<stop offset="0" stop-color="#08060A" stop-opacity="0.12"/>` +
        `<stop offset="0.55" stop-color="#08060A" stop-opacity="0.35"/>` +
        `<stop offset="1" stop-color="#08060A" stop-opacity="0.88"/>` +
        `</linearGradient></defs><rect width="${w}" height="${h}" fill="url(#g)"/></svg>`,
    )
    await sharp(plate)
      .composite([
        { input: veil },
        { input: lockup, left: Math.round(w * 0.06), top: h - lm.height - Math.round(h * 0.09) },
      ])
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(path.join(PUBLIC, out))
  }
  await socialCard('og.jpg', 1200, 630)
  await socialCard('og-square.jpg', 1080, 1080)

  // ---- report, so every shipped size is a measured number ----
  const rows = []
  for (const f of [
    'brand/mark.webp',
    'brand/lockup.webp',
    'brand/wordmark.webp',
    'favicon-16.png',
    'favicon-32.png',
    'favicon-48.png',
    'apple-touch-icon.png',
    'icon-192.png',
    'icon-512.png',
    'og.jpg',
    'og-square.jpg',
  ]) {
    const st = await fs.stat(path.join(PUBLIC, f))
    const m = await sharp(path.join(PUBLIC, f)).metadata()
    rows.push(`  ${f.padEnd(22)} ${String(m.width).padStart(4)}x${String(m.height).padEnd(4)} ${(st.size / 1024).toFixed(1)} KB`)
  }
  console.log('brand assets\n' + rows.join('\n'))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
