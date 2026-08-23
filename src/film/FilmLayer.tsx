/**
 * FilmLayer (§7) — owns the canvas host, picks the renderer, wires the
 * loader and the clock together, and runs the loading rule + scroll lock.
 *
 * Phase 4 ships the Canvas 2D path; the WebGL upgrade slots in behind the
 * same seam in Phase 5. The LQIP ground stays as the host background so
 * there is never a blank viewport (CLS 0, §7.3).
 */
import { useEffect, useRef, useState } from 'react'
import { FILM, lqipFor, selectTier } from './manifest'
import { washAtProgress } from './beats'
import { Atmosphere, publishAct } from './atmosphere'
import { entranceDone, filmEntrance } from '../motion/choreography'
import { FrameLoader, budgetForTier } from './FrameLoader'
import { Canvas2DRenderer } from './Canvas2DRenderer'
import { WebGLFilmRenderer } from './WebGLRenderer'
import { initSpine, prefersReducedMotion } from './useMasterProgress'
import { motionNorm } from './velocity'
import { publishLoad } from './loadProgress'
import s from '../App.module.css'

type AnyRenderer = Canvas2DRenderer | WebGLFilmRenderer

/**
 * Renderer probe (§7.4/§7.5): WebGL2 unless it fails, reports a software
 * renderer, or the page runs under reduced motion / an explicit ?film=2d
 * override. Canvas 2D is a full quality path, not a degraded one.
 */
function pickRenderer(host: HTMLElement, loader: FrameLoader, tier: ReturnType<typeof selectTier>): AnyRenderer {
  const filmParam = new URLSearchParams(location.search).get('film')
  if (filmParam === '2d' || prefersReducedMotion()) return new Canvas2DRenderer(host, loader)
  const allowSoftware = import.meta.env.DEV && filmParam === 'gl-force'
  try {
    const nav = navigator as Navigator & { deviceMemory?: number }
    // Portrait means a phone, which keeps the LOW_QUALITY program it already
    // runs. That program compiles out dispersion, depth of field and barrel
    // only; the grade, atmosphere, ember bloom, grain, vignette and wash are
    // all still in it, so the colour is identical across orientations.
    const quality =
      tier.orientation === 'portrait' || tier.id === 'sm' || (nav.deviceMemory ?? 8) <= 4 ? 'low' : 'high'
    return new WebGLFilmRenderer(host, loader, tier, quality, allowSoftware)
  } catch (err) {
    if (import.meta.env.DEV) console.warn('webgl unavailable, canvas 2d path:', err)
    return new Canvas2DRenderer(host, loader)
  }
}

const SCROLL_LOCK_RELEASE_MS = 3500

interface FilmStats {
  draws: number
  decodedBytes: number
  loadedCount: number
  stage: string
}

declare global {
  interface Window {
    __filmStats?: FilmStats
    /** DEV: velocity distribution recorded since load, frames/sec */
    __velLog?: (min?: number) => { n: number; p50: number; p90: number; p99: number; max: number } | null
    __velReset?: () => void
  }
}

