/**
 * Daylight — the page's passage from night toward morning, as one scalar.
 *
 * The film's acts already warm as the story goes (beats.ts: glow 0.10 at the
 * mirror, 0.56 at the proof), but the ground under the type stayed black from
 * the first screen to the last. This module gives the page a second, slower
 * arc on top of the acts: `daylight` runs 0..1 down the film, and everything
 * that reads as "the ground" follows it.
 *
 * It stays one page throughout. The type is bone at the top and bone at the
 * bottom; what changes is how much light is in the room. The ground lifts from
 * a cold violet black to a warm lit brown, the air the film is seen through
 * brightens with it, and the veils over the plate thin out.
 *
 * The light itself is mostly not this file's doing. The footage ends on the
 * one shot lit by real daylight, and the page had been hiding it behind its
 * heaviest wash (beats.ts, SECTIONS[].wash). Opening that veil is what makes
 * the ending bright; the palette here only has to stop fighting it. An earlier
 * version flipped the whole page to paper with dark type at that cut, which
 * arrived as a different website rather than as a sunrise.
 *
 * Writes are quantised: at most Q palette writes per traversal, rate limited
 * during a flick, and nothing at all while the page is still. Every write
 * invalidates style for the whole document and repaints the fixed atmosphere
 * layer, which is the cost App.module.css measured and refused to pay per
 * frame.
 */
import { ACTS, actIndexAtFrame, rgbHex, type Act } from './beats'
import { FILM } from './manifest'
import { initSpine } from './useMasterProgress'

type Vec3 = [number, number, number]

/** DOM quantum: at most Q + 1 palette writes over the whole page */
const Q = 96
/** min ms between quantum writes during a flick; act changes bypass it */
const MIN_INTERVAL_MS = 64

/* ---------- the curve ----------
   Stops sit on the film's cuts (logical frames, see manifest.ts SHOT_ORDER),
   so the flat point of each smoothstep lands where the flare already owns
   the eye. Light is earned through the method: the protocol (frames 185–239,
   over THE WORK) carries the steepest climb, and the cut into THE PROOF at
   240 is where the room is finally lit. The plate's own brightness dips in
   the middle of the page; the arc is the ground, and it only ever rises. */
type Stop = readonly [frame: number, daylight: number]
const STOPS: readonly Stop[] = [
  [0, 0],
  [55, 0.08],
  [96, 0.16],
  [141, 0.24],
  [185, 0.32],
  [240, 0.66],
  [268, 0.85],
  [FILM.count - 1, 1],
]

/** DEV only: a pinned value so any point of the arc can be screenshotted still */
let pinned: number | null = null
if (import.meta.env.DEV && typeof location !== 'undefined') {
  const p = new URLSearchParams(location.search).get('daylight')
  if (p !== null && Number.isFinite(Number(p))) pinned = Math.min(1, Math.max(0, Number(p)))
}

/**
 * Daylight at a (fractional) film frame. Pure, and evaluated independently by
 * the film tick and the DOM tick from the same `clock.smoothed`: the film
 * subscribes first, so a value shared between them would read one tick stale.
 */
export function daylightAtFrame(f: number): number {
  if (import.meta.env.DEV && pinned !== null) return pinned
  const first = STOPS[0]!
  const last = STOPS[STOPS.length - 1]!
  if (f <= first[0]) return first[1]
  if (f >= last[0]) return last[1]
  for (let i = 1; i < STOPS.length; i++) {
    const [f1, d1] = STOPS[i]!
    if (f <= f1) {
      const [f0, d0] = STOPS[i - 1]!
      const t = (f - f0) / (f1 - f0)
      return d0 + (d1 - d0) * t * t * (3 - 2 * t)
    }
  }
  return last[1]
}

/* ---------- the palette ----------
   Mixed in OKLab: the lift changes hue (violet to warm brown) as well as
   lightness, and an sRGB mix between those dips through desaturated mud in the
   middle. Precomputed into a lookup per quantum, so the hot path does none of
   this arithmetic.

   The bright end is as far as a dark page can go and still be a dark page:
   bone on #5E4C40 is 7.1:1, and the surface a card sits on is 5.7:1.
   There is deliberately no entry for --bone here. The type is the same cream
   at the top of the page and at the bottom; only the room around it changes. */
const VOID = '#08060A'
const GROUND = ['#08060A', '#5E4C40'] as const
const SURFACE = ['#14100E', '#6E5A4C'] as const
const STONE = ['#A79A90', '#D5C9BD'] as const

const hexToRgb = (hex: string): Vec3 => {
  const n = parseInt(hex.slice(1), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}
const srgbToLin = (c: number): number => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const linToSrgb = (c: number): number =>
  Math.min(1, Math.max(0, c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055))

function toOklab([r, g, b]: Vec3): Vec3 {
  const lr = srgbToLin(r)
  const lg = srgbToLin(g)
  const lb = srgbToLin(b)
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}

function fromOklab([L, a, b]: Vec3): Vec3 {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    linToSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    linToSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    linToSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ]
}

