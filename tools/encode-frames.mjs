/**
 * encode-frames.mjs — frame pipeline for the Ikram Ansari film page.
 *
 * Two source sets, one per viewport orientation. They are the same edit: six
 * shots in the same order, cut at the same moments to within a frame, shot with
 * the same cast in the same rooms. Only the framing differs, so the page tells
 * one story and simply loads the plate that fits the screen.
 *
 *   landscape  video frame/   1920x1080  ->  1920 · 1280 · 854
 *   portrait   mobile_frame/  1080x1920  ->  810 · 608
 *
 * Sources are read only. Per set the pipeline is:
 *   1. inpaint the generator sparkle at that render's watermark centre
 *   2. no decimation — all 300 frames ship, for continuous scrub
 *   3. WebP at each tier, plus LQIP data URIs and a contact sheet
 *
 * Emits: public/film/<dir>/f_000..f_299.webp, manifest.json,
 *        contact-sheet[-portrait].webp, src/film/manifest.gen.ts,
 *        tools/encode-report.txt
 *
 * Run: (cd tools && npm install) then: node tools/encode-frames.mjs
 */
import sharp from 'sharp'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'
import { inpaintWatermark, WM, WM_LANDSCAPE, WM_PORTRAIT } from './wm-inpaint.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const OUT_DIR = path.join(ROOT, 'public', 'film')

const COUNT = 300
const PAD = 3
const PATTERN = 'f_%03d.webp'

/**
 * Portrait tier sizing is a three way trade between download, sharpness and
 * scroll robustness, because a decoded frame's bytes come straight out of the
 * loader's resident window.
 *
 * A phone canvas is about 780 px wide (390pt at the dpr 2 cap), and a cover fit
 * of a 9:16 plate on a 0.462 viewport shows 82.1% of the texture width, so 810
 * across gives 665 real pixels for 780 — a 1.17x upscale, against the 2.00x the
 * cropped landscape sm tier was producing. 1080 would be pixel exact, but at
 * 8.29 MB decoded per frame the resident window falls to 6 frames, below the
 * 14 frame lookahead the prefetcher is designed around, and fast flicks start
 * to step. 810 keeps the full window.
 */
const SETS = [
  {
    id: 'landscape',
    orientation: 'landscape',
    srcDir: path.join(ROOT, 'video frame'),
    srcW: 1920,
    srcH: 1080,
    wm: WM_LANDSCAPE,
    contactSheet: 'contact-sheet.webp',
    sheetTile: [240, 135],
    lqipSize: [24, 14],
    proxyDir: '854',
    tiers: [
      { id: 'xl', dir: '1920', width: 1920, height: 1080, quality: 52 },
      { id: 'lg', dir: '1280', width: 1280, height: 720, quality: 56 },
      { id: 'sm', dir: '854', width: 854, height: 480, quality: 60 },
    ],
  },
  {
    id: 'portrait',
    orientation: 'portrait',
    srcDir: path.join(ROOT, 'mobile_frame'),
    srcW: 1080,
    srcH: 1920,
    wm: WM_PORTRAIT,
    contactSheet: 'contact-sheet-portrait.webp',
    sheetTile: [108, 192],
    lqipSize: [14, 24],
    proxyDir: '608',
    tiers: [
      { id: 'pv', dir: '810', width: 810, height: 1440, quality: 56 },
      { id: 'pvs', dir: '608', width: 608, height: 1080, quality: 60 },
    ],
  },
]

/**
 * One keyframe per act — the reduced motion film is exactly these six frames.
 * Verified to fall inside the correct shot in BOTH sets despite the one frame
 * cut offset between them, so the two sets share this list.
 */
const HERO_FRAMES = [22, 72, 118, 168, 216, 276]

/** mean absolute thumbnail difference above this starts a new shot */
const CUT_THRESHOLD = 18

const srcPath = (set, n) => path.join(set.srcDir, `ezgif-frame-${String(n + 1).padStart(3, '0')}.jpg`)
const outName = (n) => `f_${String(n).padStart(PAD, '0')}.webp`

