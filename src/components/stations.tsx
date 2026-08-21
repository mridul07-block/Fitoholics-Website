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
    <div className={s.inner}>
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
    let current = -1
    let front = 0

    const writeLayer = (el: HTMLElement, i: number) => {
      const step = c.steps[i]!
      el.querySelector('[data-step-title]')!.textContent = step.title
      el.querySelector('[data-step-body]')!.textContent = step.body
    }

    const swap = (next: number, instant: boolean) => {
      const step = c.steps[next]!
      // numeral crossfade: 0.35s opacity swap with a 22px Y drift (§8 S4)
      if (instant) {
        numeral.textContent = step.n
      } else {
        // opacity, not autoAlpha: the numeral rests at the low opacity set in
        // CSS, and autoAlpha would drive it to a solid 1 and never restore it
        gsap
          .timeline()
          .to(numeral, { opacity: 0, y: -22, duration: 0.175, ease: 'power2.inOut' })
          .add(() => {
            numeral.textContent = step.n
          })
          .fromTo(
            numeral,
            { opacity: 0, y: 22 },
            { opacity: NUMERAL_REST_OPACITY, y: 0, duration: 0.175, ease: 'power2.out' },
          )
      }
      // masked wipe, clip travelling bottom to top over 0.44s (§8 S4)
      const incoming = layers[1 - front]!
      const outgoing = layers[front]!
      writeLayer(incoming, next)
      if (instant) {
        gsap.set(incoming, { clipPath: 'inset(0% 0% 0% 0%)', zIndex: 2 })
        gsap.set(outgoing, { zIndex: 1, autoAlpha: 0 })
      } else {
        gsap.set(incoming, { clipPath: 'inset(100% 0% 0% 0%)', autoAlpha: 1, zIndex: 2 })
        gsap.set(outgoing, { zIndex: 1 })
        gsap.to(incoming, {
          clipPath: 'inset(0% 0% 0% 0%)',
          duration: 0.44,
          ease: 'power2.inOut',
          onComplete: () => gsap.set(outgoing, { autoAlpha: 0 }),
        })
      }
      gsap.set(incoming, { autoAlpha: 1 })
      front = 1 - front
      // rail fills with ember as each step activates (CSS var: axis-agnostic,
      // the rail is vertical on desktop and horizontal below 900px)
      fills.forEach((f, i) => {
        gsap.to(f, { '--fill': i <= next ? 1 : 0, duration: 0.3, ease: 'power2.out' } as gsap.TweenVars)
      })
    }

    const st = ScrollTrigger.create({
      trigger: root,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        const step = Math.min(c.steps.length - 1, Math.floor(self.progress * c.steps.length))
        if (step !== current) {
          const instant = current < 0
          current = step
          swap(step, instant)
        }
      },
    })
    triggerRef.current = st
    swap(0, true)
    current = 0
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
  const f = COPY.footer
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
        <footer className={clsx(s.footer, over)}>
          <div className={s.footerRule} aria-hidden="true" />
          <div className={s.footerRow}>
            <div>
              <div className={s.footerName}>{f.name}</div>
              <div className={s.footerMeta}>{f.role}</div>
            </div>
            <div className={s.footerContacts}>
              <span className={s.footerMeta}>{f.contact.email}</span>
              <span className={s.footerMeta}>{f.contact.instagram}</span>
              <span className={s.footerMeta}>{f.contact.phone}</span>
            </div>
          </div>
          <div className={s.footerMeta}>{f.copyright}</div>
        </footer>
      </div>
    </div>
  )
}
