/**
 * Single source of truth for the frame assets (§3.2).
 * Nothing else in the codebase may hardcode a path, a count or a padding width.
 * Constants come from the generated manifest (tools/encode-frames.mjs output).
 */
import { FILM_GEN } from './manifest.gen'

export type TierId = 'xl' | 'lg' | 'sm'

export interface TierSpec {
  readonly id: TierId
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
  sourceMap: FILM_GEN.sourceMap as readonly number[],
  heroFrames: FILM_GEN.heroFrames as readonly number[],
  lqip: FILM_GEN.lqip as readonly string[],
  aspect: FILM_GEN.tiers[0].width / FILM_GEN.tiers[0].height,
} as const

export const clampIndex = (i: number): number =>
  Math.min(Math.max(i, 0), FILM.count - 1)

/** The only place in the app that formats a frame path. */
export const framePath = (tier: TierSpec, i: number): string =>
  `${tier.dir}/f_${String(clampIndex(i)).padStart(FILM.padding, '0')}.${FILM.ext}`

interface NavigatorExtras {
  deviceMemory?: number
  connection?: { effectiveType?: string; saveData?: boolean }
}

/** Selected once on mount, never on resize (§3.4) — a tier change would restart the load. */
export function selectTier(): TierSpec {
  const nav = navigator as Navigator & NavigatorExtras
  const w = window.innerWidth * Math.min(window.devicePixelRatio || 1, 2)
  const mem = nav.deviceMemory ?? 8
  const conn = nav.connection?.effectiveType ?? '4g'
  const saveData = nav.connection?.saveData ?? false

  const byId = (id: TierId): TierSpec => {
    const t = FILM.tiers.find((t) => t.id === id)
    if (!t) throw new Error(`manifest missing tier ${id}`)
    return t
  }

  if (saveData || w < 1000 || mem <= 4 || conn === '2g' || conn === 'slow-2g') return byId('sm')
  if (w < 1600 || mem <= 6 || conn === '3g') return byId('lg')
  return byId('xl')
}