for (const set of SETS) {
  if (path.resolve(OUT_DIR).startsWith(path.resolve(set.srcDir))) {
    throw new Error(`Refusing to write inside the source directory (${set.id}).`)
  }
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
async function loadPatched(set, n) {
  const { data, info } = await sharp(srcPath(set, n)).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  inpaintWatermark(data, info.width, info.height, set.wm)
  return { data, info }
}

/**
 * Cuts measured from the plate rather than hardcoded, so each set reports its
 * own. The two differ by a frame, and that difference is deliberately absorbed
 * downstream: the act table keys off the landscape list, and one frame is 0.33%
 * of the film.
 */
async function detectCuts(set) {
  const W = 32
  const H = 32
  const thumbs = []
  await pool(Array.from({ length: COUNT }, (_, n) => n), Math.max(2, os.cpus().length - 1), async (n) => {
    thumbs[n] = await sharp(srcPath(set, n)).resize(W, H, { fit: 'fill' }).greyscale().raw().toBuffer()
  })
  const cuts = []
  for (let n = 1; n < COUNT; n++) {
    const a = thumbs[n - 1]
    const b = thumbs[n]
    let s = 0
    for (let p = 0; p < a.length; p++) s += Math.abs(a[p] - b[p])
    if (s / a.length > CUT_THRESHOLD) cuts.push(n)
  }
  return cuts
}

async function encodeSet(set) {
  const probe = await sharp(srcPath(set, 0)).metadata()
  if (probe.width !== set.srcW || probe.height !== set.srcH) {
    throw new Error(
      `${set.id}: unexpected source geometry ${probe.width}x${probe.height}, expected ${set.srcW}x${set.srcH}`,
    )
  }
  if (!(await fs.stat(srcPath(set, COUNT - 1)).catch(() => null))) {
    throw new Error(`${set.id}: missing source frame ${COUNT}`)
  }

  for (const t of set.tiers) await fs.mkdir(path.join(OUT_DIR, t.dir), { recursive: true })
  // stale output from an earlier sequence length would silently ship
  for (const t of set.tiers) {
    const dir = path.join(OUT_DIR, t.dir)
    for (const f of await fs.readdir(dir)) {
      if (f.endsWith('.webp')) await fs.unlink(path.join(dir, f))
    }
  }

  console.log(`\n${set.id}: ${set.srcW}x${set.srcH} -> ${set.tiers.map((t) => t.dir).join(', ')}`)
  let done = 0
  await pool(Array.from({ length: COUNT }, (_, n) => n), Math.max(2, os.cpus().length - 1), async (n) => {
    const { data, info } = await loadPatched(set, n)
    await Promise.all(
      set.tiers.map((t) =>
        sharp(data, { raw: info })
          .resize(t.width, t.height, { fit: 'cover', kernel: 'lanczos3' })
          .webp({ quality: t.quality, effort: 6, smartSubsample: true })
          .toFile(path.join(OUT_DIR, t.dir, outName(n))),
      ),
    )
    if (++done % 25 === 0) console.log(`  ${done}/${COUNT} frames encoded`)
  })

  const tiers = []
  for (const t of set.tiers) {
    let total = 0
    for (let n = 0; n < COUNT; n++) {
      total += (await fs.stat(path.join(OUT_DIR, t.dir, outName(n)))).size
    }
    tiers.push({
      id: t.id,
      orientation: set.orientation,
      dir: `/film/${t.dir}`,
      width: t.width,
      height: t.height,
      totalBytes: total,
      avgBytes: Math.round(total / COUNT),
    })
  }

  // LQIP: one tiny webp data URI per act hero frame, in this set's own shape.
  // A landscape LQIP behind a portrait film host would cover-crop to a smear
  // of the wrong part of the plate.
  const lqip = []
  for (const h of HERO_FRAMES) {
    const b = await sharp(path.join(OUT_DIR, set.proxyDir, outName(h)))
      .resize(set.lqipSize[0], set.lqipSize[1], { fit: 'cover' })
      .webp({ quality: 40 })
      .toBuffer()
    lqip.push(`data:image/webp;base64,${b.toString('base64')}`)
  }

  // contact sheet, for eyeballing the whole film and the watermark patch at once
  const [CW, CH] = set.sheetTile
  const ROWS = Math.ceil(COUNT / 10)
  const composites = []
  for (let n = 0; n < COUNT; n++) {
    composites.push({
      input: await sharp(path.join(OUT_DIR, set.proxyDir, outName(n))).resize(CW, CH).toBuffer(),
      left: (n % 10) * CW,
      top: Math.floor(n / 10) * CH,
    })
  }
  await sharp({ create: { width: CW * 10, height: CH * ROWS, channels: 3, background: '#0B0705' } })
    .composite(composites)
    .webp({ quality: 72 })
    .toFile(path.join(OUT_DIR, set.contactSheet))

  const cuts = await detectCuts(set)
  return { tiers, lqip, cuts }
}

async function main() {
  const t0 = Date.now()
  const built = new Map()
  for (const set of SETS) built.set(set.id, await encodeSet(set))

  const landscape = built.get('landscape')
  const portrait = built.get('portrait')

  const manifest = {
    version: 3,
    count: COUNT,
    padding: PAD,
    pattern: PATTERN,
    ext: 'webp',
    watermarkPatch: WM,
    watermarkPatchPortrait: WM_PORTRAIT,
    tiers: [...landscape.tiers, ...portrait.tiers],
    cuts: landscape.cuts,
    cutsPortrait: portrait.cuts,
    heroFrames: HERO_FRAMES,
    lqip: landscape.lqip,
    lqipPortrait: portrait.lqip,
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
    `${COUNT} frames per set, no decimation`,
    '',
    ...SETS.flatMap((set) => {
      const b = built.get(set.id)
      return [
        `${set.id}  source ${set.srcW}x${set.srcH} from ${path.basename(set.srcDir)}/`,
        `  watermark: diffusion inpaint r${set.wm.hole} at ${set.wm.cx},${set.wm.cy}`,
        `  cuts: ${b.cuts.join(', ')}`,
        ...b.tiers.map(
          (t) => `  tier ${t.id} ${t.width}x${t.height}: total ${mb(t.totalBytes)} MB, avg ${kb(t.avgBytes)} KB/frame`,
        ),
        '',
      ]
    }),
    `hero frames (shared): ${HERO_FRAMES.join(', ')}`,
    `elapsed: ${((Date.now() - t0) / 1000).toFixed(1)}s`,
  ].join('\n')
  await fs.writeFile(path.join(__dirname, 'encode-report.txt'), report)
  console.log('\n' + report)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
