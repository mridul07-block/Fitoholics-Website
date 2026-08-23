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

const webp = (out, quality) => ({ out, quality })

async function main() {
  await fs.mkdir(BRAND, { recursive: true })

  // ---- display assets, WebP with alpha ----
  const display = [
    // the preloader draws the mark at up to ~280 css px, so 640 covers 2x
    { src: MARK, width: 640, ...webp(path.join(BRAND, 'mark.webp'), 86) },
    // the fixed corner mark is ~34 css px; its own file keeps the big one out
    // of the critical path on small screens
    { src: MARK, width: 96, ...webp(path.join(BRAND, 'mark-sm.webp'), 88) },
    // the footer lockup renders at ~260 css px wide
    { src: LOCKUP, width: 720, ...webp(path.join(BRAND, 'lockup.webp'), 88) },
  ]

  for (const d of display) {
    await sharp(d.src)
      .resize({ width: d.width, withoutEnlargement: true })
      .webp({ quality: d.quality, effort: 6, alphaQuality: 100 })
      .toFile(d.out)
  }

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

  // ---- report, so the preloader's byte budget is a measured number ----
  const rows = []
  for (const f of [
    'brand/mark.webp',
    'brand/mark-sm.webp',
    'brand/lockup.webp',
    'favicon-16.png',
    'favicon-32.png',
    'favicon-48.png',
    'apple-touch-icon.png',
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
