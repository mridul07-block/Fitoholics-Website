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

export const FILM = {
  count: FILM_GEN.count,
  padding: FILM_GEN.padding,
  ext: FILM_GEN.ext,
  startIndex: 0,
  tiers: FILM_GEN.tiers as readonly TierSpec[],
  cuts: FILM_GEN.cuts as readonly number[],
  heroFrames: FILM_GEN.heroFrames as readonly number[],
  lqip: FILM_GEN.lqip as readonly string[],
  lqipPortrait: FILM_GEN.lqipPortrait as readonly string[],
} as const

export const clampIndex = (i: number): number =>
  Math.min(Math.max(i, 0), FILM.count - 1)

/** The only place in the app that formats a frame path. */
export const framePath = (tier: TierSpec, i: number): string =>
  `${tier.dir}/f_${String(clampIndex(i)).padStart(FILM.padding, '0')}.${FILM.ext}`

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
