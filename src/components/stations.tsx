/**
 * The eight content stations (§8), static pass.
 * All copy comes from src/content/copy.ts — no string literals here (§5).
 * Anchor rotation: CENTRE, LEFT, RIGHT, CENTRE, LEFT, RIGHT, LEFT, CENTRE.
 * Motion, pinning and the film arrive in later phases.
 */
import { useEffect, useRef } from 'react'
import clsx from 'clsx'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { COPY } from '../content/copy'
import { initSpine, prefersReducedMotion } from '../film/useMasterProgress'
import s from './stations.module.css'

gsap.registerPlugin(ScrollTrigger)

const over = 'overFilm' // global class from base.css (§4.3 text shadow)

/** must match .protoNumeral opacity in stations.module.css */
const NUMERAL_REST_OPACITY = 0.16

export function Entrance() {
  const c = COPY.entrance
  return (
    <div className={s.entranceInner}>
      <div className={clsx(s.scrim, s.scrimHeavy)} aria-hidden="true" />
      <div className={s.grid}>
        <div className={clsx(s.heroWrap, over)}>
          <p className={s.eyebrow} data-s1-eyebrow="">
            {c.eyebrow}
          </p>
          <h1 className={s.hero}>
            {c.heroLines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h1>
          <p className={s.lead} data-s1-lead="">
            {c.lead}
          </p>
          <div className={s.actions} data-s1-actions="">
            <a className={s.ctaPrimary} href="#booking" data-magnetic="">
              {c.cta1}
            </a>
            <a className={s.ctaSecondary} href="#protocol">
              {c.cta2}
            </a>
          </div>
        </div>
      </div>
      <div className={s.scrollCue} aria-hidden="true" data-scroll-cue>
        <div className={s.scrollCueRule}>
          <div className={s.scrollCueDot} />
        </div>
        <span className="utility">{c.scroll}</span>
      </div>
    </div>
  )
}

export function Problem() {
  const c = COPY.problem
  return (
    <div className={s.inner}>
      <div className={clsx(s.scrim, s.scrimLeft)} aria-hidden="true" />
      <div className={s.grid} data-panel="">
        <div className={clsx(s.railLeft, over)}>
          <span className={s.index}>{c.index}</span>
          <p className={s.eyebrow}>{c.eyebrow}</p>
          <h2 className={s.h1}>
            {c.h1Lines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h2>
          <p className={s.body}>{c.body1}</p>
          <p className={s.body}>{c.body2}</p>
        </div>
        <div className={clsx(s.railListRight, over)}>
          <span className={s.listLabel}>{c.listLabel}</span>
          <ul className={s.painList}>
            {c.list.map((item) => (
              <li key={item} className={s.painRow} data-pain-row="">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export function Positioning() {
  const c = COPY.positioning
  return (
    <div className={s.inner}>
      <div className={clsx(s.scrim, s.scrimRight)} aria-hidden="true" />
      <div className={s.grid} data-panel="">
        <div className={clsx(s.railRight, over)}>
          <span className={s.index}>{c.index}</span>
          <p className={s.eyebrow}>{c.eyebrow}</p>
          <figure className={s.quoteWrap}>
            <span className={s.quoteGlyph} aria-hidden="true">
              &ldquo;
            </span>
            <blockquote className={s.quote}>{c.quote}</blockquote>
          </figure>
          <div className={s.stats}>
            {c.stats.map((stat) => (
              <div key={stat.label} className={s.statCard} data-stat-card="" data-tilt="">
                <div
                  className={s.statCardValue}
                  data-placeholder={stat.countTo === null ? '' : undefined}
                  data-count-to={stat.countTo ?? undefined}
                  data-count-suffix={stat.countTo !== null ? stat.suffix : undefined}
                >
                  {stat.value}
                </div>
                <div className={s.statCardLabel}>{stat.label}</div>
                <div className={s.statCardBar} data-stat-bar="" aria-hidden="true" />
              </div>
            ))}
          </div>
          <p className={s.foot}>{c.foot}</p>
        </div>
      </div>
    </div>
  )
}

/**
 * Station 4 · The Total Transformation Protocol (§8 S4, Phase 7).
 * The 240svh section holds a 100svh sticky stage: an ember numeral
 * crossfading 01–08, the step text swapping through a bottom-to-top masked
 * wipe, and an honest rail whose segment heights are proportional to each
 * description's length. The film keeps advancing behind it — the sticky pin
 * never changes document geometry, so master progress stays exact.
 * Reduced motion renders the full static list instead.
 */
export function Protocol() {
  const c = COPY.protocol
  const sectionRef = useRef<HTMLDivElement>(null)
  const numeralRef = useRef<HTMLDivElement>(null)
  const layerARef = useRef<HTMLDivElement>(null)
  const layerBRef = useRef<HTMLDivElement>(null)
  const railRef = useRef<HTMLDivElement>(null)
  /** the pin trigger, so the stepper reads the same mapping the pin uses */
  const triggerRef = useRef<ScrollTrigger | null>(null)
  const reduced = prefersReducedMotion()

  useEffect(() => {
    if (reduced) return
    const root = sectionRef.current
    const numeral = numeralRef.current
    const layers = [layerARef.current, layerBRef.current]
    const rail = railRef.current
    if (!root || !numeral || !layers[0] || !layers[1] || !rail) return

    const fills = Array.from(rail.querySelectorAll<HTMLElement>('[data-rail-fill]'))
    const n = c.steps.length

    /**
     * The steps are scrubbed, not played.
     *
     * They used to be a timed tween fired from a threshold: cross the boundary
     * and a 0.44s clip wipe started, independent of the hand. That is the one
     * thing §9 law 2 says this page never does, and it showed. Measured off a
     * phone recording, every boundary went: old copy cut to nothing, ~190ms of
     * empty stage, then the new copy crawling up from the bottom edge so the
     * last line of the body arrived before its own title. Seven of those on the
     * way through the section, each one landing a beat after the finger moved.
     * That is what read as vibrating.
     *
     * Now the two layers tile: the outgoing one travels up and out while the
     * incoming one follows it in from below, both driven straight off scroll
     * progress. They abut exactly — outgoing at -50% covers the top half of the
     * stage, incoming at +50% covers the bottom half — so there is never a gap
     * to blink through and never an overlap to read double. The stage clips, so
     * nothing has to be faded to hide it, and the whole thing is one transform
     * per layer per frame.
     *
     * Stop mid gesture and it holds mid gesture. There is no timer to be out of
     * step with.
     */
    /** share of a step the copy holds still for before handing over */
    const HOLD = 0.72

    /** which step's copy each layer currently holds */
    const held: (number | null)[] = [null, null]

    /* Written straight to style rather than through GSAP. Nothing else animates
       these three elements any more, so there is no tween to conflict with, and
       a scrubbed writer wants the shortest path to the compositor — one string
       per element per frame, no tween objects created and collected while the
       film is drawing. Each is cached so a frame that does not move writes
       nothing at all. */
    const lastY = [NaN, NaN]
    const setY = (slot: number, v: number) => {
      if (lastY[slot] === v) return
      lastY[slot] = v
      layers[slot]!.style.transform = `translate3d(0, ${v}%, 0)`
    }
    let lastNumOpacity = NaN
    let lastNumY = NaN
    const setNumeral = (opacity: number, y: number) => {
      if (lastNumOpacity !== opacity) {
        lastNumOpacity = opacity
        numeral.style.opacity = String(opacity)
      }
      if (lastNumY !== y) {
        lastNumY = y
        numeral.style.transform = `translate3d(0, ${y}px, 0)`
      }
    }

    const writeLayer = (slot: number, i: number) => {
      const step = c.steps[i]!
      const el = layers[slot]!
      el.querySelector('[data-step-title]')!.textContent = step.title
      el.querySelector('[data-step-body]')!.textContent = step.body
      held[slot] = i
    }

    /** the layer holding step `i`, writing it into whichever slot is not `keep` */
    const slotFor = (i: number, keep: number): number => {
      if (held[0] === i) return 0
      if (held[1] === i) return 1
      const slot = held[0] === keep ? 1 : 0
      writeLayer(slot, i)
      return slot
    }

    /** last step the rail's completed segments and the numeral's text were written for */
    let railFor = -1
    let numeralFor = -1

    const render = (progress: number) => {
      const x = Math.min(Math.max(progress, 0), 0.999999) * n
      const i = Math.floor(x)
      const frac = x - i
      const next = Math.min(i + 1, n - 1)
      // the last step has nowhere to hand over to, so it simply holds
      const t = i < n - 1 && frac > HOLD ? (frac - HOLD) / (1 - HOLD) : 0

      const cur = slotFor(i, next)
      setY(cur, -100 * t)
      if (next !== i) setY(slotFor(next, i), 100 * (1 - t))

      // The numeral hands over on the same gesture, through its own zero rather
      // than past the other numeral — two ramp filled digits crossing would be
      // unreadable at this size. opacity, not autoAlpha: it rests at the low
      // opacity set in CSS and autoAlpha would drive it to a solid 1.
      const numIdx = t < 0.5 ? i : next
      if (numIdx !== numeralFor) {
        numeral.textContent = c.steps[numIdx]!.n
        numeralFor = numIdx
      }
      const away = t < 0.5 ? t * 2 : (1 - t) * 2
      setNumeral(NUMERAL_REST_OPACITY * (1 - away), (t < 0.5 ? -22 : 22) * away)

      // The rail is a measuring instrument, so it measures: segments behind you
      // are full, the one you are in fills as you read it. Only the segment you
      // are in is written per frame.
      if (i !== railFor) {
        fills.forEach((f, k) => {
          if (k !== i) f.style.setProperty('--fill', k < i ? '1' : '0')
        })
        railFor = i
      }
      fills[i]?.style.setProperty('--fill', frac.toFixed(3))
    }

    const st = ScrollTrigger.create({
      trigger: root,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => render(self.progress),
    })
    triggerRef.current = st

    writeLayer(0, 0)
    if (n > 1) writeLayer(1, 1)
    setY(0, 0)
    setY(1, 100)
    render(st.progress)

    return () => {
      triggerRef.current = null
      st.kill()
    }
  }, [reduced, c.steps])

  // total characters, for proportional (honest) rail segment heights
  const totalLen = c.steps.reduce((sum, st) => sum + st.body.length, 0)

  /**
   * Travel to a step.
   *
   * The target is interpolated between the pin trigger's own `start` and `end`,
   * not recomputed from the element. Deriving it independently is how this went
   * wrong first time: the track sits inside a `position: relative` section, so
   * its `offsetTop` is a few pixels rather than a document position, and
   * clicking step 06 scrolled upward into step 01. Reading the trigger means
   * the jump and the pin cannot disagree about where a step lives, whatever the
   * offset parent or the section height turn out to be.
   *
   * Scrolled through Lenis rather than window.scrollTo: Lenis owns the scroll
   * position, and moving it behind Lenis' back makes the two fight for a few
   * frames, which shows as a stutter in the film.
   */
  const jumpToStep = (i: number) => {
    const st = triggerRef.current
    if (!st) return
    const p = (i + 0.5) / c.steps.length
    initSpine().lenis.scrollTo(st.start + p * (st.end - st.start), { duration: 1.1 })
  }

  if (reduced) {
    return (
      <div className={clsx(s.inner, s.protocolInner)}>
        <div className={clsx(s.scrim, s.scrimHeavy)} aria-hidden="true" />
        <div className={s.grid}>
          <header className={clsx(s.protocolHead, over)}>
            <span className={s.index}>{c.index}</span>
            <p className={s.eyebrow}>{c.eyebrow}</p>
            <h2 className={s.h1}>{c.h1}</h2>
            <p className={s.protocolLead}>{c.lead}</p>
          </header>
          <ol className={clsx(s.steps, over)}>
            {c.steps.map((step) => (
              <li key={step.n} className={s.step}>
                <span className={s.stepNumeral} aria-hidden="true">
                  {step.n}
                </span>
                <div>
                  <h3 className={s.stepTitle}>{step.title}</h3>
                  <p className={s.stepBody}>{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    )
  }

  return (
    <div ref={sectionRef} className={s.protoTrack}>
      <div className={clsx(s.scrim, s.scrimHeavy)} aria-hidden="true" />
      <div className={s.protoSticky}>
        <div className={s.grid}>
          <header className={clsx(s.protoHead, over)}>
            <span className={s.index}>{c.index}</span>
            <p className={s.eyebrow}>{c.eyebrow}</p>
            <h2 className={s.protoTitle}>{c.h1}</h2>
            <p className={s.protocolLead}>{c.lead}</p>
          </header>
        </div>
        <div className={clsx(s.grid, s.protoBody)}>
          <div ref={numeralRef} className={s.protoNumeral} aria-hidden="true">
            01
          </div>
          <div className={clsx(s.protoStage, over)} aria-hidden="true">
            <div ref={layerARef} className={s.protoLayer}>
              <h3 className={s.stepTitle} data-step-title="">
                {c.steps[0]!.title}
              </h3>
              <p className={s.stepBody} data-step-body="">
                {c.steps[0]!.body}
              </p>
            </div>
            <div ref={layerBRef} className={s.protoLayer}>
              <h3 className={s.stepTitle} data-step-title="" />
              <p className={s.stepBody} data-step-body="" />
            </div>
          </div>
          <div ref={railRef} className={s.protoRail} aria-label={c.h1}>
            {c.steps.map((step, i) => (
              <button
                key={step.n}
                type="button"
                className={s.protoSegment}
                style={{ flexGrow: step.body.length / totalLen }}
                onClick={() => jumpToStep(i)}
                aria-label={`${step.n}. ${step.title}`}
              >
                <span className={s.protoSegmentFill} data-rail-fill="" />
              </button>
            ))}
          </div>
        </div>
        {/* the full sequence stays available to assistive tech and search */}
        <ol className="visuallyHidden">
          {c.steps.map((step) => (
            <li key={step.n}>
              {step.title}. {step.body}
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

export function TableStation() {
  const c = COPY.table
  return (
    <div className={s.inner}>
      <div className={clsx(s.scrim, s.scrimLeft)} aria-hidden="true" />
      <div className={s.grid} data-panel="">
        <div className={clsx(s.railLeft, over)}>
          <span className={s.index}>{c.index}</span>
          <p className={s.eyebrow}>{c.eyebrow}</p>
          <h2 className={s.h1}>
            {c.h1Lines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h2>
          <p className={s.body}>{c.body}</p>
        </div>
        <div className={clsx(s.railWideRight, over)}>
          <span className={s.listLabel}>{c.mythsLabel}</span>
          <div className={s.myths}>
            {c.myths.map((myth) => (
              <div key={myth.strike} className={s.mythCard} data-myth-pair="" data-tilt="">
                <span className={s.mythCardEdge} aria-hidden="true" data-myth-edge="" />
                <p>
                  <span className={s.mythStrike} data-myth-strike="">
                    {myth.strike}
                  </span>
                </p>
                <p className={s.mythTruth} data-myth-truth="">
                  {myth.truth}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function Fit() {
  const c = COPY.fit
  return (
    <div className={s.inner}>
      <div className={clsx(s.scrim, s.scrimRight)} aria-hidden="true" />
      <div className={s.grid} data-panel="">
        <div className={clsx(s.railRight, over)}>
          <span className={s.index}>{c.index}</span>
          <p className={s.eyebrow}>{c.eyebrow}</p>
          <h2 className={s.h1}>
            {c.h1Lines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h2>
          <p className={s.body}>{c.body}</p>
          <span className={s.listLabel}>{c.aspirationsLabel}</span>
          <ul className={s.chips}>
            {c.aspirations.map((item) => (
              <li key={item} className={s.chip} data-aspiration="">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export function Proof() {
  const c = COPY.proof
  return (
    <div className={s.inner}>
      <div className={clsx(s.scrim, s.scrimLeft)} aria-hidden="true" />
      <div className={s.grid} data-panel="">
        <div className={clsx(s.railLeft, over)}>
          <span className={s.index}>{c.index}</span>
          <p className={s.eyebrow}>{c.eyebrow}</p>
          <h2 className={s.h1}>
            {c.h1Lines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h2>
        </div>
        <div className={s.cards}>
          {/* keyed by position, not by name: the list is static and never
              reordered, and keying on a content field breaks the moment two
              entries share it, which the placeholder rows do by design */}
          {c.testimonials.map((t, i) => (
            <figure key={i} className={s.card} data-card="" data-tilt="">
              <blockquote className={s.cardQuote} data-placeholder="">
                {t.quote}
              </blockquote>
              <div className={s.cardRule} aria-hidden="true" />
              <figcaption className={s.cardAttribution}>
                &mdash; {t.name}, {t.profession}, {t.duration} {c.attributionSuffix}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </div>
  )
}

export function Close() {
  const c = COPY.close
  return (
    <div className={s.inner}>
      <div className={clsx(s.scrim, s.scrimHeavy)} aria-hidden="true" />
      <div className={s.grid} data-panel="">
        <div className={clsx(s.railCentre, over)}>
          <p className={s.eyebrow}>{c.eyebrow}</p>
          <h2 className={clsx(s.hero, s.heroClose)}>{c.hero}</h2>
          <p className={s.lead}>{c.lead}</p>
          <a className={s.closeCta} href="#booking" id="booking-action" data-magnetic="">
            {c.cta}
          </a>
          <p className={s.closeNote}>{c.note}</p>
        </div>
      </div>
    </div>
  )
}
