/**
 * The measure rail — the page's signature mark.
 *
 * A hairline down the right edge carrying one tick per chapter, filling with
 * the ramp as you descend. It replaces the old film readout, which reported the
 * footage (FRAME 001 / 300, ACT 01) rather than the reader's position. This
 * reports the reader: how far through, and which of the eight chapters.
 *
 * No text, by design. On a page twelve screens tall the reader needs a sense of
 * position, but naming it in words made the chrome loud; a mark is enough.
 *
 * Tick positions are MEASURED, never derived from the spec heights in beats.ts.
 * `min-height` is a floor, so a section whose copy outgrows it stretches, and
 * spec-derived ticks would drift away from the sections they mark. Same reason
 * filmMap.ts pins film progress to measured tops.
 *
 * Written imperatively from the existing clock tick. React never re-renders
 * here, and no new rAF loop is created — `__rafAudit()` must stay at 1.
 */
import { useEffect, useRef } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SECTIONS } from '../film/beats'
import { initSpine } from '../film/useMasterProgress'
import s from './MeasureRail.module.css'

/** progress epsilon before the fill is rewritten; 1/600 is sub pixel on any rail */
const STEP = 1 / 600

export function MeasureRail() {
  const fillRef = useRef<HTMLDivElement>(null)
  const ticksRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fill = fillRef.current
    const ticksHost = ticksRef.current
    if (!fill || !ticksHost) return

    const spine = initSpine()
    const ticks = Array.from(ticksHost.children) as HTMLElement[]
    let bounds: number[] = []

    /** where each chapter starts, as a fraction of total scroll */
    const measure = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
      const els = Array.from(document.querySelectorAll<HTMLElement>('[data-station]'))
      bounds = els.map((el) => Math.min(1, Math.max(0, el.offsetTop / max)))
      bounds.forEach((b, i) => {
        const t = ticks[i]
        if (t) t.style.top = `${(b * 100).toFixed(3)}%`
      })
    }
    measure()
    ScrollTrigger.addEventListener('refresh', measure)

    let lastFill = -1
    let lastActive = -1
    const off = spine.clock.onTick(() => {
      const p = Math.min(1, Math.max(0, spine.master.progress))

      if (Math.abs(p - lastFill) >= STEP) {
        lastFill = p
        // scaleY on a pre-painted gradient: no layout, no paint, compositor only
        fill.style.transform = `scaleY(${p})`
      }

      let active = 0
      for (let i = 0; i < bounds.length; i++) if (p >= bounds[i]!) active = i
      if (active !== lastActive) {
        if (lastActive >= 0) ticks[lastActive]?.removeAttribute('data-active')
        ticks[active]?.setAttribute('data-active', '')
        for (let i = 0; i < ticks.length; i++) {
          if (i < active) ticks[i]!.setAttribute('data-passed', '')
          else ticks[i]!.removeAttribute('data-passed')
        }
        lastActive = active
      }
    })

    return () => {
      off()
      ScrollTrigger.removeEventListener('refresh', measure)
    }
  }, [])

  return (
    <div className={s.rail} aria-hidden="true" data-measure-rail>
      <div className={s.track} />
      <div ref={fillRef} className={s.fill} />
      <div ref={ticksRef} className={s.ticks}>
        {SECTIONS.map((section) => (
          <div key={section.id} className={s.tick} />
        ))}
      </div>
    </div>
  )
}
