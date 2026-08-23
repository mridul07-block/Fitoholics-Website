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
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
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
  const [open, setOpen] = useState(false)
  // read inside the scroll listener, which is installed once and must not be
  // torn down and rebuilt every time the menu toggles
  const openRef = useRef(false)
  openRef.current = open

  // Hidden before the first paint, resolved by the entrance timeline in
  // motion/choreography.ts. Doing this in CSS instead would leave the bar
  // hidden for anyone on reduced motion, where the choreography never runs.
  useLayoutEffect(() => {
    if (prefersReducedMotion() || !barRef.current) return
    gsap.set(barRef.current, { autoAlpha: 0, y: -14 })
  }, [])

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

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const c = COPY.nav

  return (
    <header ref={barRef} className={clsx(s.bar, open && s.barOpen)} data-nav="">
      <a className={s.brand} href="#top">
        <img className={s.brandMark} src="/brand/mark-sm.webp" alt="" width={34} height={31} decoding="async" />
        <span className={s.brandText}>
          <span className={s.brandName}>{c.brand}</span>
          <span className={s.brandMeta}>{c.brandMeta}</span>
        </span>
      </a>

      <nav className={s.links} aria-label={c.brand}>
        {c.links.map((l) => (
          <a key={l.href} className={s.link} href={l.href}>
            {l.label}
          </a>
        ))}
      </nav>

      <a className={s.cta} href="#booking" data-magnetic="">
        {c.cta}
      </a>

      <button
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

      <div id="nav-panel" className={s.panel} hidden={!open}>
        {c.links.map((l) => (
          <a key={l.href} className={s.panelLink} href={l.href} onClick={() => setOpen(false)}>
            {l.label}
          </a>
        ))}
        <a className={s.panelCta} href="#booking" onClick={() => setOpen(false)}>
          {c.cta}
        </a>
      </div>
    </header>
  )
}
