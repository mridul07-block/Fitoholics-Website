/**
 * The gate — driving and dismissing the preloader.
 *
 * The markup and the first paint live in index.html; this only takes over once
 * the bundle is running. Everything it animates is transform, opacity or a
 * mask position on a handful of elements, and it removes itself from the DOM
 * when it is done, so nothing here survives into the scrolling page.
 *
 * Two rules it will not break:
 *
 *   1. The progress is real. It comes from the film loader's decoded byte
 *      count, not from a timer. A preloader that invents its own progress is
 *      lying about the one thing it exists to report, and users can tell —
 *      fake bars are the reason nobody trusts them.
 *
 *   2. It never becomes the slowest part of the page. There is a floor so it
 *      cannot flash on a warm cache, and no ceiling of its own: it leaves the
 *      moment the film says it is ready. A gate that holds a ready page back to
 *      finish its own animation is an advert for itself, not a loader.
 */
import gsap from 'gsap'
import { onLoad } from '../film/loadProgress'

/** below this the gate would flash rather than read as a moment */
const MIN_VISIBLE_MS = 700

const reduced = (): boolean => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function initGate(): Promise<void> {
  const gate = document.getElementById('gate')
  if (!gate) return Promise.resolve()

  // hand control over from the CSS failsafe
  gate.setAttribute('data-js', '')

  const lit = gate.querySelector<HTMLElement>('.gateLit')
  const fill = gate.querySelector<HTMLElement>('.gateFill')
  const tag = gate.querySelector<HTMLElement>('.gateTag')
  const corners = Array.from(gate.querySelectorAll<HTMLElement>('.gateCorner'))
  const stage = gate.querySelector<HTMLElement>('.gateStage')
  const t0 = performance.now()
  const soft = !reduced()

  // the instrument frame draws itself in while the first bytes arrive
  if (soft && corners.length) {
    gsap.fromTo(
      corners,
      { opacity: 0, scale: 0.6 },
      { opacity: 1, scale: 1, duration: 0.7, ease: 'power2.out', stagger: 0.06, delay: 0.1 },
    )
  }

  return new Promise<void>((resolve) => {
    let done = false

    // Progress is eased rather than written raw. The loader reports in bursts
    // as batches of frames land, and a bar that jumps in steps reads as broken
    // even when it is perfectly honest — the easing carries the same numbers at
    // a speed the eye accepts.
    const shown = { p: 0 }
    const applyProgress = (p: number) => {
      gsap.to(shown, {
        p,
        duration: soft ? 0.55 : 0,
        ease: 'power2.out',
        overwrite: true,
        onUpdate: () => {
          if (lit) {
            lit.style.opacity = '1'
            lit.style.setProperty('--p', shown.p.toFixed(4))
          }
          if (fill) fill.style.transform = `scaleX(${shown.p.toFixed(4)})`
        },
      })
      if (tag && p > 0.45 && soft) {
        gsap.to(tag, { opacity: 1, duration: 0.8, ease: 'power2.out', overwrite: 'auto' })
      }
    }

    const dismiss = () => {
      if (done) return
      done = true
      const wait = Math.max(0, MIN_VISIBLE_MS - (performance.now() - t0))

      if (!soft) {
        window.setTimeout(() => {
          gate.remove()
          resolve()
        }, wait)
        return
      }

      gsap
        .timeline({
          delay: wait / 1000,
          onComplete: () => {
            // out of the DOM entirely: a full viewport fixed layer left behind
            // is a compositing cost for the rest of the session
            gate.remove()
            resolve()
          },
        })
        // the figure finishes lighting, then takes one breath before it goes
        .to(shown, {
          p: 1,
          duration: 0.32,
          ease: 'power2.inOut',
          onUpdate: () => {
            if (lit) lit.style.setProperty('--p', shown.p.toFixed(4))
            if (fill) fill.style.transform = `scaleX(${shown.p.toFixed(4)})`
          },
        })
        .to(stage, { scale: 1.04, duration: 0.5, ease: 'power2.out' }, '<')
        .to(corners, { opacity: 0, scale: 1.35, duration: 0.5, ease: 'power2.in', stagger: 0.03 }, '<0.1')
        .to([stage], { opacity: 0, duration: 0.45, ease: 'power2.in' }, '>-0.28')
        // the ground lifts away rather than fading, so the film is revealed
        // rather than cross dissolved into
        .to(gate, { yPercent: -100, duration: 0.75, ease: 'power3.inOut' }, '>-0.15')
    }

    const off = onLoad((s) => {
      applyProgress(s.progress)
      if (s.ready) {
        off()
        dismiss()
      }
    })
  })
}
