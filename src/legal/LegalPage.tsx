/**
 * One legal document as a page: privacy, terms, or refunds and cancellations.
 *
 * A document, not a station. No film, no motion, one column of prose at
 * reading measure, the lockup linking home. A drafted document shows its
 * review band on builds that show drafts, and the holding note everywhere
 * else, so unreviewed terms are never presented as binding.
 */
import { COPY } from '../content/copy'
import { SHOW_DRAFTS, isDraft } from '../content/drafts'
import { LEGAL, LEGAL_CHROME, legalByKey, type LegalKey } from '../content/legal'
import s from './LegalPage.module.css'

export function LegalPage({ page }: { page: LegalKey }) {
  const doc = legalByKey(page)
  const draft = isDraft(doc)
  const others = LEGAL.filter((d) => d.key !== page)
  return (
    <div className={s.page}>
      <header className={s.masthead}>
        <a className={s.brand} href="/">
          <img src="/brand/lockup.webp" alt={COPY.nav.brandAlt} width={720} height={214} decoding="async" />
        </a>
        <a className={s.back} href="/">
          {LEGAL_CHROME.back}
        </a>
      </header>

      <main className={s.doc} id="top">
        <p className={s.eyebrow}>{LEGAL_CHROME.siteName}</p>
        <h1 className={s.title}>{doc.title}</h1>
        <p className={s.summary}>{doc.summary}</p>
        <p className={s.updated}>
          {LEGAL_CHROME.updatedLabel} {doc.updated}
        </p>

        {draft && SHOW_DRAFTS && <p className={s.band}>{LEGAL_CHROME.draftBand}</p>}

        {draft && !SHOW_DRAFTS ? (
          <section className={s.section}>
            <h2 className={s.h2}>{LEGAL_CHROME.holdingTitle}</h2>
            <p>{LEGAL_CHROME.holding}</p>
          </section>
        ) : (
          doc.sections.map((sec) => (
            <section key={sec.h} className={s.section}>
              <h2 className={s.h2}>{sec.h}</h2>
              {sec.p.map((para) => (
                <p key={para}>{para}</p>
              ))}
            </section>
          ))
        )}
      </main>

      <footer className={s.foot}>
        <span className={s.label}>{LEGAL_CHROME.alsoLabel}</span>
        <nav className={s.links} aria-label={LEGAL_CHROME.alsoLabel}>
          {others.map((d) => (
            <a key={d.key} className={s.link} href={d.path}>
              {d.title}
            </a>
          ))}
          <a className={s.link} href="/">
            {LEGAL_CHROME.back}
          </a>
        </nav>
        <span className={s.meta}>
          {LEGAL_CHROME.contactLabel}:{' '}
          <a className={s.link} href={`mailto:${COPY.footer.contact.email}`}>
            {COPY.footer.contact.email}
          </a>
        </span>
        <span className={s.meta}>{COPY.footer.copyright}</span>
      </footer>
    </div>
  )
}
