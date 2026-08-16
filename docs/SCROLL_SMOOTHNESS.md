# Scroll smoothness: what was actually wrong

Measured, not guessed. The instrument is `window.__scrubTrace(ms)` (dev only,
`src/dev/scrubTrace.ts`), driven by synthesised `wheel` events so the input goes
through Lenis the way a real user's does — `window.scrollTo` bypasses Lenis and
hides the behaviour being tested.

## Why average FPS was the wrong number to chase

Average FPS says almost nothing about a scrubbed film. 60 fps with one 90 ms
hitch per second reads as broken; 45 fps with perfectly even pacing reads as
smooth. So the harness reports the **distribution** of frame intervals
(p50/p95/p99/max), the count of frames over twice the median, and three
failure modes that are invisible to an FPS counter:

| Metric | What it means when it is not zero |
|---|---|
| `stalls` | the playhead reached a frame that is not decoded — the film freezes |
| `blendMisses` | the NEXT frame is absent, so sub frame blend is forced to 0 and continuous motion becomes visible frame **stepping** |
| `uploads` / `avgUploadMs` | GPU texture upload cost per frame |

Stepping is what people describe as "not smooth" long before anything actually
freezes, which is why it gets its own counter.

## Finding 1: the film engine was never the problem

Across every profile tested, including a full traverse of all 300 frames at
aggressive wheel speed:

```
stalls: 0    blendMisses: 0    draws ≈ frames    idx 0 → 299
```

The loader, the priority buckets, the direction aware prefetch and the sub
frame blend were all doing their job perfectly. No frame was ever missing when
the playhead arrived, and blending never fell back to a hard cut. Tuning the
loader further would have bought nothing.

## Finding 2: the cost was DOM effects, not the film

The dominant cost was `filter: blur()` animated on the travelling panels and
`backdrop-filter: blur()` on the testimonial cards. Both are compositor work,
so they were taxing the WebGL path exactly as hard as the Canvas 2D one.

Paired A/B, both from a cold load, same session, only that variable changed:

| | blur removed (shipped) | blur present |
|---|---|---|
| p50 frame interval | **27.4 ms** | 40.3 ms |
| p95 | **36.1 ms** | 70.2 ms |
| p99 | **41.6 ms** | 88.0 ms |
| worst frame | **54 ms** | 91 ms |
| janky frames | **0 (0%)** | 5 (2.9%) |

And the run that started this, with the blur *animated* rather than static, was
worse still at p50 58.7 ms / p95 84 ms. Animating a blur re-rasterises the
whole panel on every frame while the film is also being drawn.

The blur was removed. Depth is still carried by the perspective translate, the
rotation and opacity, and the film behind has its own defocus in the shader.

Text shadow was the smaller second cost: a 44px blur radius on every piece of
type over the film measured about 2 ms at p50 but 7 ms at p95 — it lived in the
tail, which is exactly where jank is felt. Reduced to two stops with a 16px
maximum radius; the wide diffuse darkening it was providing is the scrim's job.

## Finding 3: two smoothing stages in series

Lenis smooths the document scroll (lerp .105, roughly a 150 ms constant), then
the film applied its own spring on top. Two exponential lags in series is what
reads as the film trailing the hand. The spring's real job is only to take the
quantisation off ScrollTrigger's progress, not to smooth the scroll a second
time, so it is now deliberately stiff — omega 26, settling in about 135 ms
instead of 250 ms. Sub frame blending means a stiff spring cannot reintroduce
stepping, so this is latency removed for free.

The integrator sub steps based on dt, because at omega 26 the explicit
stability limit is around a 38 ms step and a single dropped frame exceeds that.

## Finding 4: the strict WebGL probe was dropping capable machines

`failIfMajorPerformanceCaveat: true` also rejects perfectly capable integrated
GPUs on some drivers, and any browser in a power saving mode. Every rejection
silently demoted the visitor to the Canvas 2D path, which costs far more than a
caveated GPU context does. The probe now tries the strict context first, falls
back to a permissive one, and rejects only when the driver actually names
itself as a software rasteriser (SwiftShader, llvmpipe, Microsoft Basic
Render). This is likely the single largest real world win: it decides whether a
given visitor gets the fragment shader or the fallback at all.

## Finding 5: the fallback was doing constant work every frame

Canvas 2D was compositing a full canvas vignette multiply and one blended blit
per 256 px noise tile, every frame, to produce output that never changed. Both
moved to a single static CSS overlay the compositor paints once. The 2D path
now does two `drawImage` calls and a couple of gradient fills.

Also removed: `transition: background 900ms` on the full viewport atmosphere
layer. `background` is not a compositable property, so each act change repainted
that layer for 900 ms. The change is instant now and lands inside the cut flare
that fires at the same moment, which is where a cut belongs anyway.

## Two bugs the work surfaced

- **Panels overlapped.** With the default `top bottom` → `bottom top` trigger, a
  panel is partly visible for its own height *plus a full viewport*, so two and
  sometimes three headlines were on screen at once, each half faded. The travel
  window is now measured at the viewport midline, making its length the
  section's own height, so adjacent windows abut instead of overlapping.
- **Reveals could silently never fire.** Reveal triggers were anchored to the
  elements being revealed, which live inside panels being moved through a
  perspective context — so ScrollTrigger was caching start positions from a
  moving `getBoundingClientRect`. With a panel parked at `translateZ(-620)` the
  cached start could sit at a scroll position the element never reaches, and
  the copy stayed hidden inside its line mask. Triggers now resolve to the
  enclosing section, which is never transformed.

## Caveat on the absolute numbers

Every figure above comes from a headless browser with no GPU, so the renderer
is the software Canvas 2D path and absolute frame times are far worse than any
real machine. The **paired comparisons are valid** — same environment, one
variable changed, minutes apart — but do not read 27 ms p50 as a prediction of
what a visitor sees. On a real GPU the fragment shader draws the whole treatment
in one fullscreen pass.

Absolute numbers also drift between sessions with machine load; three runs of
identical code measured p50 at 27.4, 47.5 and 79.9 ms depending on what else
was running. This is why only paired, same session comparisons are quoted.

## Verified at the end

- 0 stalls, 0 blend misses across a full 300 frame traverse, both at trackpad
  cadence and at aggressive wheel speed
- exactly 1 persistent rAF loop
- ~1 draw per painted frame, 0 draws at rest
- CLS 0, axe 0 violations
- bundle 120.74 KB gz
