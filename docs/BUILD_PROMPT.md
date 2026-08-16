# CLAUDE CODE BUILD PROMPT

Ikram Ansari · Scroll Scrubbed Film Landing Page
Version 2 · Frames already present in project

> NOTE (2026-08-16): transcribed to disk from the client's message, which was truncated by the
> transport at the 50,000 character limit partway through "Phase 8 · Accessibility and fallbacks".
> Everything above that point is verbatim. The remaining phase descriptions (rest of Phase 8, and
> Phases 9+ covering the performance pass and final report) are reconstructed in the approved plan
> at .claude/plans/claude-code-build-prompt-buzzing-starfish.md, which also records all audited
> deviations. If the client supplies the full original file, replace this one with it.

## THE BRIEF

You are the design and engineering lead on a production landing page for a real paying client. It
ships to a real domain and will be judged by senior professionals who have already been disappointed
by fitness marketing. Nothing here is a prototype.

Read docs/BRAND_BRIEF.md in full before writing code. That file governs voice, positioning and
claims. This file governs structure, tokens, motion, code and process. Where they disagree, the
brief wins on what to say, this file wins on how to build it.

Execute in phases. One commit per phase. Never skip a verification gate.

## 1 · SUBJECT, AUDIENCE, JOB

Subject. Ikram Ansari. Transformation coach, entrepreneur and educator. Ten plus years coaching
busy, high performing professionals through sustainable fat loss, behavioural change and lifestyle
redesign. His method is called The Total Transformation Protocol. He is not a bootcamp trainer, not
a diet seller, not a motivational hype figure.

Audience. Working professionals, entrepreneurs and corporate employees, men and women, roughly 25
to 45. They are time poor, information saturated and have failed at this before. They are sceptical
of transformation marketing specifically because they have bought it once already.

The single job of this page. Move that sceptic from cold attention to a booked consultation, using
one continuous scroll driven film that makes a sustainable transformation feel achievable rather
than sold.

The emotional contract. Nobody arriving on this page should feel judged, rushed or shamed. There is
no urgency device, no countdown, no scarcity, no fear language, no before and after body morph
animation, no implication that their current body is a failure. Credibility is the only persuasion
mechanism on this page.

## 2 · WHAT WE ARE BUILDING

The whole page sits on one continuous, scroll scrubbed film rendered to a fixed full viewport
canvas that never unmounts. Scroll position maps directly to frame index across roughly 700vh of
travel. Scrolling does not play a video. Scrolling is the film.

Content sections layer above the film inside a real CSS perspective context. Panels travel along
the Z axis toward and past the camera. Depth is genuine, not fake parallax.

### 2.1 · Layer model

```
z-index 0    L0  FILM       fixed canvas, full viewport, WebGL or Canvas2D
z-index 10   L1  ATMOSPHERE fixed DOM, scrims, edge gradients, grain fallback
z-index 20   L2  CONTENT    scrolling DOM inside perspective stage
z-index 40   L3  CHROME     fixed header, frame counter, skip link
```

### 2.2 · The one inviolable rule

No element on L2 may have an opaque, full bleed background. If a station needs contrast, it earns
it with a scrim on L1 tuned per station, never by covering the film. The film must be visible in
some strength from the first pixel to the last. A section that covers the film breaks the central
idea of the page.

### 2.3 · The signature element

A fixed film timeline in the top right of the viewport. Utility type. It shows the live frame
index, the total, and the name of the current narrative beat.

```
FRAME 047 / 180
THE ASSESSMENT
```

It updates every drawn frame. It makes the mechanism visible, tells the visitor this is one
continuous piece rather than a scroll trap, and borrows the vocabulary of a film timeline, which is
the exact register the brand brief asks for. This is the thing the page will be remembered by.
Everything else stays quiet so it lands.

Hidden below 768px and under reduced motion.

## 3 · THE FRAME ASSETS

Frames already exist in the project. Do not extract, do not re encode, do not move them unless a
check below fails.

### 3.1 · Discovery step, run this first

Report back: the exact path, the naming pattern, zero padding width, extension, total count, total
size on disk, and the pixel dimensions of frame one. Do not guess any of these.

AUDITED 2026-08-16: `video frames/ezgif-frame-%03d.jpg`, indices 001–299 contiguous, 2560x1440,
26.46 MB total, avg 92.8 KB/frame. JPEG. AI generated (Google Veo); "Veo" watermark bottom right on
every frame. Client approved: crop ~6% off bottom+right, decimate 299→150, WebP at 3 tiers.

### 3.2 · Manifest contract

Write src/film/manifest.ts as the single source of truth. Nothing else in the codebase may hardcode
a path, a count or a padding width.

### 3.3 · Asset audit, mandatory before Phase 3

