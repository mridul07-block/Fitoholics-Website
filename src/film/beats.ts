/**
 * The film, as data.
 *
 * The 2026-08-17 source is six shots joined by hard cuts, measured from the
 * plate (mean absolute thumbnail difference over 18) at frames 55, 99, 140,
 * 195 and 240. Every act below is one continuous camera setup, so the acts are
 * a fact about the footage, not a reading of it.
 *
 * Station ranges are chosen so the film's cuts land on section boundaries: the
 * page changes subject at the same instant the camera does.
 */
import { FILM } from './manifest'

export interface Act {
  readonly id: string
  readonly label: string
  /** short line shown under the act label in the chrome */
  readonly note: string
  /** inclusive frame range */
  readonly n0: number
  readonly n1: number
  /** reduced motion keyframe for this act */
  readonly heroFrame: number
  /** 0 none · 1 some · 2 high inter frame motion (drives velocity soften) */
  readonly ghostRisk: 0 | 1 | 2
  /** atmosphere gradient, top and bottom, as 0..1 rgb */
  readonly atmTop: readonly [number, number, number]
  readonly atmBottom: readonly [number, number, number]
  /** how much ember bloom the act carries, 0..1 */
  readonly glow: number
  /**
   * Where the crop centres horizontally, 0..1 in texture space.
   *
   * A phone shows less than half of a 16:9 frame's width, so a centred crop
   * throws away whichever side the subject is on. This is the point the narrow
   * crop keeps, measured from the composition of each shot.
   */
  readonly focalX: number
}

/** hex string for the DOM side of the atmosphere */
export const rgbHex = (c: readonly [number, number, number]): string =>
  '#' + c.map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('')

/**
 * The colour arc is the story arc: cold violet black at the mirror, tungsten
 * entering at the assessment, deep rust through the work, molten at the proof.
 */
export const ACTS: readonly Act[] = [
  {
    id: 'mirror',
    label: 'THE MIRROR',
    note: 'Before anything changes',
    n0: 0,
    n1: 54,
    heroFrame: 22,
    ghostRisk: 0,
    // the coldest point in the arc, but never neutral: the lamp behind the
    // mirror is the one warm thing in the room, and the page starts there
    atmTop: [0.043, 0.031, 0.055],
    atmBottom: [0.114, 0.063, 0.055],
    glow: 0.1,
    focalX: 0.47,
  },
  {
    id: 'arrival',
    label: 'THE ARRIVAL',
    note: 'The first decision',
    n0: 55,
    n1: 98,
    heroFrame: 72,
    ghostRisk: 1,
    atmTop: [0.039, 0.027, 0.055],
    atmBottom: [0.102, 0.071, 0.055],
    glow: 0.14,
    focalX: 0.56,
  },
  {
    id: 'assessment',
    label: 'THE ASSESSMENT',
    note: 'Measured, not guessed',
    n0: 99,
    n1: 139,
    heroFrame: 118,
    ghostRisk: 0,
    atmTop: [0.047, 0.031, 0.024],
    atmBottom: [0.141, 0.078, 0.039],
    glow: 0.3,
    focalX: 0.62,
  },
  {
    id: 'work',
    label: 'THE WORK',
    note: 'Where it is actually earned',
    n0: 140,
    n1: 194,
    heroFrame: 168,
    ghostRisk: 2,
    atmTop: [0.039, 0.024, 0.02],
    atmBottom: [0.165, 0.071, 0.024],
    glow: 0.36,
    focalX: 0.42,
  },
  {
    id: 'standard',
    label: 'THE STANDARD',
    note: 'The same mirror, later',
    n0: 195,
    n1: 239,
    heroFrame: 216,
    ghostRisk: 1,
    atmTop: [0.043, 0.024, 0.02],
    atmBottom: [0.188, 0.086, 0.024],
    glow: 0.44,
    focalX: 0.52,
  },
  {
    id: 'proof',
    label: 'THE PROOF',
    note: 'What the work returns',
    n0: 240,
    n1: 299,
    heroFrame: 276,
    ghostRisk: 0,
    atmTop: [0.063, 0.039, 0.024],
    atmBottom: [0.22, 0.125, 0.047],
    glow: 0.56,
    focalX: 0.53,
  },
] as const

/** first frame of each new shot, straight from the encoder manifest */
export const CUTS: readonly number[] = FILM.cuts

/** Act for a frame index. Linear scan; six entries, branch predicted. */
export function actAtFrame(index: number): Act {
  for (let i = 0; i < ACTS.length; i++) {
    const a = ACTS[i]!
    if (index <= a.n1) return a
  }
  return ACTS[ACTS.length - 1]!
}

