# Design Plan

Revised 2026-08-17, when the footage was replaced and the client asked for an
orange gradient identity, a more modern and premium surface, and more motion.
Supersedes the Phase 0 plan. The film audit it is built on is in
[FILM_AUDIT.md](FILM_AUDIT.md).

## The idea

The gym in the footage is lit by tungsten: amber pendants over the assessment,
wall washers along the mirror, morning light through a sheer curtain. Orange is
already in the plate. So the page does not apply an orange accent on top of a
neutral ground — it grades the film into a single warm gradient field and then
builds the whole interface out of that one gradient.

**The colour arc is the story arc.** Measured mean luminance runs 101 in the
bedroom, down to 53 in the deepest part of the work, back up to 89 at the
proof. Each act owns a gradient that tracks it: violet black and sunless at the
mirror, tungsten entering at the assessment, deep rust through the work, molten
amber at the proof. The film is rendered through that gradient in the shader
and the DOM scrims are tinted by the same values, so there is never a moment
where the page and the footage are two different colour worlds.

## Tokens

Three families, not seven flat swatches.

**Ground**
- `--void #08060A` violet black, the cold end of the arc
- `--char #14100E` warm charcoal, the one card surface

**The ramp** — one gradient object, used as one thing
- `--rust #6E2A0C` shadow end
- `--ember #FF5E1A` the accent
- `--flare #FFA23A` light end
- `--ramp: linear-gradient(104deg, rust, ember 46%, flare)`

**Type**
- `--bone #F7F1E9` warm paper
- `--stone #A79A90` warm grey, secondary and meta

The ramp is what makes it read as a system rather than a colour: text clips it
(indices, stat numerals, act labels, the quote glyph, the protocol numeral),
rails fill with it, the loading rule is made of it, the cut flare sweeps it.

## Type roles

Unchanged from Phase 0 and still right: Bodoni Moda for display, Archivo for
body, Archivo 500 uppercase tracked for the utility register. A didone over
footage is the typographic idea — cinema title cards, not fitness poster type.
What changed is the treatment: display type is larger, tighter, and a band of
the room's light crosses each headline as it lands.

## Signature element

The live film timeline, now reporting the film's real structure.

- top right: `FRAME 147 / 300`, the act it belongs to, and the act's one line
- left edge: a six segment reel, one segment per camera setup, each filling
  with the ramp as the playhead crosses it

The six segments are the six shots measured from the plate. The chrome reports
the film rather than decorating it.

**The cut.** Five times in the page, the footage hard cuts between camera
setups. At each one the atmosphere snaps to the new act's gradient and settles
over a third of a second, a flare wipes across the film in the shader, the
frame counter ticks over with a flash, and a line of ramp light crosses the top
of the viewport. The page cuts when the film cuts. This is the one moment the
interface is allowed to be loud, and it is earned by data rather than invented.

## Layout

Eight sections rotating CENTRE, LEFT, RIGHT, CENTRE, LEFT, RIGHT, LEFT, CENTRE,
over a fixed film. Section heights are chosen so the cuts land on section
boundaries (see the film audit table). The two acts where the film is doing the
talking — the arrival and the standard — get the tallest sections, so the page
breathes with the footage instead of filling every screen with copy.

```
S1 110vh  CENTRE hero                     act 01 mirror
S2 110vh  LEFT copy   | pain list right    act 01 mirror        -> cut 55
S3 176vh  quote RIGHT | stats              act 02 arrival       -> cut 99
S4 284vh  PINNED protocol, 8 steps         act 03 -> 04         (cut 140 mid)
S5 100vh  LEFT copy   | myth strikes       act 04 work          -> cut 195
S6 180vh  RIGHT copy  | fit list           act 05 standard      -> cut 240
S7 118vh  LEFT copy   | testimonial cards  act 06 proof
S8 122vh  CENTRE close + CTA + footer      act 06 proof
```

## Motion

Scroll driven work is scrubbed; the only timed sequences are the entrance, the
cut, and hovers.

- panels travel a real perspective context, entering from z -620 and exiting
  toward the camera, with the travel window narrower than the section so two
  panels are never half faded on screen at once
- headline reveals are masked by line, with a band of light crossing them
- the cut: atmosphere snap and settle, shader flare, chrome flash, cut rule
- protocol: numeral crossfade, clip path wipe bottom to top, rail fills
- myth strikes draw their line in ember after the words land
- stat numerals count up; aspiration rules grow from zero
- calls to action lean toward the cursor and spring back

## Smoothness

The client's complaint was that scrubbing was not smooth. Four changes:

1. **A critically damped spring replaces the lerp.** A lerp chained behind
   Lenis' own lerp stacks two exponential lags, which is exactly what reads as
   rubber banding — the film keeps sliding after the wheel stops. A spring at
   zeta 1 has no overshoot and settles in finite perceptual time.
2. **All 300 frames, no decimation**, at about 4 vh of scroll per frame.
3. **Direction aware prefetch.** The resident window is asymmetric in the
   direction of travel and widens with speed, clamped so it can never exceed
   what the cache holds — otherwise the prefetcher and the evictor chase each
   other and every frame decodes twice.
4. **Eviction follows travel.** Plain distance from the playhead would discard
   frames just ahead of a fast scroll as readily as ones already passed.

## Critique against the frontend-design skill

- **Palette cluster.** The near black field with a single bright accent is one
  of the three flagged AI defaults. This is not that: the accent is a five stop
  gradient that is also the grade on the footage, the ground is a per act
  gradient that moves through the page, and the whole field is derived from the
  measured colour of the plate. What would have been the default — flat
  `#0C0D10` plus one orange — is what the previous revision did, and is what
  this replaces.
- **Numbered markers.** Still earned: the protocol is genuinely an ordered
  eight step sequence and the acts are genuinely six camera setups. Numbering
  appears nowhere it is not reporting a real sequence.
- **The risk.** Grading the plate toward the ramp risks turning skin orange.
  It is held back by restoring 65% of the original luminance after the grade
  and capping the grade at 0.34 to 0.46 depending on act, so faces keep their
  modelling. The client's requirement that the footage stay clearly visible is
  the constraint this is tuned against.
- **Chanel check.** Removed before shipping: a giant act numeral watermark
  (competed with the protocol numeral), a centred act title card (blocked
  copy), DOM grain (shader only), and `mix-blend-mode` on the headline sweep
  (an ancestor filter isolated the group and it rendered as a box).
