/**
 * Single source of truth for the frame assets (§3.2).
 * Nothing else in the codebase may hardcode a path, a count or a padding width.
 * Constants come from the generated manifest (tools/encode-frames.mjs output).
 *
 * Two orientation sets ship. They are the same edit of the same six shots, one
 * framed 16:9 and one framed 9:16, so the page tells one story and loads
 * whichever plate fits the screen. Everything else about the film — count, hero
 * frames, the act table, the colour arc — is shared.
 */
import { FILM_GEN } from './manifest.gen'

export type TierId = 'xl' | 'lg' | 'sm' | 'pv' | 'pvs'
export type Orientation = 'landscape' | 'portrait'

export interface TierSpec {
  readonly id: TierId
  readonly orientation: Orientation
  readonly dir: string
  readonly width: number
  readonly height: number
  readonly totalBytes: number
  readonly avgBytes: number
}

/**
 * The edit, as shown.
 *
 * The plates are encoded in the order they were shot: six shots, hard cuts at
 * FILM_GEN.cuts. The page shows them in a different order. The copy was
 * rebuilt around the audit's commercial principle (say who it is for, prove
 * it, explain what they receive, then ask) and the picture has to follow the
 * words, so the coach appears under the credibility copy and the transformed
 * pair under the case studies. Every frame index the rest of the app uses is
 * a LOGICAL index into this order; the one place a file path is formatted
 * maps it to the physical file. Nothing is re-encoded, and logical frame 0 is
 * still physical frame 0, so the frame zero preloads in index.html hold.
 *
 * Per orientation, because the two plates' cuts differ by a frame on four of
 * the six shots. A logical shot has the landscape shot's length: a physical
 * shot one frame shorter repeats its last frame, one frame longer drops its
 * last, so both orientations cut on the same logical frame.
 */
export type ShotId = 'mirror' | 'arrival' | 'assessment' | 'work' | 'standard' | 'proof'

/** the shots as encoded */
const ENCODED: readonly ShotId[] = ['mirror', 'arrival', 'assessment', 'work', 'standard', 'proof']
/** the shots as shown */
export const SHOT_ORDER: readonly ShotId[] = ['mirror', 'assessment', 'standard', 'arrival', 'work', 'proof']

interface PhysicalShot {
  readonly p0: number
  readonly p1: number
}

const physicalShots = (cuts: readonly number[]): Record<ShotId, PhysicalShot> => {
  const starts = [0, ...cuts]
  const out = {} as Record<ShotId, PhysicalShot>
  ENCODED.forEach((id, k) => {
    out[id] = { p0: starts[k]!, p1: (starts[k + 1] ?? FILM_GEN.count) - 1 }
  })
  return out
}

const PHYSICAL: Record<Orientation, Record<ShotId, PhysicalShot>> = {
  landscape: physicalShots(FILM_GEN.cuts),
  portrait: physicalShots(FILM_GEN.cutsPortrait),
}

export interface Shot {
  readonly id: ShotId
  /** inclusive logical frame range */
  readonly n0: number
  readonly n1: number
  /** the reduced motion keyframe, logical */
  readonly heroFrame: number
}

/** the shots in the order shown, in logical frame space */
export const SHOTS: readonly Shot[] = (() => {
  let n = 0
  return SHOT_ORDER.map((id) => {
    const p = PHYSICAL.landscape[id]
    const len = p.p1 - p.p0 + 1
    const heroPhysical = FILM_GEN.heroFrames[ENCODED.indexOf(id)]!
    const shot: Shot = { id, n0: n, n1: n + len - 1, heroFrame: n + (heroPhysical - p.p0) }
    n += len
    return shot
  })
})()

const inShownOrder = <T>(list: readonly T[]): readonly T[] => SHOT_ORDER.map((id) => list[ENCODED.indexOf(id)]!)

