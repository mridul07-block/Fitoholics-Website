/**
 * Real load progress, published from the film loader to whoever wants it.
 *
 * The preloader is the only consumer today. It exists as its own tiny store
 * rather than a prop because the loader is created inside FilmLayer's effect
 * and the gate lives outside React entirely — its markup is in index.html so
 * that it can paint before the bundle parses.
 *
 * Same shape as `filmEntrance` in choreography.ts: a mutable module object and
 * a listener set, no framework, no re-renders.
 */

interface LoadState {
  /** 0..1 across the blocking batch — the real gate on being able to scroll */
  progress: number
  /** the loader has enough frames decoded to release the page */
  ready: boolean
}

export const loadState: LoadState = { progress: 0, ready: false }

type Listener = (s: LoadState) => void
const listeners = new Set<Listener>()

export function publishLoad(progress: number, ready: boolean): void {
  // monotonic: a progress figure that goes backwards reads as a stall even when
  // the loader is fine, and the blocking batch can re-report as frames land
  loadState.progress = Math.max(loadState.progress, Math.min(1, Math.max(0, progress)))
  loadState.ready = loadState.ready || ready
  for (const fn of listeners) fn(loadState)
}

export function onLoad(fn: Listener): () => void {
  listeners.add(fn)
  fn(loadState)
  return () => listeners.delete(fn)
}
