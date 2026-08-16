/**
 * The eight content stations (§8), static pass.
 * All copy comes from src/content/copy.ts — no string literals here (§5).
 * Anchor rotation: CENTRE, LEFT, RIGHT, CENTRE, LEFT, RIGHT, LEFT, CENTRE.
 * Motion, pinning and the film arrive in later phases.
 */
import clsx from 'clsx'
import { COPY } from '../content/copy'
import s from './stations.module.css'

const over = 'overFilm' // global class from base.css (§4.3 text shadow)

export function Entrance() {
  const c = COPY.entrance
  return (
    <div className={s.inner}>
      <div className={clsx(s.scrim, s.scrimHeavy)} aria-hidden="true" />
      <div className={s.grid}>
        <div className={clsx(s.heroWrap, over)}>
          <p className={s.eyebrow}>{c.eyebrow}</p>
          <h1 className={s.hero}>
            {c.heroLines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h1>
          <p className={s.lead}>{c.lead}</p>
          <div className={s.actions}>
            <a className={s.ctaPrimary} href="#booking">
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
      <div className={s.grid}>
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
              <li key={item} className={s.painRow}>
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
      <div className={s.grid}>
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
              <div key={stat.label} className={s.stat}>
                <div className={s.statValue} data-placeholder={stat.countTo === null ? '' : undefined}>
                  {stat.value}
                </div>
                <div className={s.statLabel}>{stat.label}</div>
              </div>
            ))}
          </div>
          <p className={s.foot}>{c.foot}</p>
        </div>
      </div>
    </div>
  )
}

export function Protocol() {
  const c = COPY.protocol
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

export function TableStation() {
  const c = COPY.table
  return (
    <div className={s.inner}>
      <div className={clsx(s.scrim, s.scrimLeft)} aria-hidden="true" />
      <div className={s.grid}>
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
              <div key={myth.strike} className={s.mythPair}>
                <p>
                  <span className={s.mythStrike}>{myth.strike}</span>
                </p>
                <p className={s.mythTruth}>{myth.truth}</p>
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
      <div className={s.grid}>
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
          <ul className={s.aspirations}>
            {c.aspirations.map((item) => (
              <li key={item} className={s.aspiration}>
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
      <div className={s.grid}>
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
          {c.testimonials.map((t) => (
            <figure key={t.name} className={s.card}>
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
      <div className={s.grid}>
        <div className={clsx(s.railCentre, over)}>
          <p className={s.eyebrow}>{c.eyebrow}</p>
          <h2 className={clsx(s.hero, s.heroClose)}>{c.hero}</h2>
          <p className={s.lead}>{c.lead}</p>
          <a className={s.closeCta} href="#booking" id="booking-action">
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
