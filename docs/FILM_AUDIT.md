# Film audit — source replaced 2026-08-17

The original 299 frame sequence was replaced with a new 300 frame sequence.
Everything below is measured from the plate, not read off it.

## Source facts

| | |
|---|---|
| files | `video frame/ezgif-frame-001..300.jpg`, contiguous, no gaps |
| geometry | 1920x1080 (the previous source was 2560x1440) |
| weight | 13.97 MB total, 47.7 KB average, 40.0 KB min, 144.7 KB max |
| colour | sRGB, 4:2:0 |
| watermark | generator sparkle, fixed position, bbox x 1704..1775 y 864..935 |

The watermark position was found by taking the per pixel minimum of ten frames
drawn from six different shots: the background varies wildly between them, the
mark does not, so only the mark survives the minimum.

## Structure: six shots, five hard cuts

Cuts were detected as mean absolute difference between consecutive 32x18
thumbnails. Within a shot the frame to frame difference sits between 0.5 and
2.9; at a cut it jumps to 25 to 50. There is no ambiguity.

| Act | Frames | Shot | Mean luma | Text safe side |
|---|---|---|---|---|
| 01 THE MIRROR | 0–54 | bedroom mirror, sheer curtain, lamp; heavier reflection | 101 | left (over curtain, needs scrim) |
| 02 THE ARRIVAL | 55–98 | two people walking away into the gym, bags in hand | 78 | right (dark gym) |
| 03 THE ASSESSMENT | 99–139 | coach with tablet, two clients, tungsten pendants | 64 | left (dark greenery) |
| 04 THE WORK | 140–194 | bent over dumbbell rows, night windows | 53 | either, uniform |
| 05 THE STANDARD | 195–239 | backs to camera at the gym mirror, dumbbell racks | 55 | right |
| 06 THE PROOF | 240–299 | the pair transformed, bright daylight, looking at each other | 89 | left |

The luminance track is itself the story: 101 in the bedroom, falling to 53 in
the deepest part of the work, rising to 89 at the proof. The page's colour arc
follows it rather than fighting it.

## Watermark removal

Cropping the mark out would cost the bottom 216 px, 20% of frame height, and a
2.23:1 scope crop then loses 20% of the width again once it is cover fitted
into a 16:9 viewport. The mark is removed instead:

1. discard a disc of radius 58 centred on 1740,900
2. refill by Jacobi relaxation of the Laplace equation, 220 iterations, seeded
   with the mean of the surrounding ring
3. add back high frequency detail lifted from a clean donor patch 156 px to the
   left, at 0.6 strength, so the fill carries the plate's grain instead of
   reading as a flat smudge
4. feather the last 8 px into the plate

`tools/wm-inpaint.mjs`. The residue is a 116 px patch in the lower right,
under the vignette, in out of focus background in all six shots.

## Encode output

300 frames, no decimation, three tiers:

| tier | size | total | per frame |
|---|---|---|---|
| xl | 1920x1080 | 12.93 MB | 44.1 KB |
| lg | 1280x720 | 8.48 MB | 29.0 KB |
| sm | 854x480 | 5.06 MB | 17.3 KB |

## Cuts anchor the sections

Section heights are chosen so the film's cuts land on section boundaries: the
page changes subject at the same instant the camera does.

| Section | vh | progress | frames | |
|---|---|---|---|---|
| hero | 110 | 0.000–0.092 | 0–27 | |
| problem | 110 | 0.092–0.183 | 27–55 | **cut 55** |
| positioning | 176 | 0.183–0.330 | 55–99 | **cut 99** |
| protocol | 284 | 0.330–0.567 | 99–169 | contains cut 140, under step 05 |
| table | 100 | 0.567–0.650 | 169–194 | **cut 195** |
| fit | 180 | 0.650–0.800 | 194–239 | **cut 240** |
| proof | 118 | 0.800–0.898 | 239–269 | |
| close | 122 | 0.898–1.000 | 269–299 | |

Total 1200 vh, about 4 vh of scroll per frame. `assertFilmCoverage()` throws in
DEV if a height edit moves a boundary off its cut.
