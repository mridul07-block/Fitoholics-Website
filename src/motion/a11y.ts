/**
 * Keyboard and anchor navigation with Lenis active (§12, Phase 8).
 *
 * Smooth scroll libraries break two things by default: in-page anchor jumps
 * and the browser's scroll-focused-element-into-view. Both are restored here.
 * Under reduced motion Lenis runs unsmoothed, so native behaviour is fine
 * and the focus assist simply jumps without animation.
 */
import { getSpine, prefersReducedMotion } from '../film/useMasterProgress'

let installed = false

export function initA11yNav(): void {
  if (installed) return
  installed = true
  const reduced = prefersReducedMotion()

  // track input modality: only keyboard-driven focus should move the page
  let keyboardNav = false
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') keyboardNav = true
  })
  window.addEventListener('mousedown', () => {
    keyboardNav = false
  })
  window.addEventListener('touchstart', () => {
    keyboardNav = false
  }, { passive: true })

  // in-page anchors ride Lenis instead of teleporting against it
  document.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]')
    if (!a) return
    const target = document.querySelector<HTMLElement>(a.hash)
    if (!target) return
    e.preventDefault()
    getSpine().lenis.scrollTo(target, {
      offset: 0,
      duration: reduced ? 0 : 1.1,
      easing: (t: number) => 1 - Math.pow(1 - t, 3), // power3.out
    })
    // keep focus semantics: move focus to the target region
    target.setAttribute('tabindex', '-1')
    target.focus({ preventScroll: true })
  })

  // focused elements must scroll into view with Lenis active (§12)
  document.addEventListener('focusin', (e) => {
    if (!keyboardNav) return
    const el = e.target as HTMLElement
    if (!el || el === document.body) return
    const r = el.getBoundingClientRect()
    const comfortable = r.top >= 80 && r.bottom <= window.innerHeight - 80
    if (comfortable) return
    getSpine().lenis.scrollTo(el, {
      offset: -Math.round(window.innerHeight * 0.35),
      duration: reduced ? 0 : 0.6,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
    })
  })
}