| Check | Pass condition | Audit result 2026-08-16 |
|---|---|---|
| Count | 90 to 240 frames | 299 → decimated to 150, approved |
| Format | AVIF or WebP | JPEG → WebP re-encode approved |
| Mean size per frame | under 60 KB | 92.8 KB → post-encode ~40 KB (1920 tier) |
| Total sequence weight | under 10 MB | 26.46 MB → ~6 MB desktop / ~1.8 MB mobile |
| Dimensions | consistent | 2560x1440 throughout, PASS |
| Watermark | none visible | "Veo" bottom right, every frame → removed by crop |
| Third party branding | none legible | "fitoholix Fitness & Nutrition" signage: CLIENT'S OWN BRAND, no mitigation. Under Armour chest logo ~f060–f175, Nike swoosh f165: noted, accepted by client. |

### 3.4 · Responsive tiers

Select once on mount and never change on resize. Tier by viewport width, deviceMemory,
connection.effectiveType (mobile: <768 or ≤4 GB or 2g; tablet: <1280 or ≤6 GB or 3g; else desktop).

### 3.5 · Narrative beat map

AUDITED against the full 150-frame contact sheet (2026-08-16): all nine spec beats exist,
including B5 THE TOOLS (initial sparse sampling missed it). Corrected map in 150-frame space
(source odd frames 1–299); fine tune boundaries ±2 frames visually in Phase 6:

| # | Beat | 150-space frames | On screen |
|---|---|---|---|
| B1 | THE MIRROR | 0–13 | Couple facing bedroom mirror, city window |
| B2 | THE THRESHOLD | 14–25 | Bags in hand, walking to the fitoholix entrance (25 is a source cut frame) |
| B3 | THE WELCOME | 26–33 | Coach greets them at reception, handshake |
| B4 | THE ASSESSMENT | 34–59 | Seated at round table, coach with tablet plan |
| B5 | THE TOOLS | 60–64 | Tight dumbbell rack, hand reaching in, shallow focus |
| B6 | THE WORK | 65–86 | Coach demonstrating and correcting form, dumbbell drills |
| B7 | THE TABLE | 87–106 | Golden hour kitchen, plating a real meal, eating together (87 is a cross dissolve) |
| B8 | THE RHYTHM | 107–125 | Lacing shoes, park run at dawn, then training, visibly leaner |
| B9 | THE PROOF | 126–149 | Transformed, confident, celebrating with the coach |

Encode as src/film/beats.ts and drive the timeline label from it.

Anchoring law. Station copy must land on the beat that supports it. The protocol sits on B4 to B6.
Nutrition sits on B7. The close sits on B9. Never let a headline about education play over a shot
of someone flexing. Verify visually with screenshots at every station boundary in Phase 6.

## 4 · DESIGN SYSTEM

The client identity is already locked from prior work on this brand. Use it exactly. Do not
reinterpret, do not add, do not soften.

### 4.1 · Complete token file

Write this verbatim as src/styles/tokens.css.

