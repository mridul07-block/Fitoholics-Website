/**
 * The nine content stations, in the order src/stations/geometry.ts gives them.
 * All copy comes from src/content/copy.ts: no string literals here.
 *
 * Drafted rows (copy.ts, `draft: true`) pass through live() from
 * content/drafts.ts, which omits them from production and lets previews show
 * them tagged. Every component that renders a list of client facts reads its
 * rows through it, so the rule cannot be forgotten one section at a time.
 */
import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { COPY } from '../content/copy'
import { isDraft, live, liveOne } from '../content/drafts'
import { initSpine, prefersReducedMotion } from '../film/useMasterProgress'
import s from './stations.module.css'

gsap.registerPlugin(ScrollTrigger)

const over = 'overFilm' // global class from base.css (§4.3 text shadow)

/** must match .protoNumeral opacity in stations.module.css */
const NUMERAL_REST_OPACITY = 0.16

/** the visible tag a drafted row carries on builds that show drafts */
function DraftTag() {
  return <span className={s.draftTag}>{COPY.chrome.draft}</span>
}

/** the line under a primary call to action: what the click commits you to */
function BookingDetail({ className, ...rest }: { className?: string; 'data-s1-detail'?: string }) {
  const d = liveOne(COPY.booking.detail)
  if (!d) return null
  return (
    <p className={clsx(s.bookingDetail, className)} data-placeholder={isDraft(d) ? '' : undefined} {...rest}>
      {d.line}
      {isDraft(d) && <DraftTag />}
    </p>
  )
}

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
            <a
              className={s.ctaPrimary}
              href={COPY.booking.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={COPY.booking.a11y}
              data-magnetic=""
              data-cta="hero"
            >
              {c.cta1}
            </a>
            <a className={s.ctaSecondary} href="#method">
              {c.cta2}
            </a>
          </div>
          <BookingDetail className={s.heroDetail} data-s1-detail="" />
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
          <h2 className={s.h1} data-headline="">
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

/** the instrument cards: a value, its label, and a bar that fills on reveal */
function StatCards({
  stats,
}: {
  stats: readonly {
    readonly value: string
    readonly label: string
    readonly countTo: number | null
    readonly suffix: string
    readonly draft?: boolean
  }[]
}) {
  return (
    <div className={s.stats}>
      {live(stats).map((stat) => (
        <div
          key={stat.label}
          className={s.statCard}
          data-stat-card=""
          data-tilt=""
          data-placeholder={isDraft(stat) ? '' : undefined}
        >
          <div
            className={s.statCardValue}
            data-count-to={stat.countTo ?? undefined}
            data-count-suffix={stat.countTo !== null ? stat.suffix : undefined}
          >
            {stat.value}
          </div>
          <div className={s.statCardLabel}>{stat.label}</div>
          <div className={s.statCardBar} data-stat-bar="" aria-hidden="true" />
          {isDraft(stat) && <DraftTag />}
        </div>
      ))}
    </div>
  )
}

export function Credibility() {
  const c = COPY.credibility
  const credentials = live(c.credentials)
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
            <blockquote className={s.quote} data-headline="">
              {c.quote}
            </blockquote>
          </figure>
          <StatCards stats={c.stats} />
          {credentials.length > 0 && (
            <>
              <span className={s.listLabel}>{c.credentialsLabel}</span>
              <ul className={s.painList}>
                {credentials.map((row) => (
                  <li
                    key={row.text}
                    className={s.painRow}
                    data-credential=""
                    data-placeholder={isDraft(row) ? '' : undefined}
                  >
                    {row.text}
                    {isDraft(row) && <DraftTag />}
                  </li>
                ))}
              </ul>
            </>
          )}
          <p className={s.foot}>{c.foot}</p>
          <p className={s.disclaimer}>{COPY.trust.disclaimer}</p>
        </div>
      </div>
    </div>
  )
}

/**
 * A client clip, loaded on tap. The poster is a still and the player is an
 * iframe that exists only after the visitor asks for it, so a page with six
 * clips costs nothing until one is played.
 */
