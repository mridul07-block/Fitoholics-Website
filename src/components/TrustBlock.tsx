/**
 * The trust floor, after the film ends.
 *
 * Mounted inside <main> after the last station, without data-station, so it
 * is not part of the film: filmMap.ts holds the final frame under it and the
 * ground here is the daylight-1 brown. The questions are native <details>,
 * which need no script to open and are read by search as a FAQ.
 *
 * It carries no legal links of its own. It used to, and they were the same
 * three the footer sets directly underneath it, so the page ended by saying
 * the same thing twice. The footer's LEGAL column is the one place they live.
 */
import { COPY } from '../content/copy'
import { isDraft, live } from '../content/drafts'
import s from './TrustBlock.module.css'

export function TrustBlock() {
  const t = COPY.trust
  const faq = live(t.faq)
  return (
    <section className={s.trust} id="faq" aria-label={COPY.a11y.trust}>
      <div className={s.inner}>
        <div className={s.head}>
          <p className={s.eyebrow}>{t.eyebrow}</p>
          <h2 className={s.title}>{t.title}</h2>
        </div>

        <div className={s.faq}>
          {faq.map((f) => (
            <details key={f.q} className={s.item} data-faq="" data-placeholder={isDraft(f) ? '' : undefined}>
              <summary className={s.q}>
                <span>{f.q}</span>
                <span className={s.mark} aria-hidden="true" />
              </summary>
              <p className={s.a}>
                {f.a}
                {isDraft(f) && <span className={s.draftTag}>{COPY.chrome.draft}</span>}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
