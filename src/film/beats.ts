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
  { id: 'mirror', label: 'THE MIRROR', n0: 0, n1: 13, heroFrame: 7, ghostRisk: 0 },
  { id: 'threshold', label: 'THE THRESHOLD', n0: 14, n1: 25, heroFrame: 20, ghostRisk: 1 },
  { id: 'welcome', label: 'THE WELCOME', n0: 26, n1: 33, heroFrame: 30, ghostRisk: 1 },
  { id: 'assessment', label: 'THE ASSESSMENT', n0: 34, n1: 59, heroFrame: 46, ghostRisk: 0 },
  { id: 'tools', label: 'THE TOOLS', n0: 60, n1: 64, heroFrame: 62, ghostRisk: 1 },
  { id: 'work', label: 'THE WORK', n0: 65, n1: 86, heroFrame: 75, ghostRisk: 2 },
  { id: 'table', label: 'THE TABLE', n0: 87, n1: 106, heroFrame: 97, ghostRisk: 0 },
  { id: 'rhythm', label: 'THE RHYTHM', n0: 107, n1: 125, heroFrame: 113, ghostRisk: 2 },
  { id: 'proof', label: 'THE PROOF', n0: 126, n1: 149, heroFrame: 140, ghostRisk: 0 },
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
