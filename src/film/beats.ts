/**
 * Narrative beat table (§3.5, corrected against the Phase 0 contact sheet audit).
 * All nine spec beats exist in the footage. Frame ranges are in 150-frame space.
 * Drives the timeline chrome label and, later, per station shader uniforms.
 */
import { FILM } from './manifest'

export interface Beat {
  readonly id: string
  readonly label: string
  /** inclusive 150-space frame range */
  readonly n0: number
  readonly n1: number
  /** reduced motion keyframe for this beat */
  readonly heroFrame: number
  /** 0 none · 1 some · 2 high inter-frame motion (drives velocity soften) */
  readonly ghostRisk: 0 | 1 | 2
}

export const BEATS: readonly Beat[] = [
  // 299-space (full sequence, no decimation — client request 2026-08-16)
  { id: 'mirror', label: 'THE MIRROR', n0: 0, n1: 27, heroFrame: 14, ghostRisk: 0 },
  { id: 'threshold', label: 'THE THRESHOLD', n0: 28, n1: 51, heroFrame: 40, ghostRisk: 1 },
  { id: 'welcome', label: 'THE WELCOME', n0: 52, n1: 67, heroFrame: 60, ghostRisk: 1 },
  { id: 'assessment', label: 'THE ASSESSMENT', n0: 68, n1: 119, heroFrame: 92, ghostRisk: 0 },
  { id: 'tools', label: 'THE TOOLS', n0: 120, n1: 129, heroFrame: 124, ghostRisk: 1 },
  { id: 'work', label: 'THE WORK', n0: 130, n1: 173, heroFrame: 150, ghostRisk: 2 },
  { id: 'table', label: 'THE TABLE', n0: 174, n1: 213, heroFrame: 194, ghostRisk: 0 },
  { id: 'rhythm', label: 'THE RHYTHM', n0: 214, n1: 251, heroFrame: 226, ghostRisk: 2 },
  { id: 'proof', label: 'THE PROOF', n0: 252, n1: 298, heroFrame: 280, ghostRisk: 0 },
] as const

/** Beat for a frame index. Linear scan; nine entries, branch predicted. */
export function beatAtFrame(index: number): Beat {
  for (let i = 0; i < BEATS.length; i++) {
    const b = BEATS[i]!
    if (index <= b.n1) return b
  }
  return BEATS[BEATS.length - 1]!
}

/** Beat for a master progress value 0..1. */
export function beatAtProgress(p: number): Beat {
  return beatAtFrame(Math.round(p * (FILM.count - 1)))
}

/**
 * Station wash ranges (§8): film strength per station, linearly crossfaded
 * across the inter-station gaps. 1 = full film, 0 = ink.
 */
const WASH_STOPS: readonly (readonly [number, number, number])[] = [
  // lifted across the board (client directed): the film stays clearly visible
  [0.0, 0.09, 0.58],
  [0.096, 0.185, 0.8],
  [0.19, 0.29, 0.7],
  [0.308, 0.552, 0.74],
  [0.604, 0.712, 0.88],
  [0.719, 0.812, 0.76],
  [0.819, 0.905, 0.68],
  [0.912, 1.0, 0.5],
]

export function washAtProgress(p: number): number {
  for (let i = 0; i < WASH_STOPS.length; i++) {
    const [a, b, w] = WASH_STOPS[i]!
    if (p <= b) {
      if (p >= a) return w
      // in the gap before this station: crossfade from the previous wash
      const prev = i > 0 ? WASH_STOPS[i - 1]! : WASH_STOPS[0]!
      const t = (p - prev[1]) / (a - prev[1])
      return prev[2] + (w - prev[2]) * Math.min(Math.max(t, 0), 1)
    }
  }
  return WASH_STOPS[WASH_STOPS.length - 1]![2]
}

/** Boot-time invariants, DEV only. Throws on gaps, overlaps or hero mismatches. */
export function assertBeatCoverage(): void {
  let expected = 0
  for (const b of BEATS) {
    if (b.n0 !== expected) throw new Error(`beats: gap or overlap at ${b.id} (n0 ${b.n0}, expected ${expected})`)
    if (b.n1 < b.n0) throw new Error(`beats: inverted range at ${b.id}`)
    if (b.heroFrame < b.n0 || b.heroFrame > b.n1) throw new Error(`beats: heroFrame outside ${b.id}`)
    expected = b.n1 + 1
  }
  if (expected !== FILM.count) throw new Error(`beats: coverage ends at ${expected}, film has ${FILM.count}`)
  if (BEATS.length !== FILM.heroFrames.length)
    throw new Error(`beats: ${BEATS.length} beats but manifest has ${FILM.heroFrames.length} heroFrames`)
  BEATS.forEach((b, i) => {
    if (FILM.heroFrames[i] !== b.heroFrame)
      throw new Error(`beats: heroFrame mismatch at ${b.id} (${b.heroFrame} vs manifest ${FILM.heroFrames[i]})`)
  })
}
