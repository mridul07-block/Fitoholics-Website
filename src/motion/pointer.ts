/**
 * Pointer response, shared by the magnetic calls to action and the card tilt.
 *
 * Both effects are event driven, never per frame: nothing here runs unless a
 * pointer is actually over the element. That matters because this page is
 * scrubbing a film at the same time, and an always-on pointer handler is a
 * per-frame cost paid for an effect nobody is looking at.
 *
 * Everything is written through gsap.quickTo, which caches the setter and
 * writes a single transform. No layout, no paint, compositor only.
 *
 * Both return a disposer, and both refuse to bind at all when the device has no
 * hover or the visitor asked for reduced motion — so a phone pays nothing.
 */
import gsap from 'gsap'

const canHover = (): boolean =>
  window.matchMedia('(hover: hover)').matches &&
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches

type Disposer = () => void

/**
 * The element leans toward the cursor and springs back. Small enough to read as
 * weight rather than as a toy — the audience here is sceptical professionals.
 */
export function bindMagnetic(el: HTMLElement, strength = 0.35): Disposer {
  if (!canHover()) return () => {}
  const quickX = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3.out' })
  const quickY = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3.out' })

  const move = (e: PointerEvent) => {
    const r = el.getBoundingClientRect()
    quickX((e.clientX - (r.left + r.width / 2)) * strength)
    quickY((e.clientY - (r.top + r.height / 2)) * strength)
  }
  const leave = () => {
    quickX(0)
    quickY(0)
  }

  el.addEventListener('pointermove', move)
  el.addEventListener('pointerleave', leave)
  return () => {
    el.removeEventListener('pointermove', move)
    el.removeEventListener('pointerleave', leave)
    leave()
  }
}

/**
 * The surface tips toward the cursor, as though it were a physical card resting
 * under the pointer.
 *
 * The lift is applied here rather than left to the CSS `:hover` rule, because
 * GSAP writes an inline transform and an inline transform always beats the
 * stylesheet — the CSS lift would simply be discarded the moment the pointer
 * arrived. Doing both in one place keeps them from fighting.
 */
export function bindTilt(el: HTMLElement, maxDeg = 4, lift = 3): Disposer {
  if (!canHover()) return () => {}
  const opts = { duration: 0.5, ease: 'power3.out' }
  const rx = gsap.quickTo(el, 'rotationX', opts)
  const ry = gsap.quickTo(el, 'rotationY', opts)
  const ty = gsap.quickTo(el, 'y', opts)

  const move = (e: PointerEvent) => {
    const r = el.getBoundingClientRect()
    if (!r.width || !r.height) return
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    ry(px * maxDeg * 2)
    rx(-py * maxDeg * 2)
    ty(-lift)
  }
  const leave = () => {
    rx(0)
    ry(0)
    ty(0)
  }

  el.addEventListener('pointermove', move)
  el.addEventListener('pointerleave', leave)
  return () => {
    el.removeEventListener('pointermove', move)
    el.removeEventListener('pointerleave', leave)
    leave()
  }
}
