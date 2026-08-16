/**
 * In-page performance harness (§11 measurement, per client decision:
 * gstack browse + PerformanceObserver instead of CDP tracing).
 *
 * window.__perfTrace(ms) scrolls nothing itself — the caller scripts the
 * scroll — it just measures: rAF-derived FPS, long tasks > 80ms, layout
 * shift score, and film draw deltas over the window.
 */

interface PerfReport {
  ms: number
  frames: number
  fps: number
  longTasks: number
  worstLongTaskMs: number
  cls: number
  drawsDelta: number
}

declare global {
  interface Window {
    __perfTrace?: (ms: number) => Promise<PerfReport>
  }
}

export function installPerfTrace(): void {
  if (!import.meta.env.DEV || window.__perfTrace) return

  let cls = 0
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const e = entry as PerformanceEntry & { value: number; hadRecentInput: boolean }
        if (!e.hadRecentInput) cls += e.value
      }
    }).observe({ type: 'layout-shift', buffered: true })
  } catch {
    /* layout-shift unsupported */
  }

  window.__perfTrace = (ms: number) =>
    new Promise<PerfReport>((resolve) => {
      let frames = 0
      let longTasks = 0
      let worst = 0
      const drawsStart = window.__filmStats?.draws ?? 0
      let obs: PerformanceObserver | null = null
      try {
        obs = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 80) {
              longTasks++
              worst = Math.max(worst, entry.duration)
            }
          }
        })
        obs.observe({ type: 'longtask' })
      } catch {
        /* longtask unsupported */
      }

      const t0 = performance.now()
      const count = () => {
        frames++
        if (performance.now() - t0 < ms) requestAnimationFrame(count)
        else {
          obs?.disconnect()
          const elapsed = performance.now() - t0
          resolve({
            ms: Math.round(elapsed),
            frames,
            fps: Math.round((frames / elapsed) * 1000),
            longTasks,
            worstLongTaskMs: Math.round(worst),
            cls: Math.round(cls * 1000) / 1000,
            drawsDelta: (window.__filmStats?.draws ?? 0) - drawsStart,
          })
        }
      }
      requestAnimationFrame(count)
    })
}
