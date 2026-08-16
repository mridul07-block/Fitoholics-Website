/**
 * Scroll speed -> effect strength.
 *
 * The film's velocity is measured in frames per second of footage. The page is
 * about 28 px of scroll per frame at every breakpoint, so the units translate
 * to a hand speed directly:
 *
 *     200 px/s   ~7 f/s    reading, one notch at a time
 *     800 px/s   ~28 f/s   a steady continuous scroll
 *    1500 px/s   ~53 f/s   moving with purpose
 *    4000 px/s   ~140 f/s  a real flick
 *
 * The velocity driven effects in the shader (parallax, dispersion, barrel and
 * the depth of field) used to receive `velocity / 30` clamped to 1, which meant
 * they reached FULL strength at 855 px/s and stayed pinned there for every
 * faster motion. They were never the occasional flourish they were designed to
 * be: they ran at maximum through all ordinary scrolling, and their combined
 * output is the softness that made the plate look out of focus whenever the
 * page moved.
 *
 * So the mapping has a dead zone and a realistic full scale instead. Below
 * DEAD the film is treated as still and the effects are exactly zero, which is
 * where a reader spends most of their time. They ease in across the range and
 * only reach full strength at a genuine flick, where a smear reads as speed
 * rather than as a lens problem.
 */

/** frames/sec below which the film counts as still (about 740 px/s) */
const DEAD = 26
/** frames/sec at which the effects reach full strength (about 4300 px/s) */
const FULL = 150

/**
 * Signed 0..1 effect strength for a film velocity in frames/sec.
 * Smoothstepped, so the effects fade in rather than switching on at the edge of
 * the dead zone.
 */
export function motionNorm(velocity: number): number {
  const t = (Math.abs(velocity) - DEAD) / (FULL - DEAD)
  const c = t < 0 ? 0 : t > 1 ? 1 : t
  const eased = c * c * (3 - 2 * c)
  return velocity < 0 ? -eased : eased
}