```css
:root {
  /* ---------- COLOUR ---------- */
  --ink:   #100E0D;   /* warm near black, the dominant field */
  --bone:  #F0EBE3;   /* warm bone, primary type on ink */
  --ember: #D2521C;   /* deep ember, the only accent */
  --stone: #8C8177;   /* muted stone, secondary type, rules, meta */
  --ash:   #1C1917;   /* one step off ink, card surfaces only */

  --ink-rgb: 16, 14, 13;
  --bone-rgb: 240, 235, 227;
  --ember-rgb: 210, 82, 28;

  /* ---------- SCRIMS, L1 ONLY ---------- */
  --scrim-soft: linear-gradient(
    180deg,
    rgba(var(--ink-rgb), 0) 0%,
    rgba(var(--ink-rgb), .42) 38%,
    rgba(var(--ink-rgb), .42) 62%,
    rgba(var(--ink-rgb), 0) 100%
  );
  --scrim-heavy: radial-gradient(
    130% 85% at 50% 50%,
    rgba(var(--ink-rgb), .90) 0%,
    rgba(var(--ink-rgb), .66) 52%,
    rgba(var(--ink-rgb), .28) 100%
  );
  --scrim-left: linear-gradient(
    90deg,
    rgba(var(--ink-rgb), .92) 0%,
    rgba(var(--ink-rgb), .74) 38%,
    rgba(var(--ink-rgb), .10) 72%,
    rgba(var(--ink-rgb), 0) 100%
  );
  --scrim-right: linear-gradient(
    270deg,
    rgba(var(--ink-rgb), .92) 0%,
    rgba(var(--ink-rgb), .74) 38%,
    rgba(var(--ink-rgb), .10) 72%,
    rgba(var(--ink-rgb), 0) 100%
  );
  --scrim-edge: linear-gradient(
    180deg,
    rgba(var(--ink-rgb), .94) 0%,
    rgba(var(--ink-rgb), 0) 20%,
    rgba(var(--ink-rgb), 0) 80%,
    rgba(var(--ink-rgb), .94) 100%
  );

  /* ---------- TYPE ---------- */
  --font-display: 'Bodoni Moda', 'Bodoni MT', Didot, Georgia, serif;
  --font-body: 'Archivo', ui-sans-serif, system-ui, -apple-system, sans-serif;

  --t-hero:  clamp(3.4rem, 9.5vw, 11rem);
  --t-h1:    clamp(2.6rem, 5.6vw, 5.6rem);
  --t-h2:    clamp(1.9rem, 3.2vw, 3rem);
  --t-h3:    clamp(1.35rem, 2vw, 1.75rem);
  --t-lead:  clamp(1.15rem, 1.5vw, 1.5rem);
  --t-body:  clamp(1rem, 1.05vw, 1.125rem);
  --t-small: .9375rem;
  --t-meta:  .75rem;

  --lh-hero: .92;
  --lh-h1:   1.02;
  --lh-h2:   1.12;
  --lh-body: 1.68;
  --lh-lead: 1.55;

  --tr-hero: -.032em;
  --tr-h1:   -.024em;
  --tr-meta: .14em;

  /* ---------- SPACE, 4px base ---------- */
  --s-1: .25rem;  --s-2: .5rem;   --s-3: .75rem;  --s-4: 1rem;
  --s-5: 1.5rem;  --s-6: 2rem;    --s-7: 3rem;    --s-8: 4rem;
  --s-9: 6rem;    --s-10: 8rem;   --s-11: 12rem;

  /* ---------- LAYOUT ---------- */
  --page-margin: clamp(1.25rem, 5vw, 6rem);
  --content-max: 1240px;
  --measure: 62ch;
  --grid-gutter: 1.5rem;

  /* ---------- MOTION ---------- */
  --e-out: cubic-bezier(.22, 1, .36, 1);
  --e-in-out: cubic-bezier(.65, 0, .35, 1);
  --d-hover: 180ms;
  --d-reveal: 780ms;

  /* ---------- Z ---------- */
  --z-film: 0;  --z-atmos: 10;  --z-content: 20;  --z-chrome: 40;
}
```

Five colours. No sixth. No gradient between accent colours anywhere. Ember appears on the page
fewer than eight times total and is never a large fill except on the single primary action in
Station 8.

### 4.2 · Fonts

Self host as woff2 in public/fonts. No Google Fonts CDN link.

- Bodoni Moda variable, weights 400 to 700, latin subset, font-display: swap
- Archivo variable, weights 400 to 700, latin subset, font-display: swap

Preload only the two files. Set size-adjust fallback metrics so there is no layout shift on swap.
Verify CLS is 0 in Phase 2.

### 4.3 · Type rules

- Display face for hero, station headlines, pull quotes and protocol numerals only. Never for body,
  never for UI labels.
- Utility type is Archivo 500, uppercase, letter-spacing: var(--tr-meta), colour stone. Used for
  eyebrows, the frame counter, station indices and list labels.
- Body measure never exceeds --measure. Display headlines never exceed 14 words.
- Every text block on L2 gets this and nothing heavier:
  `text-shadow: 0 1px 40px rgba(var(--ink-rgb), .92), 0 1px 3px rgba(var(--ink-rgb), .7);`
  Never a solid box, never a blurred backdrop filter.

### 4.4 · Layout system

12 columns, --grid-gutter, max --content-max, page margin --page-margin.

Stations rotate through three anchor positions:

- CENTRE · content centred, --scrim-heavy, for the three biggest statements
- LEFT · content in columns 1 to 5, --scrim-left, film readable on the right, for explanation
- RIGHT · content in columns 8 to 12, --scrim-right, film readable on the left, for proof and lists

Order across the page: CENTRE, LEFT, RIGHT, CENTRE, LEFT, RIGHT, LEFT, CENTRE.

Below 900px all stations collapse to a single centred column and the scrim becomes --scrim-heavy
universally.

## 5 · THE COMPLETE COPY DECK

Every string on the page is below. Use it verbatim. Do not paraphrase, do not shorten, do not add.
Where a value is in square brackets, keep the brackets so the human can spot it.

No em dashes, no en dashes, no hyphens in prose anywhere in the UI. This is a firm client
preference. Grep for them before you report done.

### Station 1 · Entrance

```
EYEBROW:  TRANSFORMATION COACH · TEN PLUS YEARS

HERO:     Don't just lose weight.
          Become the kind of person
          who never needs to start over.

LEAD:     A decade of coaching busy professionals through transformations
          that hold, long after the coaching ends.

CTA_1:    Book a consultation
CTA_2:    See the method

SCROLL:   SCROLL
```

### Station 2 · The problem