function mixOk(pair: readonly [string, string], t: number): Vec3 {
  const a = toOklab(hexToRgb(pair[0]))
  const b = toOklab(hexToRgb(pair[1]))
  return fromOklab([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t])
}

const rgbTriple = (c: Vec3): string => c.map((v) => Math.round(v * 255)).join(', ')

interface Palette {
  void: string
  voidRgb: string
  char: string
  charRgb: string
  stone: string
  /** the ground as 0..1 rgb, for the atmosphere lift */
  ground: Vec3
}

/** one entry per quantum */
const LUT: Palette[] = []
for (let q = 0; q <= Q; q++) {
  const t = q / Q
  const ground = mixOk(GROUND, t)
  const surface = mixOk(SURFACE, t)
  const stone = mixOk(STONE, t)
  LUT.push({
    void: rgbHex(ground),
    voidRgb: rgbTriple(ground),
    char: rgbHex(surface),
    charRgb: rgbTriple(surface),
    stone: rgbHex(stone),
    ground,
  })
}

const VOID_RGB = hexToRgb(VOID)
const quantum = (d: number): number => Math.min(Q, Math.max(0, Math.round(d * Q)))

/** how far the ground has risen from the opening black, per channel */
function lift(daylight: number, i: number): number {
  return Math.max(0, LUT[quantum(daylight)]!.ground[i]! - VOID_RGB[i]!)
}

/* ---------- the film side ----------
   The air the plate is seen through takes about half the ground's rise: the
   film brightens with the page, but keeps the act's own colour rather than
   being washed toward the furniture. Written into scratch arrays, never
   allocated, because Atmosphere.step asks every frame. */
export function filmAir(actIndex: number, daylight: number, outTop: number[], outBottom: number[]): void {
  const act = ACTS[actIndex]!
  for (let i = 0; i < 3; i++) {
    const l = 0.55 * lift(daylight, i)
    outTop[i] = act.atmTop[i]! + l
    outBottom[i] = act.atmBottom[i]! + l
  }
}

/** the ember bloom eases back a little once there is real light to see by */
export function filmGlow(actIndex: number, daylight: number): number {
  return ACTS[actIndex]!.glow * (1 - 0.25 * daylight)
}

/** the duotone lets go, so the daylit footage keeps its own colour */
export function filmGrade(actIndex: number, daylight: number): number {
  return (0.34 + ACTS[actIndex]!.glow * 0.22) * (1 - 0.35 * daylight)
}

/* ---------- the DOM side ---------- */

const atmScratch: Vec3 = [0, 0, 0]

/** the .atmosphere layer's colour: the act's air carrying the full ground rise */
function domAtm(act: Act, daylight: number, bottom: boolean): string {
  const base = bottom ? act.atmBottom : act.atmTop
  for (let i = 0; i < 3; i++) {
    atmScratch[i] = Math.min(1, base[i]! + lift(daylight, i))
  }
  return rgbHex(atmScratch)
}

declare global {
  interface Window {
    /** DEV: where the arc is, and a pin to hold it anywhere */
    __daylight?: {
      readonly state: { q: number; daylight: number; act: number }
      pin: (daylight: number | null) => void
    }
  }
}

let installed = false

/**
 * Subscribe the document to the arc. Idempotent, so StrictMode's double
 * effect cannot install two writers.
 */
export function initDaylight(): void {
  if (installed) return
  installed = true

  const root = document.documentElement
  const st = root.style
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  let lastQ = -1
  let lastAct = -1
  let lastWrite = 0

  const write = (q: number, act: number) => {
    const p = LUT[q]!
    const a = ACTS[act]!
    const d = q / Q
    st.setProperty('--void', p.void)
    st.setProperty('--void-rgb', p.voidRgb)
    st.setProperty('--char', p.char)
    st.setProperty('--char-rgb', p.charRgb)
    st.setProperty('--stone', p.stone)
    // --daylight is read by the scrims, which thin out as the page lights
    st.setProperty('--daylight', d.toFixed(4))
    st.setProperty('--atm-top', domAtm(a, d, false))
    st.setProperty('--atm-bottom', domAtm(a, d, true))
    st.setProperty('--atm-glow', String(filmGlow(act, d)))
    // the browser's own chrome follows the ground on a phone
    if (meta) meta.content = p.void
    lastQ = q
    lastAct = act
    lastWrite = performance.now()
  }

  initSpine().clock.onTick((c) => {
    const d = daylightAtFrame(c.smoothed * (FILM.count - 1))
    const act = actIndexAtFrame(c.index)
    const q = quantum(d)
    // a still page returns here, before touching the DOM
    if (q === lastQ && act === lastAct) return
    // a cut is never deferred; a quantum step during a flick can wait — the
    // ticker never stops, so the next tick past the interval writes
    if (act === lastAct && performance.now() - lastWrite < MIN_INTERVAL_MS) return
    write(q, act)
  })

  if (import.meta.env.DEV) {
    window.__daylight = {
      get state() {
        return { q: lastQ, daylight: lastQ / Q, act: lastAct }
      },
      pin(daylight) {
        pinned = daylight === null ? null : Math.min(1, Math.max(0, daylight))
        lastQ = -1 // force the next tick to write
      },
    }
  }
}
