/**
 * FilmLayer (§7) — owns the canvas host, picks the renderer, wires the
 * loader and the clock together, and runs the loading rule + scroll lock.
 *
 * Phase 4 ships the Canvas 2D path; the WebGL upgrade slots in behind the
 * same seam in Phase 5. The LQIP ground stays as the host background so
 * there is never a blank viewport (CLS 0, §7.3).
 */
import { useEffect, useRef } from 'react'
import { FILM, selectTier } from './manifest'
import { washAtProgress } from './beats'
import { FrameLoader, budgetForTier } from './FrameLoader'
import { Canvas2DRenderer } from './Canvas2DRenderer'
import { initSpine, prefersReducedMotion } from './useMasterProgress'
import s from '../App.module.css'

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
  }
}

export function FilmLayer() {
  const hostRef = useRef<HTMLDivElement>(null)
  const ruleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const tier = selectTier()
    const loader = new FrameLoader(tier, budgetForTier(tier))
    const renderer = new Canvas2DRenderer(host, loader)
    const spine = initSpine()
    const reduced = prefersReducedMotion()

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
      void loader.ready().then(() => {
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
      if (import.meta.env.DEV) {
        window.__filmStats = {
          draws: renderer.draws,
          decodedBytes: p.decodedBytes,
          loadedCount: p.loadedCount,
          stage: p.stage,
        }
      }
    })

    loader.start()

    // ---- per tick: note the playhead, pin the drawn window, render ----
    const renderState = { index: 0, blend: 0, velocity: 0, wash: 1 }
    const pinScratch: number[] = [0, 0, 0]
    const offTick = spine.clock.onTick((c) => {
      loader.note(c.index, c.velocity)
      pinScratch[0] = c.index
      pinScratch[1] = Math.min(c.index + 1, FILM.count - 1)
      pinScratch[2] = renderer.lastIndex < 0 ? c.index : renderer.lastIndex
      loader.pin(pinScratch)
      renderState.index = c.index
      renderState.blend = c.blend
      renderState.velocity = c.velocity
      renderState.wash = washAtProgress(c.smoothed)
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
      style={{ backgroundImage: `url("${FILM.lqip[0]}")` }}
    >
      <div ref={ruleRef} className={s.loadingRule} />
    </div>
  )
}
