/**
 * FrameLoader (§7.3, with the audited amendments).
 *
 * Priority buckets, drained strictly in order:
 *   P0  frame 0 only — first paint
 *   P1  blocking batch, byte budgeted (~250 KB), scroll locked while it loads
 *   P2  jump override: a 16 frame window centred on a target the user reached
 *   P3  remainder ascending, batches of 12, concurrency 6
 *
 * Memory: decoded ImageBitmaps live in a byte budgeted cache evicted by
 * distance from the playhead (never pinned frames). readyMask is the hot-path
 * truth: renderers consult it and NEVER receive an unloaded frame.
 */
import { FILM, framePath, type TierSpec } from './manifest'
import FrameWorker from './FrameLoader.worker?worker'

const enum SlotState {
  Empty = 0,
  Queued = 1,
  InFlight = 2,
  Decoded = 3,
}

export interface LoaderPhase {
  stage: 'idle' | 'first' | 'blocking' | 'streaming' | 'complete'
  firstReady: boolean
  blockingProgress: number
  decodedBytes: number
  loadedCount: number
}

export interface FrameSource {
  get(index: number): ImageBitmap | null
  isReady(index: number): boolean
  note(index: number, velocity: number): void
}

const CONCURRENCY = 8
const P3_BATCH = 12
const BLOCKING_BUDGET_BYTES = 250 * 1024
const JUMP_WINDOW_BEFORE = 6
const JUMP_WINDOW_AFTER = 16
const JUMP_DELTA = 8
/** resident window maintained around the playhead, in frames */
const LOOKAHEAD_BASE = 14
const LOOKBEHIND = 5

export class FrameLoader implements FrameSource {
  private tier: TierSpec
  private slotState: Uint8Array
  private bitmaps: (ImageBitmap | null)[]
  private readyMask: Uint8Array
  private loadedEver: Uint8Array
  private worker: Worker | null = null
  private inflight = 0
  private p0: number[] = []
  private p1: number[] = []
  private p2: number[] = []
  private p3: number[] = []
  private decodedBytes = 0
  private budgetBytes: number
  private currentIndex = 0
  private lastNotedIndex = 0
  /** last known travel direction, +1 forward */
  private direction: 1 | -1 = 1
  private pinned = new Set<number>()
  private phase: LoaderPhase = {
    stage: 'idle',
    firstReady: false,
    blockingProgress: 0,
    decodedBytes: 0,
    loadedCount: 0,
  }
  private phaseListeners = new Set<(p: LoaderPhase) => void>()
  private blockingSet = new Set<number>()
  private blockingLoaded = 0
  private readyResolve: (() => void) | null = null
  private readyPromise: Promise<void>
  private bytesPerFrame: number
  private subsetMode = false
  private completeTarget: number = FILM.count

  constructor(tier: TierSpec, budgetBytes: number) {
    this.tier = tier
    this.budgetBytes = budgetBytes
    this.bytesPerFrame = tier.width * tier.height * 4
    this.slotState = new Uint8Array(FILM.count)
    this.readyMask = new Uint8Array(FILM.count)
    this.loadedEver = new Uint8Array(FILM.count)
    this.bitmaps = new Array<ImageBitmap | null>(FILM.count).fill(null)
    this.readyPromise = new Promise((res) => {
      this.readyResolve = res
    })
  }

  // ---------- FrameSource (hot path, no allocation) ----------

  get(index: number): ImageBitmap | null {
    if (index < 0 || index >= FILM.count || this.readyMask[index] === 0) return null
    return this.bitmaps[index] ?? null
  }

  isReady(index: number): boolean {
    return index >= 0 && index < FILM.count && this.readyMask[index] === 1
  }

