/**
 * The signature element: a live film timeline.
 *
 * Top right carries the frame counter and the act it belongs to. The left edge
 * carries a six segment reel, one segment per act, filling with the ramp as the
 * playhead crosses it — the six segments are the six camera setups in the
 * footage, so the chrome is reporting the film rather than decorating it.
 *
 * DOM is written imperatively from the clock; React never re-renders here.
 * Hidden below 768px and under reduced motion (CSS + §9 law 7).
 */
import { useEffect, useRef } from 'react'
import { COPY } from '../content/copy'
import { FILM } from '../film/manifest'
import { ACTS, actIndexAtFrame } from '../film/beats'
import { initSpine, prefersReducedMotion } from '../film/useMasterProgress'
import s from './Timeline.module.css'

const pad = (n: number) => String(n + 1).padStart(3, '0')
const TOTAL = String(FILM.count).padStart(3, '0')
const roman = (i: number) => String(i + 1).padStart(2, '0')

export function Timeline() {
  const frameRef = useRef<HTMLSpanElement>(null)
  const actRef = useRef<HTMLSpanElement>(null)
  const noteRef = useRef<HTMLSpanElement>(null)
  const reelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (prefersReducedMotion()) return
    const spine = initSpine()
    const segs = reelRef.current ? Array.from(reelRef.current.children) : []
    let lastIndex = -1
    let lastAct = -1
    let visible = false

    return spine.clock.onTick((c) => {
      if (c.index === lastIndex) return
      lastIndex = c.index

      if (frameRef.current) frameRef.current.textContent = `${COPY.chrome.frameLabel} ${pad(c.index)} / ${TOTAL}`

      const ai = actIndexAtFrame(c.index)
      if (ai !== lastAct) {
        lastAct = ai
        const act = ACTS[ai]!
        if (actRef.current) actRef.current.textContent = `ACT ${roman(ai)} · ${act.label}`
        if (noteRef.current) noteRef.current.textContent = act.note
        // the counter ticks over on a cut; a brief flash marks it
        frameRef.current?.animate(
          [{ opacity: 0.35, transform: 'translateY(-2px)' }, { opacity: 1, transform: 'none' }],
          { duration: 320, easing: 'cubic-bezier(.22,1,.36,1)' },
        )
      }

      // fill each segment by how far the playhead has crossed that act
      for (let i = 0; i < segs.length; i++) {
        const act = ACTS[i]!
        const span = act.n1 - act.n0 + 1
        const t = Math.min(Math.max((c.index - act.n0) / span, 0), 1)
        ;(segs[i] as HTMLElement).style.setProperty('--fill', String(t))
      }

      if (!visible) {
        visible = true
        frameRef.current?.closest(`.${s.timeline}`)?.setAttribute('style', 'opacity:1')
        reelRef.current?.setAttribute('style', 'opacity:1')
      }
    })
  }, [])

  return (
    <>
      <div className={s.timeline} aria-hidden="true">
        <span ref={frameRef} className={s.frame}>
          {COPY.chrome.frameLabel} 001 / {TOTAL}
        </span>
        <span ref={actRef} className={s.act}>
          ACT 01 · {ACTS[0]!.label}
        </span>
        <span ref={noteRef} className={s.note}>
          {ACTS[0]!.note}
        </span>
      </div>
      <div ref={reelRef} className={s.reel} aria-hidden="true">
        {ACTS.map((a) => (
          <div key={a.id} className={s.seg} style={{ flexGrow: a.n1 - a.n0 + 1 }} />
        ))}
      </div>
    </>
  )
}