export function FilmLayer() {
  const hostRef = useRef<HTMLDivElement>(null)
  const ruleRef = useRef<HTMLDivElement>(null)
  // Resolved once, in render, because the LQIP ground below has to match the
  // shape of the set that is about to cover it. Stable for the component's
  // life, which is what lets the effect below keep its empty dependency list.
  const [tier] = useState(selectTier)
  const portrait = tier.orientation === 'portrait'

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const loader = new FrameLoader(tier, budgetForTier(tier))
    let renderer: AnyRenderer = pickRenderer(host, loader, tier)
    if (renderer.kind === 'webgl') {
      // context lost -> swap to the 2D path without losing the playhead (§7.5)
      renderer.onContextLost = () => {
        renderer.dispose()
        renderer = new Canvas2DRenderer(host, loader)
      }
    }
    const spine = initSpine()
    const reduced = prefersReducedMotion()
    if (import.meta.env.DEV) window.__filmRenderer = renderer.kind

    // ---- scroll lock during the blocking batch, never a trap (§7.3) ----
    let released = false
    const release = () => {
      if (released) return
      released = true
      spine.lenis.start()
      if (ruleRef.current) ruleRef.current.style.opacity = '0'
      window.removeEventListener('wheel', release)
      window.removeEventListener('touchstart', release)
      window.removeEventListener('keydown', release)
    }
    if (!reduced) {
      spine.lenis.stop()
      const timer = window.setTimeout(release, SCROLL_LOCK_RELEASE_MS)
      // both the blocking batch AND the entrance must finish (§8 S1) —
      // capped by the hard release, and a user scroll attempt always wins
      void Promise.all([loader.ready(), entranceDone]).then(() => {
        window.clearTimeout(timer)
        release()
      })
      // a user attempting to scroll always wins
      window.addEventListener('wheel', release, { passive: true, once: true })
      window.addEventListener('touchstart', release, { passive: true, once: true })
      window.addEventListener('keydown', release, { once: true })
    }

    const offPhase = loader.onPhase((p) => {
      if (ruleRef.current) {
        ruleRef.current.style.transform = `scaleX(${p.stage === 'streaming' || p.stage === 'complete' ? 1 : p.blockingProgress})`
      }
      // The gate reads this. It is the loader's own decoded byte count, which
      // is why the preloader can report a real figure instead of running a
      // timer and hoping.
      const streaming = p.stage === 'streaming' || p.stage === 'complete'
      publishLoad(streaming ? 1 : p.blockingProgress, streaming)
      if (import.meta.env.DEV) {
        window.__filmStats = {
          draws: renderer.draws,
          decodedBytes: p.decodedBytes,
          loadedCount: p.loadedCount,
          stage: p.stage,
        }
      }
    })

    // reduced motion: fetch only the nine hero keyframes (§9 law 7)
    loader.start(reduced ? FILM.heroFrames : undefined)

    // ---- per tick: note the playhead, pin the drawn window, render ----
    const atmos = new Atmosphere(publishAct)
    publishAct(0)
    const renderState = {
      index: 0,
      blend: 0,
      velocity: 0,
      wash: 1,
      soften: 0,
      time: 0,
      atmTop: atmos.state.top,
      atmBottom: atmos.state.bottom,
      glow: 0,
      grade: 0.34,
      focalX: portrait ? 0.5 : atmos.state.focalX,
      cut: 0,
    }
    const pinScratch: number[] = []

    // ---- DEV diagnostics for the velocity driven effects ----
    // ?vel=<n> pins the velocity uniform so the high speed appearance can be
    // screenshotted while the page is standing still. __velLog records the real
    // distribution during a scroll so the pinned value can be a real one.
    const devParams = import.meta.env.DEV ? new URLSearchParams(location.search) : null
    const forcedVel = devParams?.has('vel') ? Number(devParams.get('vel')) : NaN
    const velLog: number[] = []
    if (import.meta.env.DEV) {
      window.__velLog = (min = 0.05) => {
        const v = velLog.filter((x) => x > min).sort((a, b) => a - b)
        if (!v.length) return null
        const at = (q: number) => v[Math.min(v.length - 1, Math.floor(q * v.length))]!
        return { n: v.length, p50: at(0.5), p90: at(0.9), p99: at(0.99), max: v[v.length - 1]! }
      }
      window.__velReset = () => {
        velLog.length = 0
      }
    }

    const offTick = spine.clock.onTick((c, deltaMs) => {
      loader.note(c.index, c.velocity)
      pinScratch.length = 0
      if (renderer.kind === 'webgl') renderer.residentFrames(pinScratch)
      pinScratch.push(c.index, Math.min(c.index + 1, FILM.count - 1))
      if (renderer.lastIndex >= 0) pinScratch.push(renderer.lastIndex)
      loader.pin(pinScratch)
      atmos.step(c.index, deltaMs)
      renderState.glow = atmos.state.glow
      renderState.grade = atmos.state.grade
      // The per act focal points exist to rescue a narrow crop of a landscape
      // composition. The vertical plate is composed centred and is barely
      // cropped at all, so applying them would just push it off centre.
      if (!portrait) renderState.focalX = atmos.state.focalX
      if (reduced) {
        // film locks to one keyframe per act, swapped at boundaries (§9 law 7)
        renderState.index = c.act.heroFrame
        renderState.blend = 0
        renderState.velocity = 0
        renderState.soften = 0
        renderState.cut = 0
        renderState.wash = washAtProgress(c.raw)
      } else {
        renderState.index = c.index
        renderState.blend = c.blend
        renderState.velocity = c.velocity
        renderState.cut = atmos.state.cut
        renderState.wash = washAtProgress(c.smoothed) * filmEntrance.wash
        // Motion softening.
        //
        // This began as ghosting mitigation for a sequence decimated two to one
        // to an effective 15 fps, where consecutive frames really did double
        // image. The current encode keeps every source frame, so there is no
        // ghosting left to hide, and what the term was actually doing was
        // blurring the plate through every scroll: it reached full strength at
        // 18 frames/sec, roughly 510 px/s, and in the high risk acts that meant
        // a fourteen pixel blur for the entire length of the section.
        //
        // It survives only as motion blur on a genuine flick, where the film is
        // moving fast enough that softness reads as speed. The act still
        // modulates it, but as a nudge rather than as a doubling.
        const m = Math.abs(motionNorm(c.velocity))
        renderState.soften = m * (0.6 + 0.2 * c.act.ghostRisk)
      }
      if (import.meta.env.DEV) {
        if (velLog.length < 4000) velLog.push(Math.abs(c.velocity))
        if (Number.isFinite(forcedVel)) {
          renderState.velocity = forcedVel
          renderState.soften = Math.abs(motionNorm(forcedVel)) * (0.6 + 0.2 * c.act.ghostRisk)
        }
      }
      renderState.time += deltaMs / 1000
      renderer.render(renderState)
      if (import.meta.env.DEV && window.__filmStats) window.__filmStats.draws = renderer.draws
    })

    const onResize = () => renderer.resize()
    window.addEventListener('resize', onResize)
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') loader.purge(8)
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      offTick()
      offPhase()
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisibility)
      renderer.dispose()
      loader.dispose()
    }
  }, [])

  return (
    <div
      ref={hostRef}
      className={s.film}
      aria-hidden="true"
      data-film-host
      style={{ backgroundImage: `url("${lqipFor(tier)[0]}")` }}
    >
      <div ref={ruleRef} className={s.loadingRule} />
    </div>
  )
}
