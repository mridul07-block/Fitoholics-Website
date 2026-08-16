/**
 * Raw WebGL2 film renderer (§7.5, amended: no three/R3F — decision 5).
 * One program, one fullscreen triangle, a ring of K pre-allocated textures.
 * At most one texture upload per render call, prefetched ahead of the
 * playhead, skipped when the frame budget is already spent.
 */
import vertSrc from './film.vert.glsl?raw'
import fragSrc from './film.frag.glsl?raw'
import { FILM, type TierSpec } from './manifest'
import type { FrameSource } from './FrameLoader'
import type { FilmRenderState } from './Canvas2DRenderer'

const UPLOAD_BUDGET_MS = 6

export interface WebGLRenderStateExtras {
  soften: number
  time: number
}

export class WebGLFilmRenderer {
  readonly kind = 'webgl' as const
  private canvas: HTMLCanvasElement
  private gl: WebGL2RenderingContext
  private program: WebGLProgram
  private source: FrameSource
  private ringSize: number
  private ringTex: WebGLTexture[] = []
  private ringFrame: Int32Array
  private frameToSlot: Int32Array
  private ringCursor = 0
  private uniforms: Record<string, WebGLUniformLocation | null> = {}
  private lastState = { index: -1, blend: -1, wash: -1, soften: -1, velocity: 0 }
  private drawCount = 0
  private lastDrawnIndex = -1
  private contextLost = false
  onContextLost: (() => void) | null = null

