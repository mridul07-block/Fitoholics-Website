/**
 * The scroll spine (§7.1, §7.2).
 *
 * Owns: the Lenis instance, the single gsap.ticker registration (the ONE
 * persistent rAF loop on the page), the single master ScrollTrigger, and the
 * FilmClock singleton. Created at module scope with an idempotent guard so
 * React 18 StrictMode double-invocation cannot produce two loops.
 *
 * Data flows one way: scroll -> clock -> renderer. React never sees per-frame
 * values; components that need film state read the singleton imperatively.
 */
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { FILM } from './manifest'
import { ACTS, actAtFrame, type Act } from './beats'

gsap.registerPlugin(ScrollTrigger)

export interface FilmClockState {
  /** raw master progress 0..1 straight from the ScrollTrigger */
  raw: number
  /** spring smoothed progress 0..1 */
  smoothed: number
  /** signed velocity in frames/sec (approx) */
  velocity: number
  /** floor(smoothed * (count-1)) */
  index: number
  /** fractional part, quantised to 1/512 — sub frame blend */
  blend: number
  /** current act (derived from index) */
  act: Act
  /** monotonically increasing tick counter */
  tick: number
}

type TickListener = (state: FilmClockState, deltaMs: number) => void

/**
 * Critically damped spring, not a lerp.
 *
 * A lerp chained behind Lenis' own lerp stacks two exponential lags, which is
 * what reads as rubber banding: the film keeps sliding after the wheel stops.
 * A critically damped spring (zeta = 1) has no overshoot and settles in finite
 * perceptual time, so the film tracks the hand and then stops dead.
 *
 * omega is in rad/s. It is deliberately stiff: the input this spring receives
 * has ALREADY been smoothed by Lenis (lerp .105, roughly a 150ms constant), so
 * its job is only to take the quantisation off ScrollTrigger's progress, not to
 * smooth the scroll a second time. A soft spring here simply adds its lag to
 * Lenis' and the film visibly trails the hand. 26 settles in about 135ms, and
 * sub frame blending means a stiff spring cannot reintroduce frame stepping.
 */
const SPRING_OMEGA = 26
const BLEND_QUANTUM = 1 / 512

class FilmClock {
  readonly state: FilmClockState = {
    raw: 0,
    smoothed: 0,
    velocity: 0,
    index: 0,
    blend: 0,
    act: ACTS[0]!,
    tick: 0,
  }

  private listeners = new Set<TickListener>()
  private lastSmoothed = 0
  /** spring velocity, in progress units per second */
  private springVel = 0
  /** dirty flags consumers can poll; renderer resets via consumeDirty() */
  private dirty = true

  onTick(fn: TickListener): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  consumeDirty(): boolean {
    const d = this.dirty
    this.dirty = false
    return d
  }

  markDirty(): void {
    this.dirty = true
  }

  step(deltaMs: number): void {
    const s = this.state
    const dtMs = Math.min(deltaMs, 50)
    const dt = dtMs / 1000

    // Semi implicit Euler on a critically damped spring. Sub stepping keeps it
    // stable when a frame runs long: at omega 26 the explicit stability limit
    // is around a 38ms step, which a single dropped frame already exceeds, so
    // the step count is derived from dt rather than fixed.
    const steps = Math.min(6, Math.max(1, Math.ceil(dt / 0.012)))
    const h = dt / steps
    for (let i = 0; i < steps; i++) {
      const accel = SPRING_OMEGA * SPRING_OMEGA * (s.raw - s.smoothed) - 2 * SPRING_OMEGA * this.springVel
      this.springVel += accel * h
      s.smoothed += this.springVel * h
    }
    if (Math.abs(s.raw - s.smoothed) < 1e-5 && Math.abs(this.springVel) < 1e-4) {
      s.smoothed = s.raw
      this.springVel = 0
    }

    // velocity in frames/sec, derived from smoothed motion
    const framesMoved = (s.smoothed - this.lastSmoothed) * (FILM.count - 1)
    s.velocity = dt > 0 ? framesMoved / dt : 0
    this.lastSmoothed = s.smoothed

    const exact = s.smoothed * (FILM.count - 1)
    const index = Math.floor(exact)
    const blend = Math.round((exact - index) / BLEND_QUANTUM) * BLEND_QUANTUM

    if (index !== s.index || Math.abs(blend - s.blend) >= BLEND_QUANTUM) {
      s.index = index
      s.blend = blend
      s.act = actAtFrame(index)
      this.dirty = true
    }
    s.tick++

    for (const fn of this.listeners) fn(s, deltaMs)
  }
}

interface Spine {
  lenis: Lenis
  clock: FilmClock
  master: ScrollTrigger
  destroy: () => void
}

let spine: Spine | null = null

export const prefersReducedMotion = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
  (import.meta.env.DEV && new URLSearchParams(location.search).get('motion') === 'reduce')

/**
 * Idempotent bootstrap. Safe under StrictMode. Returns the singleton.
 * Under reduced motion Lenis is not created — native scroll drives the
 * master ScrollTrigger directly (§9 law 7).
 */
export function initSpine(): Spine {
  if (spine) return spine

  const reduced = prefersReducedMotion()
  const clock = new FilmClock()

  const lenis = new Lenis({
    // paired with the film spring downstream: Lenis carries the document, the
    // spring carries the film. Two heavy lags in series read as rubber banding,
    // so this stays a touch tighter than the Lenis default.
    lerp: 0.105,
    wheelMultiplier: 1,
    smoothWheel: !reduced,
    syncTouch: false, // native momentum on touch, do not fight it (§10)
    autoRaf: false, // the gsap ticker is the only loop (§7.1)
  })

  lenis.on('scroll', ScrollTrigger.update)

  const master = ScrollTrigger.create({
    trigger: document.documentElement,
    start: 0,
    end: 'max',
    scrub: true,
    refreshPriority: -1,
    invalidateOnRefresh: true,
    onUpdate: (self) => {
      clock.state.raw = self.progress
    },
  })

  const tick = (time: number, deltaMs: number) => {
    lenis.raf(time * 1000)
    clock.step(deltaMs)
  }

  gsap.ticker.add(tick)
  gsap.ticker.lagSmoothing(0)

  if (import.meta.env.DEV) {
    interface DevWindow {
      __filmClock?: FilmClockState
    }
    ;(window as unknown as DevWindow).__filmClock = clock.state
  }

  spine = {
    lenis,
    clock,
    master,
    destroy: () => {
      gsap.ticker.remove(tick)
      master.kill()
      lenis.destroy()
      spine = null
    },
  }
  return spine
}

export function getSpine(): Spine {
  if (!spine) throw new Error('initSpine() has not run')
  return spine
}
