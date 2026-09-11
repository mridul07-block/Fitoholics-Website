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
 */
export type StationKey =
  | 'hero'
  | 'problem'
  | 'positioning'
  | 'protocol'
  | 'table'
  | 'fit'
  | 'proof'
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
  { key: 'hero', h: 110, hMd: 100, hSm: 100, wash: 0.78, zTravel: false },
  { key: 'problem', h: 110, hMd: 115, hSm: 125, wash: 0.84, zTravel: true },
  { key: 'positioning', h: 176, hMd: 110, hSm: 110, wash: 0.9, zTravel: true },
  // pinned, so the panel cannot also travel
  { key: 'protocol', h: 284, hMd: 250, hSm: 240, wash: 0.8, anchor: 'protocol', zTravel: false },
  { key: 'table', h: 100, hMd: 125, hSm: 135, wash: 0.86, anchor: 'nutrition', zTravel: true },
  { key: 'fit', h: 180, hMd: 120, hSm: 125, wash: 0.88, anchor: 'fit', zTravel: true },
  // The last two are where the page arrives. The footage ends on its one
  // daylit shot, and washing it back toward the ground — proof was 0.80 and
  // close 0.72, the most veiled section on the page — was hiding the payoff
  // behind the same ink the story started in. The veil opens instead, which
  // is where the ending gets its light from (see film/daylight.ts).
  { key: 'proof', h: 118, hMd: 110, hSm: 110, wash: 0.94, anchor: 'proof', zTravel: true },
  { key: 'close', h: 122, hMd: 115, hSm: 120, wash: 0.86, anchor: 'booking', zTravel: true },
]
