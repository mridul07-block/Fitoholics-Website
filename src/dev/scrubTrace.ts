/**
 * Scrub smoothness harness, dev only.
 *
 * Average FPS is close to useless for judging a scrubbed film: 60 fps with one
 * 90 ms hitch per second reads as broken, and 50 fps with perfectly even pacing
 * reads as smooth. What matters is the distribution of frame intervals and how
 * often the film is forced off the continuous path.
 *
 * window.__scrubTrace(ms) reports:
 *   p50/p95/p99/max  frame interval, in ms — pacing, not throughput
 *   jank             frames longer than 2x the median (a visible hitch)
 *   stalls           playhead reached an undecoded frame; the film froze
 *   blendMisses      next frame absent, so blend was forced to 0 and the film
 *                    stepped instead of moving continuously
 *   uploads/uploadMs GPU texture upload count and total cost
 *   idx              how far the playhead actually travelled
 */
import { scrubDiag } from '../film/Canvas2DRenderer'

interface ScrubReport {
  ms: number
  frames: number
  fps: number
  p50: number
  p95: number
  p99: number
  max: number
  jank: number
  jankPct: number
  stalls: number
  blendMisses: number
  blendMissPct: number
  uploads: number
  avgUploadMs: number
  draws: number
  idxFrom: number
  idxTo: number
  renderer: string
}

declare global {
  interface Window {
    __scrubTrace?: (ms: number) => Promise<ScrubReport>
    __filmClock?: { index: number; blend: number; velocity: number; smoothed: number }
    __filmRenderer?: string
  }
}

const pct = (sorted: number[], p: number): number =>
  sorted.length ? Math.round(sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))]! * 100) / 100 : 0

export function installScrubTrace(): void {
  if (!import.meta.env.DEV || window.__scrubTrace) return

  window.__scrubTrace = (ms: number) =>
    new Promise<ScrubReport>((resolve) => {
      const intervals: number[] = []
      const d0 = { ...scrubDiag }
      const drawsStart = window.__filmStats?.draws ?? 0
      const idxFrom = window.__filmClock?.index ?? 0
      let last = performance.now()
      const t0 = last

      const tick = () => {
        const now = performance.now()
        intervals.push(now - last)
        last = now
        if (now - t0 < ms) {
          requestAnimationFrame(tick)
          return
        }
        const elapsed = now - t0
        const sorted = [...intervals].sort((a, b) => a - b)
        const median = pct(sorted, 0.5)
        const jank = intervals.filter((v) => v > median * 2 && v > 24).length
        const blendMisses = scrubDiag.blendMisses - d0.blendMisses
        const draws = (window.__filmStats?.draws ?? 0) - drawsStart
        const uploads = scrubDiag.uploads - d0.uploads
        resolve({
          ms: Math.round(elapsed),
          frames: intervals.length,
          fps: Math.round((intervals.length / elapsed) * 1000),
          p50: median,
          p95: pct(sorted, 0.95),
          p99: pct(sorted, 0.99),
          max: Math.round(sorted[sorted.length - 1] ?? 0),
          jank,
          jankPct: Math.round((jank / Math.max(1, intervals.length)) * 1000) / 10,
          stalls: scrubDiag.stalls - d0.stalls,
          blendMisses,
          blendMissPct: Math.round((blendMisses / Math.max(1, draws)) * 1000) / 10,
          uploads,
          avgUploadMs: uploads ? Math.round(((scrubDiag.uploadMs - d0.uploadMs) / uploads) * 100) / 100 : 0,
          draws,
          idxFrom,
          idxTo: window.__filmClock?.index ?? 0,
          renderer: window.__filmRenderer ?? 'unknown',
        })
      }
      requestAnimationFrame(tick)
    })
}
