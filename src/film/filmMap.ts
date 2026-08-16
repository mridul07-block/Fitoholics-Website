/**
 * Scroll position -> film progress, anchored to the sections themselves.
 *
 * The film's cuts are supposed to land on section boundaries, and that only
 * held while every section occupied exactly its specified fraction of the page.
 * `min-height` is a floor, not a size: whenever a section's content is taller
 * than its floor the section stretches, every later boundary slides, and the
 * copy stops landing on the shot it describes. On a phone that was badly out —
 * the table section measured 14.8% of the page against a 9.2% spec.
 *
 * So progress is no longer the raw scroll fraction. It is a piecewise linear
 * map pinned at the measured top of each section, sending that section's start
 * to its specified progress. Boundaries land where they are supposed to no
 * matter how tall the content turns out to be, at any breakpoint, in any
 * language, whatever the client does to the copy later.
 */
import { SECTION_RANGES, SECTIONS } from './beats'

interface Knot {
  /** scroll position in px */
  y: number
  /** film progress 0..1 at that scroll position */
  p: number
}

let knots: Knot[] = []

/** Rebuild from measured layout. Cheap; call on refresh and on resize. */
export function rebuildFilmMap(): void {
  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-station]'))
  const scrollMax = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)

  if (els.length !== SECTIONS.length) {
    // no sections to measure: fall back to a plain linear map
    knots = [
      { y: 0, p: 0 },
      { y: scrollMax, p: 1 },
    ]
    return
  }

  const next: Knot[] = [{ y: 0, p: 0 }]
  for (let i = 1; i < els.length; i++) {
    const y = Math.min(els[i]!.offsetTop, scrollMax)
    const p = SECTION_RANGES[i]![0]
    // strictly increasing, or the inverse lookup is ambiguous
    if (y > next[next.length - 1]!.y) next.push({ y, p })
  }
  if (scrollMax > next[next.length - 1]!.y) next.push({ y: scrollMax, p: 1 })
  else next[next.length - 1] = { y: scrollMax, p: 1 }
  knots = next
}

/** Film progress 0..1 for a scroll position, piecewise linear between knots. */
export function filmProgressAt(scrollY: number): number {
  if (knots.length < 2) return 0
  const first = knots[0]!
  const last = knots[knots.length - 1]!
  if (scrollY <= first.y) return first.p
  if (scrollY >= last.y) return last.p
  for (let i = 1; i < knots.length; i++) {
    const b = knots[i]!
    if (scrollY <= b.y) {
      const a = knots[i - 1]!
      const t = (scrollY - a.y) / (b.y - a.y)
      return a.p + (b.p - a.p) * t
    }
  }
  return last.p
}

/** DEV only: the knot table, for checking that boundaries land on cuts. */
export function filmMapKnots(): readonly Knot[] {
  return knots
}
