/**
 * Motion state, published to CSS as `data-motion` on the root element.
 *
 * Glass is expensive over a scrubbing film. `docs/SCROLL_SMOOTHNESS.md` has the
 * paired measurement: `backdrop-filter` on the testimonial cards took p95 from
 * 36ms to 70ms, because the compositor re-rasterises the blurred backdrop on
 * every frame the film advances.
 *
 * But that cost is only ever paid while the page is moving — and while the page
 * is moving, nobody is reading a card. So the blur is spent where it is worth
 * something and reclaimed where it is not: surfaces are glass when the film is
 * still, and flat while it scrubs. The switch happens under motion, which is
 * exactly when an abrupt change to the backdrop cannot be seen.
 *
 * Hysteresis in both directions, so a slow drag cannot flicker the state:
 * motion is declared immediately, stillness only after the film has actually
 * settled.
 */
import { initSpine, prefersReducedMotion } from '../film/useMasterProgress'

/** frames/sec of film travel below which the page counts as settling */
const STILL_BELOW = 4
/** how long it must stay there before glass returns */
const SETTLE_MS = 220

let installed = false

export function initStillness(): void {
  if (installed) return
  installed = true

  const root = document.documentElement

  // Under reduced motion the film does not scrub, so the page is always the
  // still case and the state never needs to change.
  if (prefersReducedMotion()) {
    root.dataset.motion = 'still'
    return
  }

  root.dataset.motion = 'still'
  let still = true
  let settlingSince = 0

  initSpine().clock.onTick((c) => {
    const moving = Math.abs(c.velocity) > STILL_BELOW

    if (moving) {
      settlingSince = 0
      if (still) {
        still = false
        root.dataset.motion = 'scrubbing'
      }
      return
    }

    if (still) return
    const now = performance.now()
    if (!settlingSince) settlingSince = now
    if (now - settlingSince >= SETTLE_MS) {
      still = true
      root.dataset.motion = 'still'
    }
  })
}
