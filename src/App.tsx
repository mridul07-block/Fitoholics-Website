import { useEffect, type ReactNode } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { COPY } from './content/copy'
import { initChoreography } from './motion/choreography'
import { initA11yNav } from './motion/a11y'
import { initSpine } from './film/useMasterProgress'
import { FilmLayer } from './film/FilmLayer'
import { Timeline } from './components/Timeline'
import { Entrance, Problem, Positioning, Protocol, TableStation, Fit, Proof, Close } from './components/stations'
import s from './App.module.css'

/**
 * Layer scaffold (§2.1):
 *   L0 film (fixed canvas host) · L1 atmosphere (scrims) · L2 content · L3 chrome.
 * Phase 1 ships the shells at correct heights with aria-labels; stations fill in
 * Phase 2, the film engine in Phases 4 and 5.
 */

const stationClasses = [s.s1, s.s2, s.s3, s.s4, s.s5, s.s6, s.s7, s.s8]

const stationContent: readonly (() => ReactNode)[] = [
  Entrance,
  Problem,
  Positioning,
  Protocol,
  TableStation,
  Fit,
  Proof,
  Close,
]

const stationIds: readonly (string | undefined)[] = [
  undefined,
  undefined,
  undefined,
  'protocol',
  undefined,
  undefined,
  undefined,
  'booking',
]

export function App() {
  useEffect(() => {
    // Idempotent singleton — StrictMode double-invocation cannot create a
    // second loop (§7.1). Refresh after React has laid the page out so the
    // master trigger's 'max' matches the real document height.
    initSpine()
    ScrollTrigger.refresh()
    initA11yNav()
    // choreography splits lines, so it waits for the fonts (no reflow splits)
    void document.fonts.ready.then(() => initChoreography())
  }, [])

  return (
    <>
      <a href="#booking" className={s.skipLink}>
        {COPY.chrome.skipLink}
      </a>

      {/* L0 · FILM — LQIP of beat one grounds the viewport until frame zero decodes. */}
      <FilmLayer />

      {/* L1 · ATMOSPHERE — the act's gradient over the film; per station scrims
          live inside stations. Colours are written per act by atmosphere.ts. */}
      <div className={s.atmosphere} aria-hidden="true" data-atmosphere />

      {/* fires on every hard cut in the footage */}
      <div className={s.cutRule} aria-hidden="true" data-cut-rule />

      {/* L2 · CONTENT */}
      <main className={s.content}>
        {COPY.a11y.stations.map((label, i) => {
          const Station = stationContent[i]!
          return (
            <section
              key={label}
              aria-label={label}
              className={`${s.station} ${stationClasses[i]}`}
              data-station={i + 1}
              id={stationIds[i]}
            >
              <Station />
            </section>
          )
        })}
      </main>

      {/* L3 · CHROME — the signature element (§2.3). */}
      <Timeline />
    </>
  )
}
