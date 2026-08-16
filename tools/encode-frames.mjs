/**
 * encode-frames.mjs — one-shot frame pipeline for the Ikram Ansari film page.
 *
 * Source (read-only): ../video frames/ezgif-frame-%03d.jpg  (001..299, 2560x1440)
 * Approved pipeline (client, 2026-08-16):
 *   1. crop ~6% off bottom + right  -> 2406x1354 (removes the Veo watermark, bottom-right)
 *   2. decimate 299 -> 150          (odd source frames 1,3,...,299)
 *   3. WebP at three tiers          1920x1080 q68 · 1280x720 q70 · 854x480 q72
 * Emits: public/film/{1920,1280,854}/f_000..f_149.webp, manifest.json,
 *        contact-sheet.webp, and tools/encode-report.txt
 *
 * Run: npm install (in tools/), then: node tools/encode-frames.mjs
 */
import sharp from 'sharp'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const SRC_DIR = path.join(ROOT, 'video frames')
const OUT_DIR = path.join(ROOT, 'public', 'film')

const CROP = { left: 0, top: 0, width: 2406, height: 1354 } // 2560x1440 minus ~6% right+bottom
const COUNT = 150
const PAD = 3
const PATTERN = 'f_%03d.webp'
const TIERS = [
  { id: 'xl', dir: '1920', width: 1920, height: 1080, quality: 45 },
  { id: 'lg', dir: '1280', width: 1280, height: 720, quality: 50 },
  { id: 'sm', dir: '854', width: 854, height: 480, quality: 55 },
]
// 150-space hero frames, one per narrative beat (see src/film/beats.ts)
// B1 mirror · B2 threshold · B3 welcome · B4 assessment · B5 tools · B6 work · B7 table · B8 rhythm · B9 proof
const HERO_FRAMES = [7, 20, 30, 46, 62, 75, 97, 113, 140]

const srcIndex = (n) => 1 + n * 2 // new index n (0..149) -> source frame 1,3,...,299
const srcPath = (i) => path.join(SRC_DIR, `ezgif-frame-${String(i).padStart(3, '0')}.jpg`)
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

async function main() {
  const t0 = Date.now()
  // sanity: source present and expected geometry
  const probe = await sharp(srcPath(1)).metadata()
  if (probe.width !== 2560 || probe.height !== 1440) {
    throw new Error(`Unexpected source geometry ${probe.width}x${probe.height}, expected 2560x1440`)
  }
  for (const t of TIERS) await fs.mkdir(path.join(OUT_DIR, t.dir), { recursive: true })

  let done = 0
  await pool(Array.from({ length: COUNT }, (_, n) => n), Math.max(2, os.cpus().length - 1), async (n) => {
    const cropped = sharp(srcPath(srcIndex(n))).extract(CROP)
    const buf = await cropped.toBuffer() // decode+crop once, resize three times
    await Promise.all(
      TIERS.map((t) =>
        sharp(buf)
          .resize(t.width, t.height, { fit: 'cover', kernel: 'lanczos3' })
          .webp({ quality: t.quality, effort: 6, smartSubsample: true })
          .toFile(path.join(OUT_DIR, t.dir, outName(n)))
      )
    )
    if (++done % 25 === 0) console.log(`  ${done}/${COUNT} frames encoded`)
  })

  // per-tier byte accounting
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

  // LQIP: 24px-wide webp data URI per beat hero frame
  const lqip = []
  for (const h of HERO_FRAMES) {
    const b = await sharp(path.join(OUT_DIR, '854', outName(h)))
      .resize(24, 14, { fit: 'cover' })
      .webp({ quality: 40 })
      .toBuffer()
    lqip.push(`data:image/webp;base64,${b.toString('base64')}`)
  }

  // contact sheet: 10 x 15 grid of 240x135 thumbs, from the sm tier
  const CW = 240, CH = 135
  const composites = []
  for (let n = 0; n < COUNT; n++) {
    composites.push({
      input: await sharp(path.join(OUT_DIR, '854', outName(n))).resize(CW, CH).toBuffer(),
      left: (n % 10) * CW,
      top: Math.floor(n / 10) * CH,
    })
  }
  await sharp({ create: { width: CW * 10, height: CH * 15, channels: 3, background: '#100E0D' } })
    .composite(composites)
    .webp({ quality: 72 })
    .toFile(path.join(OUT_DIR, 'contact-sheet.webp'))

  const manifest = {
    version: 1,
    count: COUNT,
    padding: PAD,
    pattern: PATTERN,
    ext: 'webp',
    crop: CROP,
    tiers,
    sourceMap: Array.from({ length: COUNT }, (_, n) => srcIndex(n)),
    heroFrames: HERO_FRAMES,
    lqip,
  }
  await fs.writeFile(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2))

  // typed manifest for the app — src/film/manifest.gen.ts (single source of truth, §3.2)
  const genTs = [
    '// GENERATED by tools/encode-frames.mjs — do not edit by hand. Re-run the encoder instead.',
    'export const FILM_GEN = ' + JSON.stringify({ ...manifest, lqip: manifest.lqip }, null, 2) + ' as const',
    '',
  ].join('\n')
  await fs.mkdir(path.join(ROOT, 'src', 'film'), { recursive: true })
  await fs.writeFile(path.join(ROOT, 'src', 'film', 'manifest.gen.ts'), genTs)

  const mb = (b) => (b / 1024 / 1024).toFixed(2)
  const kb = (b) => (b / 1024).toFixed(1)
  const report = [
    `encode-frames report · ${new Date().toISOString()}`,
    `frames: ${COUNT} (decimated from 299, odd source indices)`,
    `crop: ${CROP.width}x${CROP.height} from 2560x1440 (Veo watermark removed)`,
    ...tiers.map(
      (t) =>
        `tier ${t.id} ${t.width}x${t.height}: total ${mb(t.totalBytes)} MB, avg ${kb(t.avgBytes)} KB/frame` +
        (t.id === 'xl' ? ` (target ~6 MB)` : t.id === 'sm' ? ` (target ~1.8 MB)` : ''),
    ),
    `elapsed: ${((Date.now() - t0) / 1000).toFixed(1)}s`,
  ].join('\n')
  await fs.writeFile(path.join(__dirname, 'encode-report.txt'), report)
  console.log('\n' + report)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
