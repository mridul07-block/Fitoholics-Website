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
import { BEATS, beatAtFrame, type Beat } from './beats'

gsap.registerPlugin(ScrollTrigger)

export interface FilmClockState {
  /** raw master progress 0..1 straight from the ScrollTrigger */
  raw: number
  /** frame-rate normalised smoothed progress 0..1 */
  smoothed: number
  /** signed velocity in frames/sec (approx) */
  velocity: number
  /** floor(smoothed * (count-1)) */
  index: number
  /** fractional part, quantised to 1/512 — sub frame blend */
  blend: number
  /** current beat (derived from index) */
  beat: Beat
  /** monotonically increasing tick counter */
  tick: number
}

type TickListener = (state: FilmClockState, deltaMs: number) => void

const SMOOTH_BASE = 0.14
const BLEND_QUANTUM = 1 / 512

class FilmClock {
  readonly state: FilmClockState = {
    raw: 0,
    smoothed: 0,
    velocity: 0,
    index: 0,
    blend: 0,
    beat: BEATS[0]!,
    tick: 0,
  }

  private listeners = new Set<TickListener>()
  private lastSmoothed = 0
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
    const dt = Math.min(deltaMs, 50)
    // frame-rate normalised lerp: same film weight at 60Hz, 120Hz and under throttle
    const k = 1 - Math.pow(1 - SMOOTH_BASE, dt / 16.6667)
    s.smoothed += (s.raw - s.smoothed) * k
    if (Math.abs(s.raw - s.smoothed) < 1e-5) s.smoothed = s.raw

    // velocity in frames/sec, derived from smoothed motion
    const framesMoved = (s.smoothed - this.lastSmoothed) * (FILM.count - 1)
    s.velocity = dt > 0 ? framesMoved / (dt / 1000) : 0
    this.lastSmoothed = s.smoothed

    const exact = s.smoothed * (FILM.count - 1)
    const index = Math.floor(exact)
    const blend = Math.round((exact - index) / BLEND_QUANTUM) * BLEND_QUANTUM

    if (index !== s.index || Math.abs(blend - s.blend) >= BLEND_QUANTUM) {
      s.index = index
      s.blend = blend
      s.beat = beatAtFrame(index)
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
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

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
    lerp: 0.1,
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
