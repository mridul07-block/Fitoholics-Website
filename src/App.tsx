import { useEffect, type CSSProperties } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { COPY } from './content/copy'
import { initChoreography } from './motion/choreography'
import { initA11yNav } from './motion/a11y'
import { initStillness } from './motion/stillness'
import { initGate } from './motion/gate'
import { initSpine } from './film/useMasterProgress'
import { initDaylight } from './film/daylight'
import { SECTIONS, TOTAL_VH } from './film/beats'
import { FilmLayer } from './film/FilmLayer'
import { Nav } from './components/Nav'
import { SiteFooter } from './components/SiteFooter'
import { STATIONS } from './stations/registry'
import s from './App.module.css'

/**
 * Layer scaffold (§2.1):
 *   L0 film (fixed canvas host) · L1 atmosphere (scrims) · L2 content · L3 chrome.
 *
 * The stations come from src/stations/registry.ts in page order. Each renders
 * with its ordinal (data-station, which filmMap.ts counts) and its key
 * (data-station-key, which everything else selects by), and its heights as
 * custom properties from the same geometry the film is anchored to.
 */

/**
 * Pacing check, DEV only.
 *
 * `min-height` is a floor, not a size: a section whose content is taller
 * stretches, and the page stops being paced the way it was designed. Cut
 * anchoring survives this now — filmMap.ts pins progress to measured section
 * tops rather than to the raw scroll fraction — so this is a report about
 * rhythm, not a correctness failure. A section far over its share is one where
 * the copy is too long for the room it was given at that breakpoint.
 */
function assertSectionGeometry(): void {
  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-station]'))
  if (els.length !== SECTIONS.length) return
  const total = els.reduce((t, el) => t + el.offsetHeight, 0)
  els.forEach((el, i) => {
    const actual = el.offsetHeight / total
    const spec = SECTIONS[i]!.h / TOTAL_VH
    const drift = Math.abs(actual - spec) / spec
    if (drift > 0.25) {
      console.warn(
        `[pacing] section ${i + 1} (${SECTIONS[i]!.id}) takes ${(actual * 100).toFixed(1)}% of the page, ` +
          `designed for ${(spec * 100).toFixed(1)}%. Cut anchoring is unaffected (see filmMap.ts); ` +
          `this is copy outgrowing the room it was given at this breakpoint.`,
      )
    }
  })
}

export function App() {
  useEffect(() => {
    // Idempotent singleton — StrictMode double-invocation cannot create a
    // second loop (§7.1). Refresh after React has laid the page out so the
    // master trigger's 'max' matches the real document height.
    initSpine()
    ScrollTrigger.refresh()
    initA11yNav()
    // publishes data-motion, which is what lets the glass surfaces blur only
    // while the film is settled (see motion/stillness.ts)
    initStillness()
    // writes the palette down the page: night lifting to pre-dawn, then paper
    // from the cut into the proof (see film/daylight.ts)
    initDaylight()

    // The gate takes over its own markup immediately — it has been painting
    // since the first frame and needs to start reporting real progress, not
    // wait on fonts it does not use.
    const gateLifted = initGate()

    // The entrance waits for BOTH: the fonts, because it splits lines and a
    // split before the face resolves would re-wrap; and the gate, because an
    // entrance played behind a full screen overlay is an entrance nobody sees.
    void Promise.all([document.fonts.ready, gateLifted]).then(() => {
      initChoreography()
      if (import.meta.env.DEV) assertSectionGeometry()
    })
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

      {/* L3 · CHROME — the masthead sits over the film from the first frame. */}
      <Nav />

      {/* L2 · CONTENT */}
      <main className={s.content} id="top">
        {STATIONS.map((st, i) => (
          <section
            key={st.key}
            aria-label={st.label}
            className={s.station}
            data-station={i + 1}
            data-station-key={st.key}
            id={st.anchor}
            style={{ '--h': `${st.h}svh`, '--h-md': `${st.hMd}svh`, '--h-sm': `${st.hSm}svh` } as CSSProperties}
          >
            <st.Component />
          </section>
        ))}
      </main>

      <SiteFooter />
    </>
  )
}