  constructor(
    host: HTMLElement,
    source: FrameSource,
    tier: TierSpec,
    quality: 'high' | 'low',
    allowSoftware = false, // dev-only escape hatch for headless shader verification
  ) {
    this.source = source
    this.ringSize = quality === 'low' ? 4 : 6
    this.ringFrame = new Int32Array(this.ringSize).fill(-1)
    this.frameToSlot = new Int32Array(FILM.count).fill(-1)

    this.canvas = document.createElement('canvas')
    this.canvas.style.position = 'absolute'
    this.canvas.style.inset = '0'
    this.canvas.style.width = '100%'
    this.canvas.style.height = '100%'

    const gl = this.canvas.getContext('webgl2', {
      alpha: false,
      depth: false,
      stencil: false,
      antialias: false,
      powerPreference: 'high-performance',
      failIfMajorPerformanceCaveat: !allowSoftware,
    })
    if (!gl) throw new Error('webgl2 unavailable or software rendered')
    this.gl = gl

    const dbg = gl.getExtension('WEBGL_debug_renderer_info')
    if (dbg && !allowSoftware) {
      const renderer = String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL))
      if (/SwiftShader|llvmpipe|Software/i.test(renderer)) {
        throw new Error(`software renderer: ${renderer}`)
      }
    }
    if (gl.getParameter(gl.MAX_TEXTURE_SIZE) < tier.width) {
      throw new Error('MAX_TEXTURE_SIZE below tier width')
    }

    this.canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault()
      this.contextLost = true
      this.onContextLost?.()
    })

    const defines = quality === 'low' ? '#define LOW_QUALITY\n' : ''
    this.program = this.compile(defines)
    gl.useProgram(this.program)
    for (const name of [
      'uFrame', 'uFrameNext', 'uBlend', 'uVelocity', 'uWash', 'uSoften',
      'uResolution', 'uTexSize', 'uTime',
    ]) {
      this.uniforms[name] = gl.getUniformLocation(this.program, name)
    }
    gl.uniform1i(this.u('uFrame'), 0)
    gl.uniform1i(this.u('uFrameNext'), 1)
    gl.uniform2f(this.u('uTexSize'), tier.width, tier.height)

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE)

    // pre-warm: allocate the whole ring at tier size once (no mid-scroll realloc)
    for (let i = 0; i < this.ringSize; i++) {
      const tex = gl.createTexture()!
      gl.bindTexture(gl.TEXTURE_2D, tex)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, tier.width, tier.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      this.ringTex.push(tex)
    }

    host.appendChild(this.canvas)
    this.resize()
  }

  resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = Math.round(this.canvas.clientWidth * dpr)
    const h = Math.round(this.canvas.clientHeight * dpr)
    if (w === this.canvas.width && h === this.canvas.height) return
    this.canvas.width = w
    this.canvas.height = h
    this.gl.viewport(0, 0, w, h)
    this.gl.useProgram(this.program)
    this.gl.uniform2f(this.u('uResolution'), w, h)
    this.lastState.index = -1
  }

  /** true = painted, false = held. At most one texture upload per call. */
  render(s: FilmRenderState & WebGLRenderStateExtras): boolean {
    if (this.contextLost) return false
    const gl = this.gl
    const t0 = performance.now()

    // opportunistic prefetch upload (velocity-predictive), budget guarded
    this.uploadNeeded(s.index, s.velocity, t0)

    let slotA = this.frameToSlot[s.index] ?? -1
    if (slotA < 0) {
      const bmp = this.source.get(s.index)
      if (bmp) {
        slotA = this.upload(s.index, bmp) // bypasses budget: alternative is a visible stall
      } else {
        return false // hold last frame (§7.3)
      }
    }

    let blend = s.blend
    let slotB = this.frameToSlot[s.index + 1] ?? -1
    if (slotB < 0) {
      // next frame not resident: draw current sharp (fast scroll policy)
      slotB = slotA
      blend = 0
    }

    const ls = this.lastState
    const changed =
      s.index !== ls.index ||
      Math.abs(blend - ls.blend) >= 1 / 512 ||
      Math.abs(s.wash - ls.wash) >= 1e-3 ||
      Math.abs(s.soften - ls.soften) >= 1e-3 ||
      Math.abs(s.velocity - ls.velocity) >= 0.15
    if (!changed) return false

    gl.useProgram(this.program)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.ringTex[slotA]!)
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, this.ringTex[slotB]!)
    gl.uniform1f(this.u('uBlend'), blend)
    gl.uniform1f(this.u('uVelocity'), Math.max(-1, Math.min(1, s.velocity / 30)))
    gl.uniform1f(this.u('uWash'), s.wash)
    gl.uniform1f(this.u('uSoften'), s.soften)
    gl.uniform1f(this.u('uTime'), s.time)
    gl.drawArrays(gl.TRIANGLES, 0, 3)

    ls.index = s.index
    ls.blend = blend
    ls.wash = s.wash
    ls.soften = s.soften
    ls.velocity = s.velocity
    this.lastDrawnIndex = s.index
    this.drawCount++
    return true
  }

  get draws(): number {
    return this.drawCount
  }

  get lastIndex(): number {
    return this.lastDrawnIndex
  }

  /** frames currently resident on the GPU — the loader must not evict these */
  residentFrames(out: number[]): void {
    out.length = 0
    for (let i = 0; i < this.ringSize; i++) {
      const f = this.ringFrame[i]!
      if (f >= 0) out.push(f)
    }
  }

  dispose(): void {
    for (const t of this.ringTex) this.gl.deleteTexture(t)
    this.canvas.remove()
  }

  // ---------- internals ----------

  private u(name: string): WebGLUniformLocation | null {
    return this.uniforms[name] ?? null
  }

  private uploadNeeded(index: number, velocity: number, t0: number): void {
    if (performance.now() - t0 > UPLOAD_BUDGET_MS) return
    const dir = velocity >= 0 ? 1 : -1
    // want-list in priority order (§ texture ring design)
    for (const want of [index, index + 1, index + dir * 2, index + dir * 3, index - dir]) {
      if (want < 0 || want >= FILM.count) continue
      if ((this.frameToSlot[want] ?? -1) >= 0) continue
      const bmp = this.source.get(want)
      if (!bmp) continue
      this.upload(want, bmp)
      return // one per call
    }
  }

  private upload(index: number, bmp: ImageBitmap): number {
    const gl = this.gl
    // pick the slot holding the frame farthest from the playhead
    let slot = -1
    let worst = -1
    for (let i = 0; i < this.ringSize; i++) {
      const f = this.ringFrame[i]!
      if (f < 0) {
        slot = i
        break
      }
      const d = Math.abs(f - index)
      if (d > worst) {
        worst = d
        slot = i
      }
    }
    if (slot < 0) slot = this.ringCursor++ % this.ringSize
    const old = this.ringFrame[slot]!
    if (old >= 0) this.frameToSlot[old] = -1

    gl.activeTexture(gl.TEXTURE2) // scratch unit; avoids disturbing bound draw units
    gl.bindTexture(gl.TEXTURE_2D, this.ringTex[slot]!)
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, bmp)
    this.ringFrame[slot] = index
    this.frameToSlot[index] = slot
    return slot
  }

  private compile(defines: string): WebGLProgram {
    const gl = this.gl
    const inject = (src: string) => src.replace('#version 300 es\n', '#version 300 es\n' + defines)
    const make = (type: number, src: string) => {
      const sh = gl.createShader(type)!
      gl.shaderSource(sh, src)
      gl.compileShader(sh)
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        throw new Error(`shader compile: ${gl.getShaderInfoLog(sh) ?? 'unknown'}`)
      }
      return sh
    }
    const prog = gl.createProgram()!
    gl.attachShader(prog, make(gl.VERTEX_SHADER, vertSrc))
    gl.attachShader(prog, make(gl.FRAGMENT_SHADER, inject(fragSrc)))
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      throw new Error(`program link: ${gl.getProgramInfoLog(prog) ?? 'unknown'}`)
    }
    return prog
  }
}
