/**
 * L3 chrome · the masthead.
 *
 * A pane of glass inset from the edges, so the film is never boxed in by a bar
 * painted across it. It starts nearly clear over the opening frame and
 * densifies once the page has moved past the first screen; that flag is
 * written straight to the DOM from a passive listener, because the bar must
 * not re-render React on scroll — that is the film's budget (§7.1).
 *
 * Reading down it retreats off the top edge and reading back up it returns,
 * so it never sits on the headline of the station passing under it.
 *
 * Anchors ride Lenis via the global handler in motion/a11y.ts, so the links
 * here are plain hashes and need no scroll code of their own.
 */
import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import gsap from 'gsap'
import { COPY } from '../content/copy'
import { prefersReducedMotion } from '../film/useMasterProgress'
import s from './Nav.module.css'

/** how far the page must move before the bar takes a plate */
const PLATE_AT = 64
/** below this the bar always stays put — the hero is not a place to retreat */
const RETREAT_AT = 260
/** ignore scroll jitter smaller than this before changing direction */
const RETREAT_DELTA = 6

export function Nav() {
  const barRef = useRef<HTMLElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  // read inside the scroll listener, which is installed once and must not be
  // torn down and rebuilt every time the menu toggles
  const openRef = useRef(false)
  openRef.current = open

  // Visible from the first paint. It used to be hidden until the entrance
  // had played, but there is no preloader in front of the page any more and
  // the masthead is part of what a visitor is meant to see immediately.
  useEffect(() => {
    const bar = barRef.current
    if (!bar) return
    const reduced = prefersReducedMotion()
    let plated = false
    let hidden = false
    let lastY = window.scrollY

    const onScroll = () => {
      const y = window.scrollY

      const plate = y > PLATE_AT
      if (plate !== plated) {
        plated = plate
        bar.toggleAttribute('data-plated', plate)
      }

      // Reading down, the bar gets out of the way; reading back up, it
      // returns. A pane parked over the film collides with the headline of
      // whichever station is passing under it, and this is also the moment a
      // visitor is least likely to want chrome.
      const dy = y - lastY
      if (Math.abs(dy) < RETREAT_DELTA) return
      lastY = y
      const hide = dy > 0 && y > RETREAT_AT && !openRef.current
      if (hide === hidden) return
      hidden = hide
      gsap.to(bar, {
        yPercent: hide ? -145 : 0,
        autoAlpha: hide ? 0 : 1,
        duration: reduced ? 0 : 0.45,
        ease: 'power3.out',
        overwrite: 'auto',
      })
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /**
   * Publish the pane's real height as --nav-h.
   *
   * This is a floating pane, so it pushes nothing down: anything that must not
   * sit underneath it has to reserve the room itself, and tokens.css turns this
   * into --nav-clear for the opening eyebrow and the pinned protocol header.
   *
   * Measured rather than assumed, because the pane is not one height. It is
   * ~64px with everything on one row, but the brand block and the toggle stop
   * fitting side by side somewhere around 380px and it wraps to ~128px — a
   * hardcoded number puts the first line of the page back underneath it on a
   * small phone. The 64px in tokens.css is only the value before this runs.
   */
  useEffect(() => {
    const bar = barRef.current
    if (!bar) return
    const write = () => {
      // Never while the menu is open: the panel is inside the pane and doubles
      // its height, and opening a menu must not reflow the page behind it.
      if (openRef.current) return
      document.documentElement.style.setProperty('--nav-h', `${Math.round(bar.offsetHeight)}px`)
    }
    write()
    const ro = new ResizeObserver(write)
    ro.observe(bar)
    return () => ro.disconnect()
  }, [])

  /**
   * The open menu owns the keyboard. Focus moves onto its first link when it
   * opens, Tab cycles through the toggle and the panel's links without
   * escaping into the page behind, Escape closes it, and focus returns to
   * the toggle on close so a keyboard user is back where they started.
   */
  useEffect(() => {
    if (!open) return
    const toggle = toggleRef.current
    const panel = panelRef.current
    const focusables = (): HTMLElement[] => [
      ...(toggle ? [toggle] : []),
      ...Array.from(panel?.querySelectorAll<HTMLElement>('a[href], button') ?? []),
    ]
    focusables()[1]?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        return
      }
      if (e.key !== 'Tab') return
      const f = focusables()
      const first = f[0]
      const last = f[f.length - 1]
      if (!first || !last) return
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      toggle?.focus()
    }
  }, [open])

  const c = COPY.nav

  return (
    <header ref={barRef} className={clsx(s.bar, open && s.barOpen)} data-nav="">
      {/* The logo itself, not a redrawing of it. The masthead used to set the
          coach's name in the page's own display face beside a cropped runner,
          which is a lockup the brand does not own — the real one already pairs
          the figure with FITOHOLIX and its strapline, and it is the thing
          people recognise. Explicit dimensions so it reserves its box before it
          decodes; the pane measures its own height into --nav-h afterwards.
          Preloaded from index.html, since it is on screen from the first
          paint; the footer reuses the same file. */}
      <a className={s.brand} href="#top">
        <img
          className={s.brandLockup}
          src="/brand/lockup.webp"
          alt={c.brandAlt}
          width={720}
          height={214}
          decoding="async"
        />
      </a>

      <nav className={s.links} aria-label={c.brand}>
        {c.links.map((l) => (
          <a key={l.href} className={s.link} href={l.href}>
            {l.label}
          </a>
        ))}
      </nav>

      <a
        className={s.cta}
        href={COPY.booking.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={COPY.booking.a11y}
        data-magnetic=""
      >
        {c.cta}
      </a>

      <button
        ref={toggleRef}
        type="button"
        className={s.toggle}
        aria-expanded={open}
        aria-controls="nav-panel"
        aria-label={open ? c.menuClose : c.menuOpen}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={s.toggleBar} aria-hidden="true" />
        <span className={s.toggleBar} aria-hidden="true" />
      </button>

      <div id="nav-panel" ref={panelRef} className={s.panel} hidden={!open}>
        {c.links.map((l) => (
          <a key={l.href} className={s.panelLink} href={l.href} onClick={() => setOpen(false)}>
            {l.label}
          </a>
        ))}
        <a
          className={s.panelCta}
          href={COPY.booking.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={COPY.booking.a11y}
          onClick={() => setOpen(false)}
        >
          {c.cta}
        </a>
      </div>
    </header>
  )
}
