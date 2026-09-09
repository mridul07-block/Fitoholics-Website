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
  const bar = gate.querySelector<HTMLElement>('.gateBar')
  const num = gate.querySelector<HTMLElement>('.gateNum')
  const readout = gate.querySelector<HTMLElement>('.gateReadout')
  const glow = gate.querySelector<HTMLElement>('.gateGlow')
  const corners = Array.from(gate.querySelectorAll<HTMLElement>('.gateCorner'))
  const shutters = Array.from(gate.querySelectorAll<HTMLElement>('.gateShutter'))
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

  // The readout waits for a figure worth showing. On a slow connection the
  // loader reports nothing until the first frames decode, and a counter parked
  // on 0 for several seconds reads as broken — worse than no counter at all.
  // The figure, the embers and the shine carry that wait instead.
  let readoutShown = false
  const showReadout = () => {
    if (readoutShown || !readout) return
    readoutShown = true
    if (!soft) {
      readout.style.opacity = '1'
      return
    }
    gsap.fromTo(readout, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' })
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
          const v = shown.p
          if (lit) {
            lit.style.opacity = '1'
            lit.style.setProperty('--p', v.toFixed(4))
          }
          if (fill) fill.style.transform = `scaleX(${v.toFixed(4)})`
          // the bloom rides the leading edge of the fill
          if (bar) bar.style.setProperty('--p', v.toFixed(4))
          if (num) num.textContent = String(Math.round(v * 100))
          // The room lights as the film lands: the figure is being lit by
          // something, and this is the something. It starts at a low ember
          // rather than at nothing, so the opening frame is a figure standing
          // in a pool of light instead of a silhouette in a void.
          if (glow) {
            glow.style.opacity = (0.14 + v * 0.76).toFixed(3)
            glow.style.transform = `scale(${(0.72 + v * 0.28).toFixed(3)})`
          }
        },
      })
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
        // one bloom as the figure completes, the light it has been gathering
        .to(glow, { opacity: 1, scale: 1.18, duration: 0.45, ease: 'power2.out' }, '<')
        .to(stage, { scale: 1.05, duration: 0.55, ease: 'power2.out' }, '<')
        .to(corners, { opacity: 0, scale: 1.35, duration: 0.5, ease: 'power2.in', stagger: 0.03 }, '<0.1')
        .to([stage, glow], { opacity: 0, duration: 0.42, ease: 'power2.in' }, '>-0.3')
        // The ground parts rather than fading: two shutters leave through the
        // top and bottom edges and the film is behind them, already running.
        // A cross dissolve would show the film through a grey sheet; this
        // shows it through nothing.
        .to(shutters[0]!, { yPercent: -101, duration: 0.85, ease: 'power3.inOut' }, '>-0.12')
        .to(shutters[1]!, { yPercent: 101, duration: 0.85, ease: 'power3.inOut' }, '<')
    }

    const off = onLoad((s) => {
      if (s.progress > 0.005) showReadout()
      applyProgress(s.progress)
      if (s.ready) {
        off()
        dismiss()
      }
    })
  })
}
