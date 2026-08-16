/**
 * encode-frames.mjs — frame pipeline for the Ikram Ansari film page.
 *
 * Source (read-only): video frame/ezgif-frame-%03d.jpg  (001..300, 1920x1080)
 * Pipeline:
 *   1. patch out the generator sparkle watermark at x 1704..1775 / y 864..935
 *      (feathered blur fill; cropping it out would cost 20% of frame height)
 *   2. no decimation — all 300 frames ship, for continuous scrub
 *   3. WebP at three tiers  1920x1080 · 1280x720 · 854x480
 *
 * Emits: public/film/{1920,1280,854}/f_000..f_299.webp, manifest.json,
 *        contact-sheet.webp, src/film/manifest.gen.ts, tools/encode-report.txt
 *
 * Run: (cd tools && npm install) then: node tools/encode-frames.mjs
 */
import sharp from 'sharp'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'
import { inpaintWatermark, WM } from './wm-inpaint.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const SRC_DIR = path.join(ROOT, 'video frame')
const OUT_DIR = path.join(ROOT, 'public', 'film')

const SRC_W = 1920
const SRC_H = 1080
const COUNT = 300
const PAD = 3
const PATTERN = 'f_%03d.webp'
const TIERS = [
  { id: 'xl', dir: '1920', width: 1920, height: 1080, quality: 52 },
  { id: 'lg', dir: '1280', width: 1280, height: 720, quality: 56 },
  { id: 'sm', dir: '854', width: 854, height: 480, quality: 60 },
]

/**
 * Hard cuts measured from the source (mean abs thumbnail diff > 18).
 * Frame N is the FIRST frame of the new shot.
 */
const CUTS = [55, 99, 140, 195, 240]
/** one keyframe per act — the reduced motion film is exactly these six frames */
const HERO_FRAMES = [22, 72, 118, 168, 216, 276]

const srcPath = (n) => path.join(SRC_DIR, `ezgif-frame-${String(n + 1).padStart(3, '0')}.jpg`)
const outName = (n) => `f_${String(n).padStart(PAD, '0')}.webp`

if (path.resolve(OUT_DIR).startsWith(path.resolve(SRC_DIR))) {
  throw new Error('Refusing to write inside the source directory.')
}

async function pool(items, limit, worker) {
  const queue = [...items.entries()]
  const runners = Array.from({ length: limit }, async () => {
    for (;;) {
      const next = queue.shift()
      if (!next) return
      await worker(next[1], next[0])
    }
  })
  await Promise.all(runners)
}

/** decode one source frame and return a watermark-free raw RGB buffer */
async function loadPatched(n) {
  const { data, info } = await sharp(srcPath(n)).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  inpaintWatermark(data, info.width, info.height)
  return { data, info }
}

async function main() {
  const t0 = Date.now()
  const probe = await sharp(srcPath(0)).metadata()
  if (probe.width !== SRC_W || probe.height !== SRC_H) {
    throw new Error(`Unexpected source geometry ${probe.width}x${probe.height}, expected ${SRC_W}x${SRC_H}`)
  }
  const last = await fs.stat(srcPath(COUNT - 1)).catch(() => null)
  if (!last) throw new Error(`Missing source frame ${COUNT}`)

  for (const t of TIERS) await fs.mkdir(path.join(OUT_DIR, t.dir), { recursive: true })
  // stale output from the previous 299-frame sequence would silently ship
  for (const t of TIERS) {
    const dir = path.join(OUT_DIR, t.dir)
    for (const f of await fs.readdir(dir)) {
      if (f.endsWith('.webp')) await fs.unlink(path.join(dir, f))
    }
  }

  let done = 0
  await pool(Array.from({ length: COUNT }, (_, n) => n), Math.max(2, os.cpus().length - 1), async (n) => {
    const { data, info } = await loadPatched(n)
    await Promise.all(
      TIERS.map((t) =>
        sharp(data, { raw: info })
          .resize(t.width, t.height, { fit: 'cover', kernel: 'lanczos3' })
          .webp({ quality: t.quality, effort: 6, smartSubsample: true })
          .toFile(path.join(OUT_DIR, t.dir, outName(n))),
      ),
    )
    if (++done % 25 === 0) console.log(`  ${done}/${COUNT} frames encoded`)
  })

  const tiers = []
  for (const t of TIERS) {
    let total = 0
    for (let n = 0; n < COUNT; n++) {
      total += (await fs.stat(path.join(OUT_DIR, t.dir, outName(n)))).size
    }
    tiers.push({
      id: t.id,
      dir: `/film/${t.dir}`,
      width: t.width,
      height: t.height,
      totalBytes: total,
      avgBytes: Math.round(total / COUNT),
    })
  }

  // LQIP: 24px-wide webp data URI per act hero frame
  const lqip = []
  for (const h of HERO_FRAMES) {
    const b = await sharp(path.join(OUT_DIR, '854', outName(h)))
      .resize(24, 14, { fit: 'cover' })
      .webp({ quality: 40 })
      .toBuffer()
    lqip.push(`data:image/webp;base64,${b.toString('base64')}`)
  }

  // contact sheet from the sm tier, for eyeballing the whole film at once
  const CW = 240
  const CH = 135
  const ROWS = Math.ceil(COUNT / 10)
  const composites = []
  for (let n = 0; n < COUNT; n++) {
    composites.push({
      input: await sharp(path.join(OUT_DIR, '854', outName(n))).resize(CW, CH).toBuffer(),
      left: (n % 10) * CW,
      top: Math.floor(n / 10) * CH,
    })
  }
  await sharp({ create: { width: CW * 10, height: CH * ROWS, channels: 3, background: '#0B0705' } })
    .composite(composites)
    .webp({ quality: 72 })
    .toFile(path.join(OUT_DIR, 'contact-sheet.webp'))

  const manifest = {
    version: 2,
    count: COUNT,
    padding: PAD,
    pattern: PATTERN,
    ext: 'webp',
    watermarkPatch: WM,
    tiers,
    cuts: CUTS,
    heroFrames: HERO_FRAMES,
    lqip,
  }
  await fs.writeFile(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2))

  const genTs = [
    '// GENERATED by tools/encode-frames.mjs — do not edit by hand. Re-run the encoder instead.',
    'export const FILM_GEN = ' + JSON.stringify(manifest, null, 2) + ' as const',
    '',
  ].join('\n')
  await fs.mkdir(path.join(ROOT, 'src', 'film'), { recursive: true })
  await fs.writeFile(path.join(ROOT, 'src', 'film', 'manifest.gen.ts'), genTs)

  const mb = (b) => (b / 1024 / 1024).toFixed(2)
  const kb = (b) => (b / 1024).toFixed(1)
  const report = [
    `encode-frames report · ${new Date().toISOString()}`,
    `source: ${SRC_W}x${SRC_H}, ${COUNT} frames, no decimation`,
    `watermark: diffusion inpaint r${WM.hole} at ${WM.cx},${WM.cy} (sparkle bbox 1704..1775 x 864..935)`,
    `cuts: ${CUTS.join(', ')}`,
    ...tiers.map((t) => `tier ${t.id} ${t.width}x${t.height}: total ${mb(t.totalBytes)} MB, avg ${kb(t.avgBytes)} KB/frame`),
    `elapsed: ${((Date.now() - t0) / 1000).toFixed(1)}s`,
  ].join('\n')
  await fs.writeFile(path.join(__dirname, 'encode-report.txt'), report)
  console.log('\n' + report)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
