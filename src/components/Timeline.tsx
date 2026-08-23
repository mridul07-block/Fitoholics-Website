/**
 * The signature element: a live film timeline.
 *
 * The left edge carries a six segment reel, one segment per act, filling with
 * the ramp as the playhead crosses it — the six segments are the six camera
 * setups in the footage, so the chrome is reporting the film rather than
 * decorating it.
 *
 * The frame counter and act caption that used to sit top right are gone: over
 * the opening frame they read as a debug overlay across the hero rather than
 * as chrome, and the masthead now owns that corner.
 *
 * DOM is written imperatively from the clock; React never re-renders here.
 * Hidden below 1100px and under reduced motion (CSS + §9 law 7).
 */
import { useEffect, useRef } from 'react'
import { ACTS } from '../film/beats'
import { FILM } from '../film/manifest'
import { initSpine, prefersReducedMotion } from '../film/useMasterProgress'
import s from './Timeline.module.css'

export function Timeline() {
  const reelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (prefersReducedMotion()) return
    const spine = initSpine()
    const segs = reelRef.current ? Array.from(reelRef.current.children) : []
    const lastFrame = FILM.count - 1
    let lastIndex = -1
    let shown: boolean | null = null

    return spine.clock.onTick((c) => {
      if (c.index === lastIndex) return
      lastIndex = c.index

      // fill each segment by how far the playhead has crossed that act
      for (let i = 0; i < segs.length; i++) {
        const act = ACTS[i]!
        const span = act.n1 - act.n0 + 1
        const t = Math.min(Math.max((c.index - act.n0) / span, 0), 1)
        ;(segs[i] as HTMLElement).style.setProperty('--fill', String(t))
      }

      // The reel reports the film, so it leaves with it: at the last frame the
      // page is into the footer, which the reel would otherwise float over.
      const next = c.index < lastFrame
      if (next !== shown) {
        shown = next
        if (reelRef.current) reelRef.current.style.opacity = next ? '1' : '0'
      }
    })
  }, [])

  return (
    <div ref={reelRef} className={s.reel} aria-hidden="true">
      {ACTS.map((a) => (
        <div key={a.id} className={s.seg} style={{ flexGrow: a.n1 - a.n0 + 1 }} />
      ))}
    </div>
  )
}
