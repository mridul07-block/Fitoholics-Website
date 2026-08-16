/**
 * The travelling atmosphere.
 *
 * Each act owns a gradient. The film is rendered through it and the DOM scrims
 * are tinted by it, so the page and the footage are never two different colour
 * worlds. The gradient snaps to the new act on a hard cut and then settles over
 * about a third of a second: the colour cuts when the camera cuts, which is the
 * whole idea, but it lands softly enough not to strobe.
 *
 * Zero allocation on the hot path — one mutable state object, updated in place.
 */
import { ACTS, actIndexAtFrame, rgbHex } from './beats'
import type { Rgb } from './Canvas2DRenderer'

export interface AtmosphereState {
  top: [number, number, number]
  bottom: [number, number, number]
  glow: number
  grade: number
  /** 0..1 impulse, 1 at the instant of a cut, decaying to 0 */
  cut: number
  actIndex: number
}

/** seconds for the colour field to settle after a cut */
const SETTLE = 0.34
/** seconds for the cut flare to decay */
const FLARE = 0.5

export class Atmosphere {
  readonly state: AtmosphereState = {
    top: [...ACTS[0]!.atmTop] as [number, number, number],
    bottom: [...ACTS[0]!.atmBottom] as [number, number, number],
    glow: ACTS[0]!.glow,
    grade: 0.34,
    cut: 0,
    actIndex: 0,
  }

  private onActChange: ((actIndex: number) => void) | null = null

  constructor(onActChange?: (actIndex: number) => void) {
    this.onActChange = onActChange ?? null
  }

  /** advance toward the act at `frame`. deltaMs is the tick delta. */
  step(frame: number, deltaMs: number): void {
    const s = this.state
    const next = actIndexAtFrame(frame)
    if (next !== s.actIndex) {
      s.actIndex = next
      s.cut = 1
      this.onActChange?.(next)
    }

    const act = ACTS[s.actIndex]!
    const dt = Math.min(deltaMs, 50) / 1000
    const k = 1 - Math.exp(-dt / SETTLE)
    for (let i = 0; i < 3; i++) {
      s.top[i] = s.top[i]! + (act.atmTop[i]! - s.top[i]!) * k
      s.bottom[i] = s.bottom[i]! + (act.atmBottom[i]! - s.bottom[i]!) * k
    }
    s.glow += (act.glow - s.glow) * k
    // the plate is pulled further into the ramp as the story warms
    const gradeTarget = 0.34 + act.glow * 0.22
    s.grade += (gradeTarget - s.grade) * k

    if (s.cut > 0) {
      s.cut -= dt / FLARE
      if (s.cut < 0) s.cut = 0
    }
  }

  get top(): Rgb {
    return this.state.top
  }

  get bottom(): Rgb {
    return this.state.bottom
  }
}

/**
 * Push the act colours to the document so CSS scrims, rails and glows follow
 * the same field. Called on act change only, never per frame.
 */
export function publishAct(actIndex: number): void {
  const act = ACTS[actIndex]
  if (!act) return
  const root = document.documentElement
  root.style.setProperty('--atm-top', rgbHex(act.atmTop))
  root.style.setProperty('--atm-bottom', rgbHex(act.atmBottom))
  root.style.setProperty('--atm-glow', String(act.glow))
  root.dataset.act = act.id
  // choreography listens for this to fire the cut rule; a DOM event keeps the
  // film engine from having to know anything about the motion layer
  window.dispatchEvent(new CustomEvent('film:act', { detail: { actIndex } }))
}
