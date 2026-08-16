/**
 * Canvas 2D film renderer (§7.4) — the fallback, ship quality on its own.
 *
 * Sub frame blending: draw frame A, then frame B at globalAlpha = blend.
 * Grade: CSS filter on the canvas element (compositor side, free).
 * Vignette: prebaked radial gradient sprite, multiply.
 * Grain: four prebaked noise tiles cycled by index, overlay at low alpha.
 * Wash: ink fillRect at (1 - uWash) opacity.
 * Never per pixel JS, never getImageData. Holds the last frame when the
 * playhead reaches undecoded footage — a held frame reads as a pause,
 * a blank flash reads as broken.
 */
import type { FrameSource } from './FrameLoader'

const DPR_CAP = 1.5
const GRAIN_TILES = 4
const GRAIN_SIZE = 256

export type Rgb = readonly [number, number, number]

export interface FilmRenderState {
  index: number
  blend: number
  velocity: number
  wash: number
  /** act atmosphere, crossfaded by the clock; 0..1 rgb */
  atmTop: Rgb
  atmBottom: Rgb
  /** ember bloom strength for the act, 0..1 */
  glow: number
  /** how far the plate is pulled toward the ramp, 0..1 */
  grade: number
  /** 0..1 impulse fired on a hard cut in the footage */
  cut: number
}

export const css = (c: Rgb, a = 1): string =>
  `rgba(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)},${a})`

export class Canvas2DRenderer {
  readonly kind = 'canvas2d' as const
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private source: FrameSource
  private vignette: HTMLCanvasElement | null = null
  private grains: HTMLCanvasElement[] = []
  private lastDrawnIndex = -1
  private lastBlend = -1
  private lastWash = -1
  private lastCut = 0
  private drawCount = 0
  /** cached atmosphere gradient, rebuilt only when the act colours move */
  private atmGrad: CanvasGradient | null = null
  private atmKey = ''

  constructor(host: HTMLElement, source: FrameSource) {
    this.source = source
    this.canvas = document.createElement('canvas')
    this.canvas.style.position = 'absolute'
    this.canvas.style.inset = '0'
    this.canvas.style.width = '100%'
    this.canvas.style.height = '100%'
    // grade toward the ramp, compositor side (§7.4). sepia carries the plate
    // into the warm end, the hue rotation lands it on ember rather than tan.
    this.canvas.style.filter = 'sepia(0.26) hue-rotate(-14deg) saturate(1.22) contrast(1.06) brightness(0.98)'
    const ctx = this.canvas.getContext('2d', { alpha: false })
    if (!ctx) throw new Error('2d context unavailable')
    this.ctx = ctx
    this.ctx.imageSmoothingQuality = 'low'
    host.appendChild(this.canvas)
    this.resize()
    this.bakeGrain()
  }

  resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP)
    const w = Math.round(this.canvas.clientWidth * dpr)
    const h = Math.round(this.canvas.clientHeight * dpr)
    if (w === this.canvas.width && h === this.canvas.height) return
    this.canvas.width = w
    this.canvas.height = h
    this.bakeVignette(w, h)
    this.lastDrawnIndex = -1 // force redraw at new size
  }

  /** true = painted; false = held the previous frame */
  render(s: FilmRenderState): boolean {
    const unchanged =
      s.index === this.lastDrawnIndex &&
      Math.abs(s.blend - this.lastBlend) < 1 / 512 &&
      Math.abs(s.wash - this.lastWash) < 1e-3 &&
      Math.abs(s.cut - this.lastCut) < 1e-3
    if (unchanged) return false

    const a = this.source.get(s.index)
    if (!a) {
      // hold: do not clear, do not draw
      return false
    }
    const b = s.blend > 1 / 512 ? this.source.get(s.index + 1) : null

    const { width: cw, height: ch } = this.canvas
    const ctx = this.ctx

    this.drawCover(a, cw, ch)
    if (b) {
      ctx.globalAlpha = s.blend
      this.drawCover(b, cw, ch)
      ctx.globalAlpha = 1
    }

    // vignette, multiply
    if (this.vignette) {
      ctx.globalCompositeOperation = 'multiply'
      ctx.drawImage(this.vignette, 0, 0)
      ctx.globalCompositeOperation = 'source-over'
    }

    // grain, overlay at low alpha, tile cycled by index
    const grain = this.grains[s.index & (GRAIN_TILES - 1)]
    if (grain) {
      ctx.globalCompositeOperation = 'overlay'
      ctx.globalAlpha = 0.05
      for (let y = 0; y < ch; y += GRAIN_SIZE) {
        for (let x = 0; x < cw; x += GRAIN_SIZE) {
          ctx.drawImage(grain, x, y)
        }
      }
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
    }

    // atmosphere: the act's gradient added over the plate, so the film and the
    // page share one colour field (the shader does the same with uAtmTop/Bottom)
    const key = `${s.atmTop.join()}|${s.atmBottom.join()}|${ch}`
    if (key !== this.atmKey) {
      const g = ctx.createLinearGradient(0, 0, 0, ch)
      g.addColorStop(0, css(s.atmTop))
      g.addColorStop(1, css(s.atmBottom))
      this.atmGrad = g
      this.atmKey = key
    }
    ctx.globalCompositeOperation = 'lighter'
    ctx.fillStyle = this.atmGrad!
    ctx.fillRect(0, 0, cw, ch)

    // ember bloom off the lower edge, strongest in the late acts
    if (s.glow > 0.01) {
      const bg = ctx.createLinearGradient(0, ch, 0, ch * 0.1)
      bg.addColorStop(0, `rgba(255,94,26,${(s.glow * 0.16).toFixed(3)})`)
      bg.addColorStop(1, 'rgba(255,94,26,0)')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, cw, ch)
    }
    ctx.globalCompositeOperation = 'source-over'

    // wash toward the act ground, never to a neutral black
    if (s.wash < 1) {
      ctx.globalAlpha = 1 - s.wash
      ctx.fillStyle = css(s.atmBottom)
      ctx.fillRect(0, 0, cw, ch)
      ctx.globalAlpha = 1
    }

    // cut flare: a fast wipe of light when the footage hard cuts
    if (s.cut > 0.001) {
      const x = (1 - s.cut) * cw * 1.2 + cw * 0.05
      const fg = ctx.createLinearGradient(x - cw * 0.24, 0, x + cw * 0.24, 0)
      fg.addColorStop(0, 'rgba(255,162,58,0)')
      fg.addColorStop(0.5, `rgba(255,162,58,${(s.cut * 0.3).toFixed(3)})`)
      fg.addColorStop(1, 'rgba(255,162,58,0)')
      ctx.globalCompositeOperation = 'lighter'
      ctx.fillStyle = fg
      ctx.fillRect(0, 0, cw, ch)
      ctx.globalCompositeOperation = 'source-over'
    }

    this.lastDrawnIndex = s.index
    this.lastBlend = s.blend
    this.lastWash = s.wash
    this.lastCut = s.cut
    this.drawCount++
    return true
  }

  get draws(): number {
    return this.drawCount
  }

  get lastIndex(): number {
    return this.lastDrawnIndex
  }

  dispose(): void {
    this.canvas.remove()
  }

  private drawCover(bmp: ImageBitmap, cw: number, ch: number): void {
    const scale = Math.max(cw / bmp.width, ch / bmp.height)
    const w = bmp.width * scale
    const h = bmp.height * scale
    this.ctx.drawImage(bmp, (cw - w) / 2, (ch - h) / 2, w, h)
  }

  private bakeVignette(w: number, h: number): void {
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    const ctx = c.getContext('2d')!
    const r = Math.hypot(w, h) / 2
    const g = ctx.createRadialGradient(w / 2, h / 2, r * 0.42, w / 2, h / 2, r)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(1, 'rgba(150,146,143,1)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
    this.vignette = c
  }

  private bakeGrain(): void {
    for (let t = 0; t < GRAIN_TILES; t++) {
      const c = document.createElement('canvas')
      c.width = GRAIN_SIZE
      c.height = GRAIN_SIZE
      const ctx = c.getContext('2d')!
      const img = ctx.createImageData(GRAIN_SIZE, GRAIN_SIZE)
      const d = img.data
      for (let i = 0; i < d.length; i += 4) {
        const v = 96 + ((Math.random() * 64) | 0)
        d[i] = v
        d[i + 1] = v
        d[i + 2] = v
        d[i + 3] = 255
      }
      ctx.putImageData(img, 0, 0)
      this.grains.push(c)
    }
  }
}