  note(index: number, velocity: number): void {
    this.currentIndex = index
    if (velocity !== 0) this.direction = velocity > 0 ? 1 : -1
    if (this.subsetMode) return
    const jumped =
      Math.abs(index - this.lastNotedIndex) > JUMP_DELTA ||
      (!this.isReady(index) && !this.isReady(index + 1) && this.slotState[index] !== SlotState.InFlight)
    this.lastNotedIndex = index
    if (jumped) {
      this.requestWindow(index)
      return
    }
    // Maintain a lookahead window so evicted frames re-decode before the
    // playhead reaches them (evictions do not requeue themselves). The window
    // is asymmetric in the direction of travel and widens with speed, so a fast
    // scroll fetches further ahead instead of chasing the playhead.
    const speed = Math.min(Math.abs(velocity), 90)
    // never ask for more than the cache can actually hold, or the window fights
    // the evictor and every frame is fetched twice
    const maxWindow = Math.max(6, Math.floor(this.budgetBytes / this.bytesPerFrame) - LOOKBEHIND - 4)
    const ahead = Math.min(Math.round(LOOKAHEAD_BASE + speed * 0.28), maxWindow)
    const behind = LOOKBEHIND
    const lo = this.direction > 0 ? index - behind : index - ahead
    const hi = this.direction > 0 ? index + ahead : index + behind
    let queued = false
    for (let i = Math.max(0, lo); i <= Math.min(FILM.count - 1, hi); i++) {
      if (this.readyMask[i] === 0 && this.slotState[i] === SlotState.Queued) {
        this.p2.push(i)
        queued = true
      }
    }
    if (queued) this.pump()
  }

  // ---------- lifecycle ----------

  /**
   * With no argument: full sequential load. With a subset (reduced motion,
   * §9 law 7): only those frames are fetched — nine hero keyframes instead
   * of the whole film — and the jump machinery stays quiet.
   */
  start(subset?: readonly number[]): void {
    this.worker = new FrameWorker()
    this.worker.onmessage = (e: MessageEvent) => this.onWorkerMessage(e.data)
    this.setPhase({ stage: 'first' })

    if (subset && subset.length) {
      this.subsetMode = true
      this.completeTarget = subset.length
      this.p0.push(subset[0]!)
      for (let i = 1; i < subset.length; i++) {
        this.p1.push(subset[i]!)
        this.blockingSet.add(subset[i]!)
      }
      this.pump()
      return
    }

    this.p0.push(0)
    // blocking batch: byte budgeted from index 1 ascending (§7.3 amendment)
    const blockingCount = Math.max(
      3,
      Math.min(24, Math.ceil(BLOCKING_BUDGET_BYTES / this.tier.avgBytes)),
    )
    for (let i = 1; i <= blockingCount && i < FILM.count; i++) {
      this.p1.push(i)
      this.blockingSet.add(i)
    }
    // remainder ascending in P3 (batches are just ordering; concurrency caps flow)
    for (let i = blockingCount + 1; i < FILM.count; i += P3_BATCH) {
      for (let j = i; j < Math.min(i + P3_BATCH, FILM.count); j++) this.p3.push(j)
    }
    this.pump()
  }

  /** resolves when the blocking batch lands — the caller adds the 3.5s hard release */
  ready(): Promise<void> {
    return this.readyPromise
  }

  onPhase(fn: (p: LoaderPhase) => void): () => void {
    this.phaseListeners.add(fn)
    fn(this.phase)
    return () => this.phaseListeners.delete(fn)
  }

  requestWindow(target: number): void {
    this.p2.length = 0
    const from = Math.max(0, target - JUMP_WINDOW_BEFORE)
    const to = Math.min(FILM.count - 1, target + JUMP_WINDOW_AFTER)
    for (let i = target; i <= to; i++) this.p2.push(i)
    for (let i = target - 1; i >= from; i--) this.p2.push(i)
    this.pump()
  }

  pin(indices: readonly number[]): void {
    this.pinned.clear()
    for (const i of indices) this.pinned.add(i)
  }

  purge(keepRadius: number): void {
    for (let i = 0; i < FILM.count; i++) {
      if (Math.abs(i - this.currentIndex) > keepRadius) this.evict(i)
    }
  }

  dispose(): void {
    this.worker?.terminate()
    this.worker = null
    for (let i = 0; i < FILM.count; i++) this.evict(i)
  }

  // ---------- internals ----------

  private setPhase(patch: Partial<LoaderPhase>): void {
    Object.assign(this.phase, patch)
    this.phase.decodedBytes = this.decodedBytes
    for (const fn of this.phaseListeners) fn(this.phase)
  }