```
INDEX:    01
EYEBROW:  WHY IT KEEPS FAILING

H1:       Most people do not fail
          because they lack willpower.

BODY_1:   They fail because nobody taught them how their body, their habits
          and their environment actually work together.

BODY_2:   Quick fixes, copy paste diet plans and fear based marketing can
          produce short term results. They almost never produce lasting change.

LIST_LABEL: WHAT THIS USUALLY LOOKS LIKE

LIST:
  Repeated failed attempts with restrictive diets
  No time for complicated prep or two hour sessions
  Conflicting fitness information online
  Intimidation around gyms as a beginner
  Losing weight, then regaining it
  Low energy and poor sleep from a demanding career
```

### Station 3 · The positioning

```
INDEX:    02
EYEBROW:  THE POSITION

QUOTE:    For busy professionals tired of failed diets and unsustainable
          routines, Ikram Ansari builds lifelong habits, not temporary fixes,
          because he treats every client as a unique case, not a template.

STAT_1:   10+          Years coaching
STAT_2:   [CLIENT COUNT]  Transformations
STAT_3:   0            Fad diets, ever

FOOT:     Calm authority in a loud market. No shortcuts promised, none needed.
```

### Station 4 · The Total Transformation Protocol

```
INDEX:    03
EYEBROW:  THE METHOD
H1:       The Total Transformation Protocol
LEAD:     Eight steps. Each one builds on the last, so no plan is ever
          built on an assumption.

01  Deep Assessment
    A full life audit before any plan exists. Weight, body composition,
    measurements, medical history and injuries, blood work where available,
    occupation, daily schedule, sleep quality, stress, food preferences, gym
    experience, diet history, goals and motivation.

02  Goal Mapping
    Turning ambition into realistic, trackable milestones. A weight target,
    muscle gain, better blood markers, more energy, more confidence, or
    simply habits that finally stick.

03  Personalized Nutrition
    A plan built around calories, protein, lifestyle, food preferences,
    budget, travel, eating habits and family routine, with no unnecessary
    restriction.

04  Customized Training
    A program shaped by experience level, available equipment, injuries,
    time and recovery capacity, with progressive overload planned
    deliberately over months.

05  Habit Building
    Systematic focus on the daily behaviours that compound. Hydration,
    sleep, daily movement, step count, stress reduction, meal timing and
    routine.

06  Weekly Accountability
    Structured check ins on weight, measurements, photos, strength, energy,
    hunger and adherence, with the plan adjusted continuously against real
    progress.

07  Education Throughout
    Ongoing teaching on nutrition fundamentals, reading labels, eating out
    intelligently, managing cravings, navigating travel and social events,
    and long term maintenance.

08  Lifestyle Transformation
    The real measure of success. Clients who are not just lighter, but
    healthier, stronger, more confident, more disciplined and more
    consistent for life.
```

### Station 5 · The table

```
INDEX:    04
EYEBROW:  NUTRITION

H1:       No food is off the table.
          Some of it is just on a different day.

BODY:     Every plan is built around a real life, not an ideal one. Work
          schedules, travel, family meals, budget and taste all go into it
          before a single number does. Understanding, not restriction, is
          what makes a plan survive a bad week.

MYTHS_LABEL: WHAT WE ARE UNLEARNING

MYTH_1_STRIKE:  Extreme diets are the fastest path to lasting results
MYTH_1_TRUTH:   Sustainable habits beat aggressive timelines every time

MYTH_2_STRIKE:  More restriction always means more progress
MYTH_2_TRUTH:   Restriction you cannot maintain is progress you will reverse

MYTH_3_STRIKE:  Fitness needs hours you do not have
MYTH_3_TRUTH:   A plan that fits a real calendar is the only one that works

MYTH_4_STRIKE:  One meal plan and one workout split works for everybody
MYTH_4_TRUTH:   Every body, schedule and goal is different, so the plan is too
```

### Station 6 · Who this is for

```
INDEX:    05
EYEBROW:  THE FIT

H1:       Built for people whose
          calendars do not negotiate.

BODY:     Working professionals, entrepreneurs and corporate employees,
          generally between 25 and 45, who are done with quick fixes and
          ready for something built around a demanding real life.

ASPIRATIONS_LABEL: WHAT YOU ACTUALLY WANT

  A transformation that finally lasts
  More energy, confidence and control
  A plan that fits your career instead of competing with it
  To understand fitness well enough to manage it yourself
  To feel strong and consistent, not restricted
  A coach who treats you as a person, not a client number
```

### Station 7 · The proof

```
INDEX:    06
EYEBROW:  IN THEIR WORDS

H1:       Results that outlast
          the coaching.

TESTIMONIAL_1: [TESTIMONIAL 1 QUOTE]
  — [NAME 1], [PROFESSION 1], [DURATION 1] with Ikram

TESTIMONIAL_2: [TESTIMONIAL 2 QUOTE]
  — [NAME 2], [PROFESSION 2], [DURATION 2] with Ikram

TESTIMONIAL_3: [TESTIMONIAL 3 QUOTE]
  — [NAME 3], [PROFESSION 3], [DURATION 3] with Ikram
```

