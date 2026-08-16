/**
 * rafAudit — proves the "exactly one requestAnimationFrame loop" law (§7.1).
 *
 * Imported as the FIRST line of main.tsx, dev builds only (tree shaken in prod
 * behind import.meta.env.DEV). Monkey patches window.requestAnimationFrame
 * before any library loads, buckets calls per callsite per second, and reports
 * persistent loops via window.__rafAudit().
 *
 * A callsite sustaining >= 50 calls/s over 3 consecutive seconds is a
 * persistent loop. The gate: exactly one, resolving inside gsap's ticker.
 */

interface LoopReport {
  key: string
  callsPerSec: number
  sustainedSeconds: number
  sampleStack: string
}

interface RafAuditResult {
  loops: LoopReport[]
  transient: LoopReport[]
}

declare global {
  interface Window {
    __rafAudit?: () => RafAuditResult
  }
}

export function installRafAudit(): void {
  if (!import.meta.env.DEV) return
  if (window.__rafAudit) return

  const buckets = new Map<string, { count: number; sustained: number; lastSec: number; stack: string }>()
  let currentSec = Math.floor(performance.now() / 1000)
  let sampleCounter = 0

  const native = window.requestAnimationFrame.bind(window)

  window.requestAnimationFrame = (cb: FrameRequestCallback): number => {
    // Derive a callsite key. Stack capture is the cost — sample 1 in 4 after warmup.
    sampleCounter++
    let key = 'unsampled'
    let stack = ''
    if (sampleCounter < 200 || sampleCounter % 4 === 0) {
      stack = new Error().stack ?? ''
      const lines = stack.split('\n')
      // frame 0 = Error, 1 = this wrapper, 2 = caller
      key = (lines[2] ?? 'unknown').trim().replace(/^at\s+/, '')
    } else {
      // attribute unsampled calls to the most recent sampled key to keep counts honest
      key = lastKey
    }
    lastKey = key

    const sec = Math.floor(performance.now() / 1000)
    if (sec !== currentSec) {
      // roll the second: promote sustained counts
      for (const b of buckets.values()) {
        if (b.lastSec === currentSec && b.count >= 50) b.sustained++
        else if (b.lastSec < currentSec) b.sustained = 0
        b.count = 0
      }
      currentSec = sec
    }
    let b = buckets.get(key)
    if (!b) {
      b = { count: 0, sustained: 0, lastSec: sec, stack }
      buckets.set(key, b)
    }
    b.count++
    b.lastSec = sec
    if (stack && !b.stack) b.stack = stack

    return native(cb)
  }

  let lastKey = 'boot'

  window.__rafAudit = (): RafAuditResult => {
    const loops: LoopReport[] = []
    const transient: LoopReport[] = []
    for (const [key, b] of buckets) {
      const report: LoopReport = {
        key,
        callsPerSec: b.count,
        sustainedSeconds: b.sustained,
        sampleStack: b.stack.split('\n').slice(0, 6).join('\n'),
      }
      if (b.sustained >= 3) loops.push(report)
      else if (b.count > 0 || b.sustained > 0) transient.push(report)
    }
    return { loops, transient }
  }
}
