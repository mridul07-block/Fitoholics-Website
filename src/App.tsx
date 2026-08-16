import { COPY } from './content/copy'
import { FILM } from './film/manifest'
import s from './App.module.css'

/**
 * Layer scaffold (§2.1):
 *   L0 film (fixed canvas host) · L1 atmosphere (scrims) · L2 content · L3 chrome.
 * Phase 1 ships the shells at correct heights with aria-labels; stations fill in
 * Phase 2, the film engine in Phases 4 and 5.
 */

const stationClasses = [s.s1, s.s2, s.s3, s.s4, s.s5, s.s6, s.s7, s.s8]

export function App() {
  return (
    <>
      <a href="#booking" className={s.skipLink}>
        {COPY.chrome.skipLink}
      </a>

      {/* L0 · FILM — LQIP of beat one grounds the viewport until frame zero decodes. */}
      <div
        className={s.film}
        aria-hidden="true"
        data-film-host
        style={{ backgroundImage: `url("${FILM.lqip[0]}")` }}
      />

      {/* L1 · ATMOSPHERE — per station scrims arrive in Phase 2. */}
      <div className={s.atmosphere} aria-hidden="true" data-atmosphere />

      {/* L2 · CONTENT */}
      <main className={s.content}>
        {COPY.a11y.stations.map((label, i) => (
          <section
            key={label}
            aria-label={label}
            className={`${s.station} ${stationClasses[i]}`}
            data-station={i + 1}
            id={i === 7 ? 'booking' : undefined}
          />
        ))}
      </main>

      {/* L3 · CHROME — timeline arrives with the film engine in Phase 4. */}
      <div className={s.chrome} aria-hidden="true" data-chrome />
    </>
  )
}
