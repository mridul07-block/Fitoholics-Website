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

---

# Addendum: the plate went soft whenever the page moved

The work above made the scroll itself even. It did not make the film look
sharp, and those are different complaints. What was reported next was that the
picture turned blurry during scrolling, which is worth separating from frame
rate: the film was being blurred deliberately, by the renderer, on purpose, at
full strength, all the time.

## The velocity uniform saturated at walking pace

Four effects in the fragment shader scale off scroll speed: the depth parallax,
the chromatic dispersion, the barrel warp and the depth of field. All four
received the same input:

```ts
gl.uniform1f(this.u('uVelocity'), Math.max(-1, Math.min(1, s.velocity / 30)))
```

`s.velocity` is measured in frames of footage per second. The page runs about
28 px of scroll per frame at every breakpoint, so that divisor of 30 puts full
strength at **855 px/s**. Measured against real hand speeds:

| scroll speed | film velocity | old uniform |
|---|---|---|
| 200 px/s, reading | 7 f/s | 0.23 |
| 400 px/s | 14 f/s | 0.47 |
| 800 px/s, steady scroll | 28 f/s | 0.93 |
| 1500 px/s, moving with purpose | 53 f/s | **1.00** |
| 4000 px/s, a real flick | 140 f/s | **1.00** |

Everything from an ordinary continuous scroll upward was pinned at maximum.
The effects were written as flourishes for fast motion and were in practice a
permanent treatment applied to the whole film.

## What full strength was doing

**The parallax was tearing the plate, not shifting it.** The displacement was
keyed off per pixel luminance:

```glsl
float depth = smoothstep(0.0, 1.0, luma(base)) * (1.0 - length(vUv - 0.5));
vec2 pOff = vec2(uVelocity * 0.018 * (1.0 - depth), 0.0);
```

Luminance is a high frequency field. Neighbouring pixels of different
brightness were pushed by different amounts, up to 0.018 uv apart, which is
**35 px at 1920**. The frame did not lean, it sheared, and the shearing is what
read as the image going out of focus.

**The depth of field was mitigating a problem that no longer exists.** The
`soften` term was written as ghosting mitigation for a sequence decimated two
to one to an effective 15 fps, where consecutive frames genuinely double
imaged. The current encode keeps every source frame (`no decimation`, per the
encoder report). What survived was a blur that reached full strength at 18
frames/sec, about 510 px/s, and in the `ghostRisk: 2` act produced a **14 px
six tap Poisson blur** for the entire length of the section.

**And some of it never switched off at all.** The gate was

```glsl
float blurAmt = (0.0015 + uSoften * 0.0055) * (0.35 + upper);
if (blurAmt > 0.0016) { ... }
```

With the page standing still and `uSoften` at zero, the constant term alone
reaches 0.002 wherever `upper` is high, clearing the gate on its own. The top
third of the plate carried a permanent four pixel blur at rest.

## Evidence

Screenshots at a pinned frame index, so the only variable is the velocity
uniform. `?vel=<frames per second>` is a DEV flag that holds the uniform while
the page stands still, which is the only way to photograph a scroll artifact.

- frame 172, `ghostRisk: 2`, at rest: window mullions, beard and dumbbell all
  legible
- same frame at `vel=60`, an ordinary 1700 px/s scroll: faces lose all
  modelling, background is mush
- frame 270, `ghostRisk: 0`, so no depth of field at all, at `vel=60`: still
  smeared with visible doubling and colour fringing, which is what isolated the
  parallax as a separate cause rather than a contributor to the blur

## The fix

`src/film/velocity.ts` replaces the divisor with a dead zone and a realistic
full scale, smoothstepped between:

```
DEAD = 26 f/s   (about 740 px/s)  -> exactly zero below this
FULL = 150 f/s  (about 4300 px/s) -> full strength only at a genuine flick
```

At reading speed the effects are not weak, they are **off**. At 1500 px/s the
strength is 0.03. Full strength now requires a real flick, where softness reads
as speed rather than as a lens fault.

Alongside that:

- the parallax field is radial and smooth instead of luminance keyed, and the
  coefficient drops from 0.018 to 0.006, so the frame leans as one piece and
  cannot shear detail apart
- the depth of field is entirely motion gated, `uSoften * 0.0026 * (0.45 + upper)`,
  so it is zero at rest and the six taps are not sampled at all
- `soften` no longer doubles with `ghostRisk`; the act modulates it as a nudge
  (0.6 / 0.8 / 1.0) rather than a multiplier
- one texture sample pair is removed outright, since `base` existed only to
  feed the luminance depth proxy
- the WebGL redraw gate compares the normalised uniform, not raw velocity, so a
  change in hand speed that cannot alter a pixel no longer forces a draw

## Verified

- frame 172 at `vel=60` is now indistinguishable from the same frame at rest
- frame 172 at `vel=150`, a genuine flick, softens gently and stays readable
- frame 270 at `vel=60` matches its at rest capture; the fringing is gone
- the mobile `LOW_QUALITY` program, which has no depth of field, is sharp at
  flick speed
- build green, bundle 122.61 KB gz against the 210 KB gate

Frame rate was not the cause and no frame rate claim is made here: paired
software raster traces were too noisy between runs to quote a delta honestly.
The shader does strictly less work than before — two fewer texture fetches on
every pixel always, and the six tap loop skipped entirely at reading speed
instead of running across the top third permanently and full screen through
three of the six acts.