export function actAtProgress(p: number): Act {
  return actAtFrame(Math.round(p * (FILM.count - 1)))
}

export function actIndexAtFrame(index: number): number {
  for (let i = 0; i < ACTS.length; i++) if (index <= ACTS[i]!.n1) return i
  return ACTS.length - 1
}

/**
 * Section geometry. `h` is the scroll height in vh and is the single source of
 * truth: the CSS custom properties are generated from it, and the progress
 * ranges below are derived from the same numbers, so a height edit can never
 * drift out of sync with the beat anchoring.
 *
 * Heights are picked so each cut frame lands within one frame of a boundary:
 *   cut  55 -> positioning starts   cut  99 -> protocol starts
 *   cut 195 -> fit starts           cut 240 -> proof starts
 * (cut 140, assessment to work, deliberately lands mid protocol, under step 05)
 */
export interface Section {
  readonly id: string
  /** scroll height in vh */
  readonly h: number
  /** how much film shows through this section, 0 ink .. 1 full film */
  readonly wash: number
}

export const SECTIONS: readonly Section[] = [
  { id: 'hero', h: 110, wash: 0.78 },
  { id: 'problem', h: 110, wash: 0.84 },
  { id: 'positioning', h: 176, wash: 0.9 },
  { id: 'protocol', h: 284, wash: 0.8 },
  { id: 'table', h: 100, wash: 0.86 },
  { id: 'fit', h: 180, wash: 0.88 },
  { id: 'proof', h: 118, wash: 0.8 },
  { id: 'close', h: 122, wash: 0.72 },
] as const

export const TOTAL_VH = SECTIONS.reduce((t, s) => t + s.h, 0)

/** cumulative progress boundaries, [from, to] per section */
export const SECTION_RANGES: readonly (readonly [number, number])[] = (() => {
  const out: [number, number][] = []
  let acc = 0
  for (const s of SECTIONS) {
    const from = acc / TOTAL_VH
    acc += s.h
    out.push([from, acc / TOTAL_VH])
  }
  return out
})()

export function sectionIndexAtProgress(p: number): number {
  for (let i = 0; i < SECTION_RANGES.length; i++) if (p <= SECTION_RANGES[i]![1]) return i
  return SECTION_RANGES.length - 1
}

/**
 * Film strength at a progress value. Constant inside a section, smoothly
 * crossfaded across the last 6% of each section so the change never snaps.
 */
export function washAtProgress(p: number): number {
  const i = sectionIndexAtProgress(p)
  const [from, to] = SECTION_RANGES[i]!
  const here = SECTIONS[i]!.wash
  const next = SECTIONS[Math.min(i + 1, SECTIONS.length - 1)]!.wash
  const span = to - from
  const tail = (p - from) / span
  if (tail < 0.94) return here
  const t = (tail - 0.94) / 0.06
  return here + (next - here) * (t * t * (3 - 2 * t))
}

/** Boot time invariants, DEV only. Throws on gaps, overlaps or hero mismatches. */
export function assertFilmCoverage(): void {
  let expected = 0
  for (const a of ACTS) {
    if (a.n0 !== expected) throw new Error(`acts: gap or overlap at ${a.id} (n0 ${a.n0}, expected ${expected})`)
    if (a.n1 < a.n0) throw new Error(`acts: inverted range at ${a.id}`)
    if (a.heroFrame < a.n0 || a.heroFrame > a.n1) throw new Error(`acts: heroFrame outside ${a.id}`)
    expected = a.n1 + 1
  }
  if (expected !== FILM.count) throw new Error(`acts: coverage ends at ${expected}, film has ${FILM.count}`)
  if (ACTS.length !== FILM.heroFrames.length)
    throw new Error(`acts: ${ACTS.length} acts but manifest has ${FILM.heroFrames.length} heroFrames`)
  ACTS.forEach((a, i) => {
    if (FILM.heroFrames[i] !== a.heroFrame)
      throw new Error(`acts: heroFrame mismatch at ${a.id} (${a.heroFrame} vs manifest ${FILM.heroFrames[i]})`)
  })
  // every cut except the mid protocol one must sit on a section boundary
  const boundaries = SECTION_RANGES.map(([, to]) => Math.round(to * (FILM.count - 1)))
  for (const cut of [55, 99, 195, 240]) {
    if (!boundaries.some((b) => Math.abs(b - cut) <= 1))
      throw new Error(`acts: cut ${cut} is not on a section boundary (boundaries ${boundaries.join(',')})`)
  }
}