Never write a fake testimonial, name, profession, duration or result. Render the brackets visibly.
Add a build time guard that fails a production build if any [ remains in testimonial data.

### Station 8 · The close

```
INDEX:    07
EYEBROW:  NEXT STEP

HERO:     Start once. Properly.

LEAD:     A short consultation. A real assessment. No pressure,
          no template and no promises anyone should not make.

CTA:      Book a consultation
NOTE:     Usually a reply within one working day.

FOOTER_NAME:  Ikram Ansari
FOOTER_ROLE:  Transformation Coach · Entrepreneur · Educator
FOOTER_EMAIL: [EMAIL]
FOOTER_IG:    [INSTAGRAM]
FOOTER_PHONE: [PHONE]
FOOTER_COPY:  © 2026 Ikram Ansari. All rights reserved.
```

### Fixed chrome

```
SKIP_LINK:    Skip to booking
TIMELINE:     FRAME {current} / {total}
              {BEAT NAME}
```

Store all of this in src/content/copy.ts as a typed object. No string literals in JSX components.

## 6 · STACK

Fixed list. Adding anything requires stopping and asking the human.

```
react ^18, react-dom ^18, typescript ^5, vite ^5,
gsap ^3.12 (ScrollTrigger, SplitText, Observer), lenis ^1.1, clsx
```

AMENDED 2026-08-16 with client approval: three + @react-three/fiber REMOVED from the stack. They
conflict with the §11 210 KB bundle gate (~245–260 KB combined) while contributing nothing the film
uses (no scene graph, no geometry — the film is one fullscreen triangle with a custom fragment
shader). The WebGL renderer is written against raw WebGL2 instead. Everything else unchanged:
no Tailwind, no UI component library, no second animation library, no analytics, no chat widget,
no font CDN. Hand written CSS Modules over the token layer.

## 7 · THE FILM ENGINE

Isolated module under src/film/ with a clean seam.

```
src/film/
  manifest.ts        FILM constants, framePath, tier selection
  beats.ts           beat table, beatAtProgress()
  FrameLoader.ts     fetch, decode, cache, priority queue, memory window
  FrameLoader.worker.ts  off main thread fetch + decode (approved addition)
  useMasterProgress.ts  single ScrollTrigger, smoothed index, velocity
  Canvas2DRenderer.ts   fallback renderer
  WebGLRenderer.ts   raw WebGL2 renderer (amended from R3F)
  film.frag.glsl
  film.vert.glsl
  FilmLayer.tsx      picks renderer, owns the canvas element
```

### 7.1 · The single frame loop, non negotiable

Exactly one requestAnimationFrame loop on the page: gsap.ticker. Lenis constructed with
autoRaf: false and driven by the ticker; lenis 'scroll' event calls ScrollTrigger.update;
gsap.ticker.lagSmoothing(0). The WebGL renderer draws only when called from the same tick, only
when something changed. Instrument a counter (src/dev/rafAudit.ts) that proves exactly one
persistent rAF source; report the number in Phase 3 and keep the audit green in every later phase.

### 7.2 · Master progress

One ScrollTrigger on the document, start 0, end 'max', scrub true. Frame-rate normalised
smoothing: k = 1 − (1 − 0.14)^(dt/16.667); smoothed += (raw − smoothed) · k. exact = smoothed ·
(count − 1); index = floor(exact); blend = frac(exact). Redraw only when index changed or a
uniform changed past its epsilon. Expose a dev counter for draws per second.

### 7.3 · Loader

Decode with createImageBitmap in a dedicated worker; hold ImageBitmap objects, transferred
zero copy. AMENDED memory model (client approved): hold all encoded WebP blobs (~6 MB); decoded
bitmaps live in a byte budgeted LRU (~200 MB desktop, ~56 MB mobile 854 tier), evicted by distance
from the current index, never evicting pinned (drawn/uploaded) frames.

Load order: frame 0 at highest priority (first paint under 900 ms on throttled 4G, helped by a
preload tag in index.html) → blocking batch byte budgeted to ~250 KB with scroll locked and a 1px
ember progress rule, hard released after 3.5 s regardless → remainder ascending, batches of 12,
concurrency 6. Priority override: jumping to an unloaded region fetches a window of 16 centred on
the target before the sequential fill continues.

Never draw an unloaded frame. Hold the last drawn frame instead.

### 7.4 · Canvas 2D renderer, build this first

The fallback must be excellent on its own. Ships if WebGL fails, on software renderers, or under
prefers-reduced-motion. Cover fit drawImage; sub frame blending via second drawImage with
globalAlpha; grade via CSS filter on the canvas element; vignette/wash/grain via prebaked sprites
and composite operations; devicePixelRatio capped (≤1.5 backing on the 2D path); never per pixel
JS, never getImageData.

### 7.5 · WebGL renderer and the 3D treatment

Raw WebGL2, one program, one fullscreen triangle, texture ring (6 slots desktop, 4 mobile), at most
one texture upload per tick, prefetched ahead of the playhead, skipped when the tick already spent
6 ms. UNPACK_FLIP_Y false, UNPACK_PREMULTIPLY_ALPHA false, colorSpaceConversion none.

Uniforms: uFrame, uFrameNext, uBlend, uVelocity, uProgress, uWash, uSoften, uResolution, uTexSize,
uTime.

Fragment shader effects in order: (1) sub frame blend, mandatory, first; (2) depth parallax from
luminance proxy; (3) velocity chromatic dispersion ~2.2px max; (4) 6 tap Poisson DoF, strongest in
the upper third (taps from uFrame only, uFrameNext blended at the centre tap); (5) barrel warp
k = 0.012 + |v|·0.018; (6) grade into the palette (lift blacks to ink, highlights toward bone,
desaturate 12%, ember tint in highlights, pow 1.04); (7) animated grain, screen pixel constant,
frozen at rest; (8) vignette then uWash mix toward ink.

Reference GLSL bodies (coverUv, barrel, sampleFilm, grade constants INK/BONE/EMBER, hash grain,
Poisson taps) are specified in the original client message §7.5 and transcribed into
src/film/film.frag.glsl in Phase 5, adapted to GLSL 300 es.

Quality tiers via preprocessor defines, two compiled programs. LOW_QUALITY compiles out effects
3, 4, 5. Compile during the loading phase (KHR_parallel_shader_compile) with a warm up draw.

### 7.6 · Third party branding mitigation

NOT NEEDED. The "fitoholix" signage is the client's own brand (confirmed 2026-08-16). uSoften
remains in the shader as a general velocity/ghosting control only.

### 7.7 · The DOM 3D layer

```css
.stage { perspective: 1400px; perspective-origin: 50% 50%; transform-style: preserve-3d; }
.panel { transform-style: preserve-3d; backface-visibility: hidden; }
```

| Phase | Transform | Opacity | Filter |
|---|---|---|---|
| Enter | translateZ(-620px) rotateX(7deg) | 0 | blur(8px) |
| Rest | translateZ(0) rotateX(0deg) | 1 | blur(0) |
| Exit | translateZ(340px) rotateX(-5deg) | 0 | blur(6px) |

Panels exit toward the camera. Rest phase holds for at least 45 percent of the panel's scroll
range. will-change added on enter, removed on exit. Blur dropped on the mobile tier if it costs
frames.

## 8 · STATION SPECIFICATIONS

Eight stations. Heights: 100 + 110 + 100 + 240(pinned) + 120 + 100 + 110 + 100 = 980vh of station
travel (the client message said "roughly 700vh"; the station heights are authoritative). Progress
ranges below are master progress. Each station sets uWash and its scrim.

### STATION 1 · ENTRANCE
progress 0.000–0.090 · B1 THE MIRROR · CENTRE · uWash 0.42 · --scrim-heavy · 100vh

Film resolves on frame 0 and holds. No loading screen beyond the 1px ember rule. Entrance
choreography, timed not scrubbed, total 2.1s:

| t | Element | Motion |
|---|---|---|
| 0.00 | Film | uWash 0 → 0.42 over 1.2s |
| 0.35 | Eyebrow | Fade and rise 12px, 0.5s |
| 0.55 | Hero line 1 | SplitText by line, masked, y 110%→0, 0.9s |
| 0.68 | Hero line 2 | Same, stagger 0.13s |
| 0.81 | Hero line 3 | Same |
| 1.30 | Lead | Fade and rise 16px, 0.7s |
| 1.55 | Actions | Fade 0.5s, hairline border draws left to right on primary |
| 1.90 | Timeline chrome | Fade in |
| 2.10 | Scroll cue | Begins loop |

Lock scroll until complete or until the user attempts to scroll, whichever first. Never trap.

Primary: Book a consultation — transparent fill, 1px ember border, bone label; hover fills ember
from left in 180ms, label goes ink. Secondary: See the method — text only, 1px stone underline
draws on hover, jumps to Station 4. Scroll cue: 1px stone rule 48px tall, 3px ember dot travelling
down on a 2.4s loop; fades permanently after 40px of scroll.

### STATION 2 · THE PROBLEM
progress 0.096–0.185 (nudged from spec 0.196 to match footage) · B2 THE THRESHOLD · LEFT ·
uWash 0.68 · --scrim-left · 110vh

Left cols 1–5: index 01, eyebrow, H1 (Bodoni, --t-h1), BODY_1, BODY_2 (--t-body, --measure).
Right cols 8–12: LIST_LABEL, six pain points. Each row: 1px stone rule grows scaleX 0→1, origin
left, 0.42s, stagger 0.06s; text fades 0.1s behind the rule. Below 900px list moves under copy.

### STATION 3 · THE POSITIONING
progress 0.19–0.29 (nudged from spec 0.202–0.302) · B3 THE WELCOME → early B4 · RIGHT ·
uWash 0.55 · --scrim-right · 100vh

Content cols 8–12. Pull quote in Bodoni --t-h1 weight 400, oversized ember open quote glyph hung
in left margin ~4rem at opacity 0.5, optically flush. SplitText by line, masked, 0.9s, stagger
0.09s. Below: three credibility markers, Bodoni numerals --t-h2 bone over stone utility labels,
1px stone vertical rules between. Numerals count up over 1.1s power2.out; [CLIENT COUNT] renders
as literal text. Below 720px markers stack, rules go horizontal.

### STATION 4 · THE PROTOCOL
progress 0.308–0.552 · B4 THE ASSESSMENT + B6 THE WORK · CENTRE · uWash 0.60 · --scrim-heavy ·
240vh, pinned

Pins full duration. Left: fixed Bodoni numeral clamp(8rem, 22vw, 20rem), ember at 14% opacity,
crossfading 01–08 (0.35s opacity swap + 22px Y drift). Centre: step title --t-h2 bone,
description --t-body bone 88%, --measure; swaps via masked clip path wipe bottom→top 0.44s.
Right: vertical rail, 8 segments, 4px gaps, filling ember as each step activates; segment heights
proportional to description length. Numbering appears here and in station indices only.

Film keeps advancing while pinned. Verify step 01 lands on assessment footage and step 04 on
training footage; adjust station height/progress split until it does; screenshot all eight step
boundaries in Phase 7. Below 900px: numeral behind text at 8%, rail becomes horizontal 8 segment
bar pinned under the header.

### STATION 5 · THE TABLE
progress 0.604–0.712 · B7 THE TABLE · LEFT · uWash 0.74 · --scrim-left · 120vh

Left cols 1–5: index 04, eyebrow, H1, BODY. Right cols 7–12: MYTHS_LABEL, four myth pairs. Strike
statement in stone --t-h3 with 1px strike line drawing left→right (scaleX 0→1, 0.5s power2.inOut);
truth beneath in bone --t-body fading 0.18s after strike completes. Stagger pairs 0.14s. Get the
timing exact.

### STATION 6 · WHO THIS IS FOR
progress 0.719–0.812 · B8 THE RHYTHM · RIGHT · uWash 0.60 · --scrim-right · 100vh

Cols 8–12: index 05, eyebrow, H1, BODY. ASPIRATIONS_LABEL + six aspirations in two column list,
each prefixed by an ember rule growing 0→24px over 0.4s, stagger 0.07s. Emotional guardrail:
describes a fit, not a standard; nothing reads as a qualification test.

### STATION 7 · THE PROOF
progress 0.819–0.905 · B8 into B9 · LEFT · uWash 0.50 · --scrim-left · 110vh

Three testimonial cards stacked on --ash at 70% opacity, 1px stone border at 30% — the only
surface colour on L2, translucent. Quote in Bodoni --t-h3 bone, 1px stone rule 32px, attribution
in utility type. Reveal stagger 0.16s with §7.7 Z travel. Brackets render visibly; prebuild guard
fails production builds if any [ remains in testimonial data, printing offending keys.

### STATION 8 · THE CLOSE
progress 0.912–1.000 · B9 THE PROOF · CENTRE · uWash 0.30 · --scrim-heavy · 100vh

Film resolves and holds on final frame. HERO --t-hero Bodoni by line; LEAD --t-lead stone. Single
primary action: Book a consultation, filled ember, ink label, generous padding — the only large
ember area on the page; hover lifts 2px, shadow deepens. NOTE beneath in stone utility. Footer in
station: 1px stone rule at 20%, name, role, three bracketed contact links, copyright. All utility
type. No social icons, no newsletter, no sitemap.

## 9 · MOTION LAWS

1. One rAF loop. §7.1 is not advisory.
2. Everything scroll driven uses scrub. Timed animations only for the entrance sequence and hovers.
3. Easing vocabulary closed: power2.out, power2.inOut, power3.out, linear. Nothing else, ever.
4. No element animates more than two properties at once, excluding the shader.
5. SplitText by line only, never by character, always inside overflow hidden masks.
6. Durations: hover 180ms, scroll reveal 700–900ms, nothing over 1.2s except the entrance.
7. prefers-reduced-motion: reduce → Lenis disabled, native scroll; film locks to 8 fixed keyframes
   (one per beat) swapped instantly at station boundaries; Z travel becomes opacity only; timeline
   chrome hidden; counters render final values. Complete and good looking, not degraded.
   Screenshot as proof.

## 10 · RESPONSIVE

| Width | Behaviour |
|---|---|
| 1920 | Full design, all three anchors |
| 1440 | Reference design, tune here first |
| 1024 | Rails narrow to cols 1–6 / 7–12; hero drops one clamp step |
| 768 | Single centred column, --scrim-heavy everywhere, timeline hidden, protocol rail horizontal |
| 375 | Mobile tier frames, LOW_QUALITY shader, panel blur removed, station heights −20% |

Touch: syncTouch false, native momentum, ScrollTrigger reads it. Use 100svh for full height
stations.

## 11 · PERFORMANCE GATES

| Metric | Target |
|---|---|
| LCP, throttled 4G, mid tier mobile | under 2.5s |
| First film frame painted | under 900ms on 4G |
| Sustained scroll FPS, desktop | 58+ over a 10s scroll |
| Sustained scroll FPS, 4x CPU throttle | 45+ |
| JS bundle gzipped, excluding frames | under 210 KB |
| CSS gzipped | under 24 KB |
| Long tasks during scroll | zero over 80ms |
| CLS | 0 |
| Peak memory after full scroll, mobile tier | under 320 MB |
| Draw calls per second during scroll | under 65 |

Run a trace at the end of Phase 5 and every phase after; paste numbers as a table; a regression
blocks the next phase. (Measurement in this environment: gstack browse for screenshots + in page
PerformanceObserver/HUD harness for numbers, per client decision 2026-08-16.)

## 12 · ACCESSIBILITY

Canvas aria-hidden. Every station a <section> with aria-label naming its purpose. One h1, then h2
per station, no skipped levels. Keyboard nav must work with Lenis (focused elements scroll into
view — test explicitly). Focus rings 2px ember outline, 3px offset, everywhere. Skip link first
focusable, jumps to booking. Contrast checked against the worst case (brightest) frame per
station; stone never below 14px on the film layer. axe at end of Phase 8: zero critical, zero
serious. Reduced motion per §9 law 7.

## 13 · SKILLS AND PLUGINS

Enumerated 2026-08-16. Using: frontend-design (read before Phase 0 design plan), gstack browse
(visual verification from Phase 3 on), axe via browse (Phase 8). No component library skills, no
placeholder copy generators. Conflicts resolved in favour of this document.

## 14 · PHASED BUILD PLAN

Rules: content before motion; npm run build green at the end of each phase; one commit per phase
(`phase(n): description`); never leave a dev server foregrounded; end every phase with a report
(built, verified with numbers/screenshots, deferred, needed from the human).

- Phase 0 · Recon and plan — audit, docs, frame encode, design plan + critique.
  Commit: `phase(0): recon, asset audit, design plan`
- Phase 1 · Scaffold — Vite/React/TS strict, tokens verbatim, fonts + size-adjust, copy deck,
  manifest/beats, station shells with aria-labels. Verify ~980vh scroll, CLS 0.
  Commit: `phase(1): scaffold, tokens, typography, copy deck`
- Phase 2 · Static content — all eight stations, real copy, anchors, static scrims, responsive at
  375/768/1024/1440/1920, brackets visible. Screenshot every station at every breakpoint.
  Commit: `phase(2): all stations static and responsive`
- Phase 3 · Scroll foundation — Lenis + ticker + master ScrollTrigger, rAF audit proves 1 loop.
  Commit: `phase(3): single loop scroll foundation`
- Phase 4 · Film engine, Canvas 2D — loader, fallback renderer, timeline chrome live, loading
  rule. Verify scrub both directions, no blank flashes, jump override, <900ms first paint, memory.
  Commit: `phase(4): film engine with canvas 2d renderer`
- Phase 5 · WebGL upgrade — raw WebGL2 renderer, full shader with tier defines, uWash wired,
  fallback still perfect. First full §11 trace.
  Commit: `phase(5): webgl film layer and shader treatment`
- Phase 6 · 3D content motion — perspective stage, Z travel, SplitText reveals, entrance sequence.
  Verify beat anchoring at every boundary with screenshots; rest ≥45%.
  Commit: `phase(6): 3d panel choreography and reveals`
- Phase 7 · The Protocol — Station 4 pinned, numeral crossfade, masked wipes, proportional rail,
  mobile variant. Screenshot all eight step boundaries.
  Commit: `phase(7): total transformation protocol station`
- Phase 8 · Accessibility and fallbacks — full reduced motion path, keyboard nav with Lenis, skip
  link, focus rings, contrast vs worst case frames, placeholder build guard, axe clean, dash grep.
  [Client message truncated at the transport limit during this phase's description; remainder
  reconstructed:] Commit: `phase(8): accessibility and reduced motion`
- Phase 9 · Performance and final report — full §11 trace at all breakpoints, regressions fixed,
  bundle/memory reports, final screenshot set, closing report restating the §3.3 audit.
  Commit: `phase(9): performance pass and final report`
