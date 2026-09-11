/**
 * The page, as scroll geometry. One row per station, in page order.
 *
 * This file has no imports on purpose: it is read by the film (beats.ts
 * derives SECTIONS from it, which is what pins the footage's cuts to section
 * boundaries) and by the React tree (registry.ts joins it to a component and
 * an accessible label), and neither side may depend on the other.
 *
 * `h` is the desktop scroll height in vh and is the film contract: cumulative
 * heights over the total decide which frame each section boundary lands on,
 * and assertFilmCoverage() throws in DEV if a cut drifts off a boundary.
 * `hMd` and `hSm` are the reading floors below 900px and 720px; filmMap.ts
 * re-pins progress to measured section tops, so they carry no film arithmetic
 * and only need to keep every section at least one viewport tall.
 *
 * `key` is the stable name everything else selects by (data-station-key), so
 * reordering or inserting a station never renumbers a selector.
 *
 * The order is the audit's commercial principle: say who it is for, prove it
 * works, explain what they receive, then ask. The film's shots are shown in
 * the same order (manifest.ts SHOT_ORDER), and the arithmetic below lands all
 * five cuts exactly, with boundary = round(cumulative / 1600 × 299):
 *
 *   station           h   cum   frame   shot under it
 *   hero            134   134     25    THE MIRROR
 *   problem         160   294     55 ←  cut, THE ASSESSMENT
 *   credibility     220   514     96 ←  cut, THE STANDARD
 *   transformations 240   754    141 ←  cut, THE ARRIVAL
 *   receive         118   872    163
 *   pathways        118   990    185 ←  cut, THE WORK
 *   method          294  1284    240 ←  cut, THE PROOF
 *   nutrition       180  1464    274
 *   close           136  1600    299
 *
 * About 5.4 vh per frame in every act, so the scrub is uniform. The total is
 * set by the two stations that share THE ARRIVAL: at 1440×900 "what you
 * receive" measures 115 vh of content and the paths 117, and a cut fixes
 * their combined room, so the whole page scales rather than one act rushing.
 *
 * The phone floors are the content heights measured at 390×844, so the DEV
 * pacing check stays quiet there; the film re-pins to the measured tops, and
 * a section that stretches further only slows the act under it.
 */
export type StationKey =
  | 'hero'
  | 'problem'
  | 'credibility'
  | 'transformations'
  | 'receive'
  | 'pathways'
  | 'method'
  | 'nutrition'
  | 'close'

export interface StationGeometry {
  readonly key: StationKey
  /** desktop scroll height in vh: the film contract */
  readonly h: number
  /** reading floor at <= 900px */
  readonly hMd: number
  /** reading floor at <= 720px */
  readonly hSm: number
  /** how much film shows through this section, 0 ink .. 1 full film */
  readonly wash: number
  /** DOM id the masthead and footer link to */
  readonly anchor?: string
  /** whether the panel travels the perspective context (choreography.ts) */
  readonly zTravel: boolean
}

export const GEOMETRY: readonly StationGeometry[] = [
  // the entrance owns its own motion, so no z travel
  { key: 'hero', h: 134, hMd: 100, hSm: 100, wash: 0.78, zTravel: false },
  { key: 'problem', h: 160, hMd: 120, hSm: 136, wash: 0.84, zTravel: true },
  { key: 'credibility', h: 220, hMd: 125, hSm: 130, wash: 0.9, anchor: 'coach', zTravel: true },
  { key: 'transformations', h: 240, hMd: 165, hSm: 158, wash: 0.9, anchor: 'results', zTravel: true },
  // 185, not 220: the app block that made this the tallest section on a phone
  // is gone, and the floor was leaving 41vh of empty room under the list
  { key: 'receive', h: 118, hMd: 140, hSm: 185, wash: 0.86, anchor: 'receive', zTravel: true },
  { key: 'pathways', h: 118, hMd: 140, hSm: 177, wash: 0.88, anchor: 'pathways', zTravel: true },
  // pinned, so the panel cannot also travel
  { key: 'method', h: 294, hMd: 250, hSm: 240, wash: 0.8, anchor: 'method', zTravel: false },
  // The last two are where the page arrives. The footage ends on its one
  // daylit shot, and washing it back toward the ground was hiding the payoff
  // behind the same ink the story started in. The veil opens instead, which
  // is where the ending gets its light from (see film/daylight.ts).
  { key: 'nutrition', h: 180, hMd: 135, hSm: 172, wash: 0.94, anchor: 'nutrition', zTravel: true },
  { key: 'close', h: 136, hMd: 115, hSm: 120, wash: 0.86, anchor: 'booking', zTravel: true },
]
