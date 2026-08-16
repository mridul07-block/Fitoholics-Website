# Design Plan · Phase 0

One page, per §14 Phase 0 and the frontend-design skill. Tokens, type roles, layout concept,
signature element, then the mandated self critique.

## Tokens

Locked client identity, used exactly as §4.1 ships them. Five colours:

- `--ink #100E0D` warm near black, the dominant field. The film is graded down into it.
- `--bone #F0EBE3` warm bone, primary type.
- `--ember #D2521C` deep ember, the only accent. Fewer than eight appearances; one large fill
  (Station 8 CTA) on the whole page.
- `--stone #8C8177` secondary type, rules, meta.
- `--ash #1C1917` card surface, used once (Station 7, translucent).

## Type roles

- Display: Bodoni Moda variable. Hero, station headlines, pull quote, protocol numerals, stat
  numerals. Nothing else. High contrast didone against film footage is the whole typographic idea:
  cinema title cards, not fitness poster type.
- Body: Archivo variable 400. Paragraphs, list items, truths, testimonials.
- Utility: Archivo 500 uppercase, tracked +.14em, stone. Eyebrows, frame counter, indices, labels,
  footer. This is the "film production paperwork" register that ties the timeline chrome to the
  content.

## Layout concept

A fixed film with content stations rotating CENTRE → LEFT → RIGHT → CENTRE → LEFT → RIGHT → LEFT →
CENTRE so the eye never settles. Rails (cols 1–5 / 8–12) always leave the film readable on the
opposite side; contrast comes from per-station L1 scrims, never from surfaces. One pinned station
(the Protocol) at the exact centre of the page, over the footage it describes.

```
S1  [   scrim-heavy    CENTRE hero          ]   film: mirror
S2  [██ LEFT copy      | film: doorway     ]   pain list right
S3  [   film: welcome  |     RIGHT quote ██]   stats row
S4  [ 04 |  step wipe  | rail ]  PINNED        film: assessment→training
S5  [██ LEFT copy      | film: kitchen    ]   myth strikes right
S6  [   film: park run |  RIGHT fit list ██]
S7  [██ LEFT cards     | film: leaner gym ]
S8  [   scrim-heavy    CENTRE close + CTA  ]   film: proof, wash drops to .30
```

## Signature element

The live film timeline, top right: `FRAME 047 / 150` over the current beat name, utility type,
updating every drawn frame. It exposes the mechanism, promises "this is one continuous piece, not
a scroll trap", and speaks the film-production vernacular the subject's story is shot in. Runner
up considered and rejected: the protocol rail (good, but it lives in one station; the timeline
lives everywhere and costs almost nothing visually).

Secondary quiet moves that support it without competing: the myth strike-through draw in S5, and
the proportional (honest) rail segments in S4.

## Critique against the frontend-design skill

- **Palette cluster warning.** Ink/bone/ember sits near the skill's "warm cream + high contrast
  serif + terracotta" default cluster (inverted: ink field rather than cream field). This is a
  brief mandated constraint — §4 says the identity is locked from prior client work and must be
  used exactly — not a default I reached for. Noted as the skill requires. The distinctiveness
  budget is therefore spent on the film mechanism, the timeline chrome, and the didone-over-footage
  type treatment, none of which are in the generic cluster.
- **Numbered markers.** The skill warns against decorative 01/02/03. Here numbering is earned:
  the Protocol genuinely is an ordered eight step sequence, and station indices mirror a film's
  scene slates. Numbering appears nowhere else, per §8.
- **The aesthetic risk.** Scroll *is* the film — no autoplay, no poster fallback hero. If the
  loader fails its 900 ms budget the page's first impression dies, which is why the risk is
  underwritten by the preload tag, the LQIP ground, and a Canvas2D path that must be ship quality
  on its own.
- **Copy.** Entirely client supplied, verbatim, active voice, no hype. The skill's writing rules
  are satisfied by the deck itself; my job is to not touch it.
- **Chanel check.** Removed before building: no grain on L1 DOM (shader only), no parallax on the
  scrims, no hover states on list rows, no secondary accent anywhere.

## Restraint contract (enforced through every phase)

Ember count on the page: S1 CTA border, S1 scroll cue dot, S3 quote glyph, S4 numeral + rail
fills (one system), S6 list rules (one system), S8 CTA fill, loading rule = 7 systems. Cap is 8.
No new ember without removing one.