function VideoFacade({ title, embed, poster }: { title: string; embed: string; poster: string }) {
  const [playing, setPlaying] = useState(false)
  if (playing) {
    return (
      <div className={s.video}>
        <iframe
          className={s.videoFrame}
          src={`${embed}${embed.includes('?') ? '&' : '?'}autoplay=1`}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      </div>
    )
  }
  return (
    <button type="button" className={s.video} onClick={() => setPlaying(true)} data-video="">
      <img className={s.videoPoster} src={poster} alt="" loading="lazy" decoding="async" />
      <span className={s.videoPlay} aria-hidden="true" />
      <span className={s.videoTitle}>
        <span className="visuallyHidden">{COPY.transformations.playLabel}: </span>
        {title}
      </span>
    </button>
  )
}

export function Transformations() {
  const c = COPY.transformations
  const cases = live(c.cases)
  const testimonials = live(c.testimonials)
  const videos = live(c.videos)
  return (
    <div className={s.inner}>
      <div className={clsx(s.scrim, s.scrimLeft)} aria-hidden="true" />
      <div className={s.grid} data-panel="">
        <div className={clsx(s.railLeft, over)}>
          <span className={s.index}>{c.index}</span>
          <p className={s.eyebrow}>{c.eyebrow}</p>
          <h2 className={s.h1} data-headline="">
            {c.h1Lines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h2>
          <p className={s.body}>{c.lead}</p>
        </div>

        {cases.length > 0 ? (
          <div className={clsx(s.fullRow, over)}>
            <span className={s.listLabel}>{c.casesLabel}</span>
            <div className={s.cases}>
              {/* keyed by position: the list is static and drafted rows may share names */}
              {cases.map((k, i) => (
                <figure
                  key={i}
                  className={s.case}
                  data-case=""
                  data-tilt=""
                  data-placeholder={isDraft(k) ? '' : undefined}
                >
                  <div className={s.casePair} role="img" aria-label={k.alt}>
                    <div className={s.caseShot}>
                      {k.before ? (
                        <img src={k.before} alt="" loading="lazy" decoding="async" />
                      ) : (
                        <span className={s.caseShotLabel}>{c.beforeLabel}</span>
                      )}
                    </div>
                    <div className={s.caseShot}>
                      {k.after ? (
                        <img src={k.after} alt="" loading="lazy" decoding="async" />
                      ) : (
                        <span className={s.caseShotLabel}>{c.afterLabel}</span>
                      )}
                    </div>
                  </div>
                  <p className={s.caseResult}>{k.result}</p>
                  <figcaption className={s.caseMeta}>
                    {k.name}, {k.age}, {k.profession} · {k.timeframe}
                  </figcaption>
                  {isDraft(k) && <DraftTag />}
                </figure>
              ))}
            </div>
          </div>
        ) : (
          <p className={clsx(s.emptyNote, over)}>{c.emptyNote}</p>
        )}

        {videos.length > 0 && (
          <div className={clsx(s.fullRow, over)}>
            <span className={s.listLabel}>{c.videosLabel}</span>
            <div className={s.videos}>
              {videos.map((v) => (
                <VideoFacade key={v.embed} title={v.title} embed={v.embed} poster={v.poster} />
              ))}
            </div>
          </div>
        )}

        {testimonials.length > 0 && (
          <div className={clsx(s.fullRow, over)}>
            <span className={s.listLabel}>{c.testimonialsLabel}</span>
            <div className={s.cards}>
              {testimonials.map((t, i) => (
                <figure key={i} className={s.card} data-card="" data-tilt="">
                  <blockquote className={s.cardQuote} data-placeholder={isDraft(t) ? '' : undefined}>
                    {t.quote}
                  </blockquote>
                  <div className={s.cardRule} aria-hidden="true" />
                  <figcaption className={s.cardAttribution}>
                    &mdash; {t.name}, {t.profession}, {t.duration} {c.attributionSuffix}
                  </figcaption>
                  {isDraft(t) && <DraftTag />}
                </figure>
              ))}
            </div>
          </div>
        )}

        <p className={clsx(s.disclaimer, s.fullRow, over)}>{COPY.trust.disclaimer}</p>
      </div>
    </div>
  )
}

export function Receive() {
  const c = COPY.receive
  const app = liveOne(c.app)
  return (
    <div className={s.inner}>
      <div className={clsx(s.scrim, s.scrimLeft)} aria-hidden="true" />
      <div className={s.grid} data-panel="">
        <div className={clsx(s.railLeft, over)}>
          <span className={s.index}>{c.index}</span>
          <p className={s.eyebrow}>{c.eyebrow}</p>
          <h2 className={s.h1} data-headline="">
            {c.h1Lines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h2>
          <p className={s.body}>{c.lead}</p>
          <dl className={s.facts}>
            {live(c.facts).map((f) => (
              <div
                key={f.label}
                className={s.fact}
                data-stat-card=""
                data-placeholder={isDraft(f) ? '' : undefined}
              >
                <dt className={s.factLabel}>{f.label}</dt>
                <dd className={s.factValue}>{f.value}</dd>
                {isDraft(f) && <DraftTag />}
              </div>
            ))}
          </dl>
        </div>
        <div className={clsx(s.railWideRight, over)}>
          <ul className={s.receiveList}>
            {c.items.map((item) => (
              <li key={item.label} className={clsx(s.painRow, s.receiveRow)} data-receive-row="">
                <span className={s.receiveLabel}>{item.label}</span>
                <span className={s.receiveBody}>{item.body}</span>
              </li>
            ))}
          </ul>
          {app && (
            <div className={s.appBlock} data-placeholder={isDraft(app) ? '' : undefined}>
              <span className={s.listLabel}>{app.label}</span>
              <p className={s.appTitle}>{app.title}</p>
              <p className={s.appBody}>{app.body}</p>
              {app.screens.length > 0 && (
                <div className={s.appScreens}>
                  {app.screens.map((sc) => (
                    <img key={sc.src} src={sc.src} alt={sc.alt} loading="lazy" decoding="async" />
                  ))}
                </div>
              )}
              {isDraft(app) && <DraftTag />}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function Pathways() {
  const c = COPY.pathways
  const paths = live(c.paths).filter((p) => p.offered)
  return (
    <div className={s.inner}>
      <div className={clsx(s.scrim, s.scrimHeavy)} aria-hidden="true" />
      <div className={s.grid} data-panel="">
        <div className={clsx(s.railLeft, over)}>
          <span className={s.index}>{c.index}</span>
          <p className={s.eyebrow}>{c.eyebrow}</p>
          <h2 className={s.h1} data-headline="">
            {c.h1Lines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h2>
          <p className={s.body}>{c.body}</p>
        </div>
        <div className={clsx(s.railListRight, over)}>
          <span className={s.listLabel}>{c.aspirationsLabel}</span>
          <ul className={s.chips}>
            {c.aspirations.map((item) => (
              <li key={item} className={s.chip} data-aspiration="">
                {item}
              </li>
            ))}
          </ul>
        </div>
        {paths.length > 0 && (
          <div className={clsx(s.fullRow, s.paths, over)}>
            {paths.map((p) => (
              <article
                key={p.key}
                className={s.path}
                data-path=""
                data-tilt=""
                data-placeholder={isDraft(p) ? '' : undefined}
              >
                <h3 className={s.pathTitle}>{p.title}</h3>
                <p className={s.pathWho}>{p.who}</p>
                <p className={s.pathLine}>{p.connects}</p>
                <p className={clsx(s.pathLine, s.pathGets)}>{p.gets}</p>
                {isDraft(p) && <DraftTag />}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * The method (§8 S4, Phase 7).
 * The section holds a 100svh sticky stage: an ember numeral crossfading
 * 01–08, the step text swapping through a bottom-to-top masked wipe, and an
 * honest rail whose segment heights are proportional to each description's
 * length. The film keeps advancing behind it — the sticky pin never changes
 * document geometry, so master progress stays exact.
 * Reduced motion renders the full static list instead.
 */
export function Method() {
  const c = COPY.method
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
    /** the in flight wipe and numeral swap, so the next step can cancel them */
    let wipe: gsap.core.Tween | null = null
    let numeralTl: gsap.core.Timeline | null = null

    const writeLayer = (el: HTMLElement, i: number) => {
      const step = c.steps[i]!
      el.querySelector('[data-step-title]')!.textContent = step.title
      el.querySelector('[data-step-body]')!.textContent = step.body
    }

    const swap = (next: number, instant: boolean) => {
      const step = c.steps[next]!
      // Two steps can be requested inside one wipe on a fast scroll. Whatever is
      // still running belongs to a step nobody is looking at any more.
      wipe?.kill()
      wipe = null
      numeralTl?.kill()
      numeralTl = null
      // numeral crossfade: 0.35s opacity swap with a 22px Y drift (§8 S4)
      if (instant) {
        numeral.textContent = step.n
        gsap.set(numeral, { opacity: NUMERAL_REST_OPACITY, y: 0 })
      } else {
        // opacity, not autoAlpha: the numeral rests at the low opacity set in
        // CSS, and autoAlpha would drive it to a solid 1 and never restore it
        numeralTl = gsap
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
      /**
       * The outgoing layer goes NOW, not when the wipe finishes.
       *
       * A layer has no background — it is bare type over the film — so an
       * incoming layer stacked above an outgoing one occludes nothing. Hiding
       * the old copy on the wipe's onComplete meant both steps were rendered on
       * top of each other, both fully legible, for the whole 440ms: the smeared
       * double text that reads as the animation lagging. The wipe is a reveal of
       * the new copy against the footage, and it only works alone.
       */
      gsap.set(outgoing, { zIndex: 1, autoAlpha: 0 })
      if (instant) {
        gsap.set(incoming, { clipPath: 'inset(0% 0% 0% 0%)', zIndex: 2 })
      } else {
        gsap.set(incoming, { clipPath: 'inset(100% 0% 0% 0%)', zIndex: 2 })
        wipe = gsap.to(incoming, {
          clipPath: 'inset(0% 0% 0% 0%)',
          duration: 0.44,
          ease: 'power2.inOut',
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
      wipe?.kill()
      numeralTl?.kill()
      st.kill()
    }
  }, [reduced, c.steps])

  // total characters, for proportional (honest) rail segment heights
  const totalLen = c.steps.reduce((sum, st) => sum + st.body.length, 0)

  /**
   * Travel to a step.
   *
   * The target is interpolated between the pin trigger's own `start` and `end`,
   * not recomputed from the element, so the jump and the pin cannot disagree
   * about where a step lives. Scrolled through Lenis rather than
   * window.scrollTo: Lenis owns the scroll position, and moving it behind
   * Lenis' back makes the two fight for a few frames, which shows in the film.
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
            <h2 className={s.h1} data-headline="">
              {c.h1}
            </h2>
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
            <h2 className={s.protoTitle} data-headline="">
              {c.h1}
            </h2>
            <p className={s.protocolLead}>{c.lead}</p>
          </header>
        </div>
        <div className={clsx(s.grid, s.protoBody)}>
          <div ref={numeralRef} className={s.protoNumeral} aria-hidden="true">
            {c.steps[0]!.n}
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

export function Nutrition() {
  const c = COPY.nutrition
  return (
    <div className={s.inner}>
      <div className={clsx(s.scrim, s.scrimLeft)} aria-hidden="true" />
      <div className={s.grid} data-panel="">
        <div className={clsx(s.railLeft, over)}>
          <span className={s.index}>{c.index}</span>
          <p className={s.eyebrow}>{c.eyebrow}</p>
          <h2 className={s.h1} data-headline="">
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

export function Close() {
  const c = COPY.close
  const details = live(c.details)
  return (
    <div className={s.inner}>
      <div className={clsx(s.scrim, s.scrimHeavy)} aria-hidden="true" />
      <div className={s.grid} data-panel="">
        <div className={clsx(s.railCentre, over)}>
          <p className={s.eyebrow}>{c.eyebrow}</p>
          <h2 className={clsx(s.hero, s.heroClose)} data-headline="">
            {c.hero}
          </h2>
          <p className={s.lead}>{c.lead}</p>
          {details.length > 0 && (
            <dl className={s.closeDetails}>
              {details.map((d) => (
                <div key={d.label} className={s.closeDetail} data-placeholder={isDraft(d) ? '' : undefined}>
                  <dt className={s.closeDetailLabel}>{d.label}</dt>
                  <dd className={s.closeDetailValue}>
                    {d.value}
                    {isDraft(d) && <DraftTag />}
                  </dd>
                </div>
              ))}
            </dl>
          )}
          <a
            className={s.closeCta}
            href={COPY.booking.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={COPY.booking.a11y}
            id="booking-action"
            data-magnetic=""
            data-cta="close"
          >
            {c.cta}
          </a>
          <p className={s.closeNote}>{c.note}</p>
        </div>
      </div>
    </div>
  )
}
