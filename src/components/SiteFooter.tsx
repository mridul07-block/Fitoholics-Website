/**
 * The end of the page, and deliberately the end of the film.
 *
 * It sits after <main> on an opaque plate, so the footage stops here rather
 * than running under a wall of contact details. The condensed footer that used
 * to live inside station 8 has moved here; the close station keeps only its
 * call to action.
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
          {f.links.map((l) => (
            <a key={l.href} className={s.link} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>

        <div className={s.column} data-footer-col="">
          <span className={s.label}>{f.contactLabel}</span>
          <a className={s.link} href={`mailto:${f.contact.email}`}>
            {f.contact.email}
          </a>
          <span className={s.link}>{f.contact.instagram}</span>
          <a className={s.link} href={`tel:${f.contact.phone.replace(/\s+/g, '')}`}>
            {f.contact.phone}
          </a>
        </div>
      </div>

      <div className={s.baseline} data-footer-col="">
        <span className={s.meta}>{f.copyright}</span>
      </div>
    </footer>
  )
}
