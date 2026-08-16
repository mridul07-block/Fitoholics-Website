/**
 * The signature element (§2.3): a live film timeline, top right.
 * FRAME 047 / 150 over the current beat name, updating every drawn frame.
 * DOM is written imperatively from the clock — React never re-renders here.
 * Hidden below 768px and under reduced motion (CSS + §9 law 7).
 */
import { useEffect, useRef } from 'react'
import { COPY } from '../content/copy'
import { FILM } from '../film/manifest'
import { initSpine, prefersReducedMotion } from '../film/useMasterProgress'
import s from './Timeline.module.css'

const pad = (n: number) => String(n + 1).padStart(3, '0')
const TOTAL = String(FILM.count).padStart(3, '0')

export function Timeline() {
  const frameRef = useRef<HTMLSpanElement>(null)
  const beatRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (prefersReducedMotion()) return
    const spine = initSpine()
    let lastIndex = -1
    let visible = false
    return spine.clock.onTick((c) => {
      if (c.index === lastIndex) return
      lastIndex = c.index
      if (frameRef.current) frameRef.current.textContent = `${COPY.chrome.frameLabel} ${pad(c.index)} / ${TOTAL}`
      if (beatRef.current) beatRef.current.textContent = c.beat.label
      if (!visible && frameRef.current) {
        visible = true
        frameRef.current.parentElement!.style.opacity = '1'
      }
    })
  }, [])

  return (
    <div className={s.timeline} aria-hidden="true">
      <span ref={frameRef} className={s.frame}>
        {COPY.chrome.frameLabel} 001 / {TOTAL}
      </span>
      <span ref={beatRef} className={s.beat} />
    </div>
  )
}
