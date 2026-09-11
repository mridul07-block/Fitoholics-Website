/**
 * The stations, joined: geometry + accessible label + component.
 *
 * App.tsx renders this list and nothing else decides the page order. A
 * station that exists in geometry.ts but has no component or no label is a
 * type error here, not an undefined component at runtime.
 */
import type { ReactNode } from 'react'
import { COPY } from '../content/copy'
import { Entrance, Problem, Positioning, Protocol, TableStation, Fit, Proof, Close } from '../components/stations'
import { GEOMETRY, type StationGeometry, type StationKey } from './geometry'

const COMPONENTS: Record<StationKey, () => ReactNode> = {
  hero: Entrance,
  problem: Problem,
  positioning: Positioning,
  protocol: Protocol,
  table: TableStation,
  fit: Fit,
  proof: Proof,
  close: Close,
}

export interface Station extends StationGeometry {
  readonly label: string
  readonly Component: () => ReactNode
}

export const STATIONS: readonly Station[] = GEOMETRY.map((g) => ({
  ...g,
  label: COPY.a11y.stations[g.key],
  Component: COMPONENTS[g.key],
}))
