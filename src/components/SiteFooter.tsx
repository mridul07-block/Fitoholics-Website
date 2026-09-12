/**
 * The end of the page. The film has already ended above, under the trust
 * block (components/TrustBlock.tsx), which sits between the last station and
 * this footer on solid ground.
 *
 * It sits after <main> on its own glass pane, so the footage never runs under
 * a wall of contact details. The condensed footer that used to live inside
 * the close station has moved here, bringing the brand lockup with it; the
 * close station keeps only its call to action.
 *
 * Outbound links carry rel="noopener" — a new tab must never get a handle on
 * this window — and are marked up as external so the anchor handler in
 * motion/a11y.ts, which only claims in-page hashes, leaves them alone.
 */
import { COPY } from '../content/copy'
import { BrandLockup } from './BrandMark'
import s from './SiteFooter.module.css'

export function SiteFooter() {
  const f = COPY.footer
  return (
    <footer className={s.footer}>
      <div className={s.rule} aria-hidden="true" data-footer-rule="" />
      <div className={s.grid}>
        <div className={s.identity} data-footer-col="">
          <BrandLockup />
          <div className={s.name}>{f.name}</div>
          <div className={s.meta}>{f.role}</div>
          <p className={s.tagline}>{f.tagline}</p>
        </div>

        <nav className={s.column} aria-label={f.linksLabel} data-footer-col="">
          <span className={s.label}>{f.linksLabel}</span>
          {f.links.map((l) => {
            // Every entry here is an in-page section except the last, which
            // books the consultation and so leaves for WhatsApp like the
            // social links below.
            const external = !l.href.startsWith('#')
            return (
              <a
                key={l.href}
                className={s.link}
                href={l.href}
                {...(external && {
                  target: '_blank',
                  rel: 'noopener noreferrer',
                  'aria-label': COPY.booking.a11y,
                })}
              >
                {l.label}
              </a>
            )
          })}
        </nav>

        <div className={s.column} data-footer-col="">
          <span className={s.label}>{f.contactLabel}</span>
          <a className={s.link} href={`mailto:${f.contact.email}`}>
            {f.contact.email}
          </a>
          <a className={s.link} href={`tel:${f.contact.phone.replace(/\s+/g, '')}`}>
            {f.contact.phone}
          </a>
        </div>

        <nav className={s.column} aria-label={f.followLabel} data-footer-col="">
          <span className={s.label}>{f.followLabel}</span>
          {f.social.map((a) => (
            <a
              key={a.href}
              className={s.link}
              href={a.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {a.label}
            </a>
          ))}
        </nav>

        <nav className={s.column} aria-label={f.legalLabel} data-footer-col="">
          <span className={s.label}>{f.legalLabel}</span>
          {f.legal.map((l) => (
            <a key={l.href} className={s.link} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>
      </div>

      <div className={s.baseline} data-footer-col="">
        <span className={s.meta}>{f.copyright}</span>
        <span className={s.credits}>
          {f.credits.map((c) => (
            <span key={c.href} className={s.meta}>
              {c.prefix}{' '}
              <a className={s.credit} href={c.href} target="_blank" rel="noopener noreferrer">
                {c.name}
              </a>
            </span>
          ))}
        </span>
      </div>
    </footer>
  )
}