export const FILM = {
  count: FILM_GEN.count,
  padding: FILM_GEN.padding,
  ext: FILM_GEN.ext,
  startIndex: 0,
  tiers: FILM_GEN.tiers as readonly TierSpec[],
  /** first logical frame of each shot after the first */
  cuts: SHOTS.slice(1).map((s) => s.n0) as readonly number[],
  heroFrames: SHOTS.map((s) => s.heroFrame) as readonly number[],
  lqip: inShownOrder(FILM_GEN.lqip as readonly string[]),
  lqipPortrait: inShownOrder(FILM_GEN.lqipPortrait as readonly string[]),
} as const

export const clampIndex = (i: number): number =>
  Math.min(Math.max(i, 0), FILM.count - 1)

/** logical frame -> the physical frame of that orientation's plate */
export function toPhysical(orientation: Orientation, i: number): number {
  const li = clampIndex(i)
  for (const s of SHOTS) {
    if (li <= s.n1) {
      const p = PHYSICAL[orientation][s.id]
      return Math.min(p.p0 + (li - s.n0), p.p1)
    }
  }
  return FILM.count - 1
}

/** The only place in the app that formats a frame path. */
export const framePath = (tier: TierSpec, i: number): string =>
  `${tier.dir}/f_${String(toPhysical(tier.orientation, i)).padStart(FILM.padding, '0')}.${FILM.ext}`

/** LQIP grounds the film host before frame zero decodes, so it must match the
 *  shape of the plate that is about to cover it. */
export const lqipFor = (tier: TierSpec): readonly string[] =>
  tier.orientation === 'portrait' ? FILM.lqipPortrait : FILM.lqip

interface NavigatorExtras {
  deviceMemory?: number
  connection?: { effectiveType?: string; saveData?: boolean }
}

/**
 * Viewport aspect at or below which the portrait set is used.
 *
 * Deliberately not "any portrait viewport". An iPad in portrait is 0.75, and a
 * cover fit of a 16:9 plate at 0.75 still shows three quarters of the frame
 * width, which keeps the composition. It is phones, at roughly 0.46 to 0.56,
 * where a landscape plate has to be zoomed out and letterboxed to fit at all.
 * The mirror of this threshold lives in index.html as (max-aspect-ratio: 65/100)
 * on the frame zero preload; changing one without the other makes a phone
 * preload a frame it will never request.
 */
const PORTRAIT_MAX_ASPECT = 0.65

/** Selected once on mount, never on resize (§3.4) — a tier change would restart
 *  the load, so a rotated phone keeps the set it started with and the shader
 *  falls back to the crop it already handles. */
export function selectTier(): TierSpec {
  const nav = navigator as Navigator & NavigatorExtras
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const w = window.innerWidth * dpr
  const mem = nav.deviceMemory ?? 8
  const conn = nav.connection?.effectiveType ?? '4g'
  const saveData = nav.connection?.saveData ?? false
  const constrained = saveData || mem <= 4 || conn === '2g' || conn === 'slow-2g' || conn === '3g'

  const byId = (id: TierId): TierSpec => {
    const t = FILM.tiers.find((t) => t.id === id)
    if (!t) throw new Error(`manifest missing tier ${id}`)
    return t
  }

  // DEV: ?tier=<id> pins the set, so the two orientations can be traced against
  // each other at one viewport. Without it a paired comparison would have to
  // change the window size, which changes the scroll geometry too.
  if (import.meta.env.DEV) {
    const forced = new URLSearchParams(location.search).get('tier')
    if (forced && FILM.tiers.some((t) => t.id === forced)) return byId(forced as TierId)
  }

  if (window.innerWidth / window.innerHeight <= PORTRAIT_MAX_ASPECT) {
    return byId(constrained ? 'pvs' : 'pv')
  }

  if (saveData || w < 1000 || mem <= 4 || conn === '2g' || conn === 'slow-2g') return byId('sm')
  if (w < 1600 || mem <= 6 || conn === '3g') return byId('lg')
  return byId('xl')
}