  private nextIndex(): number | undefined {
    for (const bucket of [this.p0, this.p1, this.p2, this.p3]) {
      while (bucket.length) {
        const i = bucket.shift()!
        if (this.slotState[i] === SlotState.Empty || this.slotState[i] === SlotState.Queued) return i
      }
    }
    return undefined
  }

  private pump(): void {
    if (!this.worker) return
    while (this.inflight < CONCURRENCY) {
      const i = this.nextIndex()
      if (i === undefined) break
      this.slotState[i] = SlotState.InFlight
      this.inflight++
      this.worker.postMessage({ type: 'fetch', index: i, url: framePath(this.tier, i) })
    }
  }

  private onWorkerMessage(
    msg:
      | { type: 'done'; index: number; bitmap: ImageBitmap; bytes: number }
      | { type: 'fail'; index: number; error: string },
  ): void {
    this.inflight--
    if (msg.type === 'fail') {
      // transient network failure: requeue once at the back of P3
      this.slotState[msg.index] = SlotState.Queued
      this.p3.push(msg.index)
      if (import.meta.env.DEV) console.warn(`frame ${msg.index} failed: ${msg.error}`)
      this.pump()
      return
    }

    this.bitmaps[msg.index] = msg.bitmap
    this.slotState[msg.index] = SlotState.Decoded
    this.readyMask[msg.index] = 1
    this.decodedBytes += this.bytesPerFrame
    if (this.loadedEver[msg.index] === 0) {
      this.loadedEver[msg.index] = 1
      this.phase.loadedCount++
    }
    this.evictOverBudget()

    if (msg.index === 0 && !this.phase.firstReady) {
      this.setPhase({ firstReady: true, stage: 'blocking' })
    }
    if (this.blockingSet.has(msg.index)) {
      this.blockingLoaded++
      this.setPhase({ blockingProgress: this.blockingLoaded / this.blockingSet.size })
      if (this.blockingLoaded >= this.blockingSet.size) {
        this.setPhase({ stage: 'streaming' })
        this.readyResolve?.()
      }
    }
    if (this.phase.loadedCount >= this.completeTarget) {
      this.setPhase({ stage: 'complete' })
    } else {
      this.setPhase({})
    }
    this.pump()
  }

  private evict(i: number): void {
    const b = this.bitmaps[i]
    if (!b) return
    if (this.pinned.has(i)) return
    if (Math.abs(i - this.currentIndex) <= 2) return
    b.close()
    this.bitmaps[i] = null
    this.readyMask[i] = 0
    this.slotState[i] = SlotState.Queued // re-fetchable on approach; HTTP cache makes it cheap
    this.decodedBytes -= this.bytesPerFrame
  }

  private evictOverBudget(): void {
    if (this.decodedBytes <= this.budgetBytes) return
    // Evict what the playhead is moving away from. Plain distance would throw
    // away frames just ahead of a fast scroll as readily as ones already passed.
    let victim = -1
    let worst = -1
    for (let i = 0; i < FILM.count; i++) {
      if (this.readyMask[i] === 0 || this.pinned.has(i)) continue
      const signed = (i - this.currentIndex) * this.direction
      const cost = signed < 0 ? -signed * 2.2 : signed
      if (cost > worst) {
        worst = cost
        victim = i
      }
    }
    if (victim >= 0 && Math.abs(victim - this.currentIndex) > 2) this.evict(victim)
  }
}

/**
 * Byte budget per tier (§7.3 amendment: bytes, not frame counts).
 * Sized so the resident window can always cover the lookahead, otherwise the
 * evictor and the prefetcher chase each other and every frame decodes twice.
 */
export function budgetForTier(tier: TierSpec): number {
  const frameBytes = tier.width * tier.height * 4
  if (tier.id === 'sm') return 44 * frameBytes // ~72 MB
  if (tier.id === 'lg') return 40 * frameBytes // ~147 MB
  // xl: holding all 300 decoded would be 2.5 GB; 30 frames ≈ 249 MB
  return 30 * frameBytes
}
