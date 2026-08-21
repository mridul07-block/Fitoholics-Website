/**
 * Content choreography (§7.7, §8, §9) — Phase 6.
 *
 * Everything scroll driven is scrubbed; the only timed sequences are the
 * entrance and hovers (§9 law 2). SplitText always by line, always masked
 * (§9 law 5). Easing vocabulary: power2.out, power2.inOut, power3.out,
 * linear — nothing else (§9 law 3).
 *
 * Under prefers-reduced-motion this module resolves the entrance gate and
 * does nothing else: content is fully visible, counters show final values.
 */
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { bindMagnetic, bindTilt } from './pointer'
import { SplitText } from 'gsap/SplitText'
import { prefersReducedMotion } from '../film/useMasterProgress'

gsap.registerPlugin(ScrollTrigger, SplitText)

/** FilmLayer multiplies its wash by this during the entrance ramp. */
export const filmEntrance = { wash: 0 }

/** Resolves when the entrance sequence completes (or immediately, reduced). */
let resolveEntrance: () => void = () => {}
export const entranceDone: Promise<void> = new Promise((res) => {
  resolveEntrance = res
})

let initialized = false

export function initChoreography(): void {
  if (initialized) return
  initialized = true

  if (prefersReducedMotion()) {
    filmEntrance.wash = 1
    resolveEntrance()
    return
  }

  const q = (sel: string) => document.querySelector<HTMLElement>(sel)
  const qa = (sel: string) => Array.from(document.querySelectorAll<HTMLElement>(sel))

  // ---------------------------------------------------------------
  // Station 1 · entrance, timed, 2.1s total (§8 S1 table)
  // ---------------------------------------------------------------
  const s1 = q('[data-station="1"]')
  if (s1) {
    const eyebrow = s1.querySelector<HTMLElement>('[data-s1-eyebrow]')
    const hero = s1.querySelector<HTMLElement>('h1')
    const lead = s1.querySelector<HTMLElement>('[data-s1-lead]')
    const actions = s1.querySelector<HTMLElement>('[data-s1-actions]')
    const cue = s1.querySelector<HTMLElement>('[data-scroll-cue]')
    gsap.set([eyebrow, lead, actions, cue].filter(Boolean), { autoAlpha: 0 })

    const tl = gsap.timeline({
      defaults: { ease: 'power3.out' },
      onComplete: () => resolveEntrance(),
    })
    tl.to(filmEntrance, { wash: 1, duration: 1.2, ease: 'power2.out' }, 0)
    if (eyebrow) tl.fromTo(eyebrow, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.5 }, 0.35)
    if (hero) {
      const split = SplitText.create(hero, { type: 'lines', mask: 'lines' })
      tl.fromTo(
        split.lines,
        { yPercent: 110 },
        { yPercent: 0, duration: 0.9, stagger: 0.13 },
        0.55,
      )
    }
    if (lead) tl.fromTo(lead, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.7 }, 1.3)
    if (actions) tl.fromTo(actions, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, 1.55)
    if (cue) {
      tl.fromTo(cue, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, 2.1)
      tl.add(() => cue.classList.add('cueRunning'), 2.1)
      // the cue fades permanently after 40px of scroll and never returns
      ScrollTrigger.create({
        start: 40,
        once: true,
        onEnter: () => gsap.to(cue, { autoAlpha: 0, duration: 0.4, ease: 'power2.out' }),
      })
    }
  } else {
    filmEntrance.wash = 1
    resolveEntrance()
  }

  // ---------------------------------------------------------------
  // The cut rule. When the footage hard cuts between camera setups, a line of
  // ramp light crosses the top of the viewport. The page cuts when the film
  // cuts — the one moment where the chrome is allowed to be loud.
  // ---------------------------------------------------------------
  const cutRule = q('[data-cut-rule]')
  if (cutRule) {
    gsap.set(cutRule, { scaleX: 0, transformOrigin: 'left center', autoAlpha: 0 })
    let first = true
    window.addEventListener('film:act', () => {
      // act one is published at boot, not at a cut
      if (first) {
        first = false
        return
      }
      gsap
        .timeline()
        .set(cutRule, { transformOrigin: 'left center', autoAlpha: 1 })
        .fromTo(cutRule, { scaleX: 0 }, { scaleX: 1, duration: 0.34, ease: 'power2.out' })
        .set(cutRule, { transformOrigin: 'right center' })
        .to(cutRule, { scaleX: 0, duration: 0.3, ease: 'power2.in' })
        .set(cutRule, { autoAlpha: 0 })
    })
  }

  // ---------------------------------------------------------------
  // Magnetic calls to action: the button leans toward the cursor by a few
  // pixels and springs back. Small enough to feel like weight, not a toy.
  // ---------------------------------------------------------------
  for (const btn of qa('[data-magnetic]')) bindMagnetic(btn, 0.22)

  // Surfaces tip toward the cursor. Bound only where there is a real pointer
  // and only on the objects that read as physical — the testimonial cards, the
  // stat cards and the myth cards. Chips are too small for a tilt to be
  // anything but noise.
  for (const el of qa('[data-tilt]')) bindTilt(el)

  // ---------------------------------------------------------------
  // Z travel (§7.7) — panels move through a real perspective context.
  // Enter from depth, rest >= 45% of range, exit TOWARD the camera.
  // Station 1 (entrance owns it) and station 4 (pinned) are excluded.
  // ---------------------------------------------------------------
  // No filter: blur() on the travelling panels. Animating a blur re-rasterises
  // the whole panel every frame while the film is also being drawn, and it
  // measured at about half the frame budget. Depth is already carried by the
  // perspective translate, the rotation and opacity, and the film behind has
  // its own defocus in the shader — the blur was the accessory to remove.
  for (const n of [2, 3, 5, 6, 7, 8]) {
    const section = q(`[data-station="${n}"]`)
    const panel = section?.querySelector<HTMLElement>('[data-panel]')
    if (!section || !panel) continue
    // Measured at the viewport midline, so the window length is the section's
    // own height and adjacent windows abut instead of overlapping. With the
    // default 'top bottom' to 'bottom top' a panel is partly visible for its
    // height PLUS a full viewport, which put two and sometimes three headlines
    // on screen at once, each half faded — the copy read as mush.
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 55%',
        end: 'bottom 45%',
        scrub: true,
        onToggle: (self) => {
          panel.style.willChange = self.isActive ? 'transform, opacity' : 'auto'
        },
      },
      defaults: { ease: 'none' },
    })
    tl.fromTo(
      panel,
      { z: -620, rotationX: 7, autoAlpha: 0 },
      { z: 0, rotationX: 0, autoAlpha: 1, duration: 0.22 },
    )
      .to(panel, { z: 0, duration: 0.55 })
      .to(panel, { z: 340, rotationX: -5, autoAlpha: 0, duration: 0.23 })
  }

  // ---------------------------------------------------------------
  // One shot reveals, latched, fired as each station reaches 75% vh.
  // ---------------------------------------------------------------
  /**
   * The trigger is resolved to the enclosing section, never the element itself.
   *
   * Every revealed element lives inside a panel that is being moved through a
   * perspective context, so its getBoundingClientRect is a moving target.
   * ScrollTrigger caches start positions from that rect at refresh time, and
   * with the panel parked at translateZ(-620) the cached start can sit at a
   * scroll position the element never actually reaches — the reveal then never
   * fires and the copy stays hidden inside its line mask. Sections are not
   * transformed, so their geometry is stable.
   */
  const reveal = (
    el: Element,
    build: (tl: gsap.core.Timeline) => void,
    start = 'top 55%',
  ) => {
    const trigger = el.closest('[data-station]') ?? el
    const tl = gsap.timeline({
      scrollTrigger: { trigger, start, once: true },
      defaults: { ease: 'power2.out' },
    })
    build(tl)
  }

  // headline line reveals for stations 2, 3, 5, 6, 7 and the close hero
  for (const sel of [
    '[data-station="2"] h2',
    '[data-station="3"] blockquote',
    '[data-station="4"] h2',
    '[data-station="5"] h2',
    '[data-station="6"] h2',
    '[data-station="7"] h2',
    '[data-station="8"] h2',
  ]) {
    const el = q(sel)
    if (!el) continue
    const split = SplitText.create(el, { type: 'lines', mask: 'lines' })
    reveal(el, (tl) => {
      tl.fromTo(split.lines, { yPercent: 110 }, { yPercent: 0, duration: 0.9, stagger: 0.09 })
      // a band of the room's light crosses the headline as it lands
      tl.fromTo(el, { '--sweep': -1 }, { '--sweep': 1, duration: 1.05, ease: 'power2.inOut' } as gsap.TweenVars, 0.12)
    })
  }

  // station 2: pain list rules draw, text follows (§8 S2)
  const painRows = qa('[data-station="2"] [data-pain-row]')
  if (painRows.length) {
    gsap.set(painRows, { autoAlpha: 0, '--ruleScale': 0 } as gsap.TweenVars)
    reveal(painRows[0]!, (tl) => {
      painRows.forEach((row, i) => {
        tl.to(row, { '--ruleScale': 1, duration: 0.42, ease: 'power2.inOut' } as gsap.TweenVars, i * 0.06)
          .to(row, { autoAlpha: 1, duration: 0.5 }, i * 0.06 + 0.1)
      })
    })
  }

  // station 3: the stat cards arrive as objects, then take their reading —
  // the bar fills and the numeral counts at the same time, so the card reads
  // like an instrument settling rather than like text appearing.
  const statCards = qa('[data-station="3"] [data-stat-card]')
  if (statCards.length) {
    gsap.set(statCards, { autoAlpha: 0, y: 20 })
    reveal(statCards[0]!, (tl) => {
      tl.to(statCards, { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.09 })
      statCards.forEach((card, i) => {
        const bar = card.querySelector<HTMLElement>('[data-stat-bar]')
        if (!bar) return
        // a placeholder value has no reading to give, so its bar stays empty
        const filled = card.querySelector('[data-count-to]') ? 1 : 0.12
        tl.fromTo(
          bar,
          { '--fill': 0 } as gsap.TweenVars,
          { '--fill': filled, duration: 0.9, ease: 'power2.out' } as gsap.TweenVars,
          i * 0.09 + 0.18,
        )
      })
    })
  }

  // station 3: stat numerals count up (literal text for placeholders, §8 S3)
  const stats = qa('[data-station="3"] [data-count-to]')
  for (const stat of stats) {
    const target = Number(stat.dataset.countTo)
    const suffix = stat.dataset.countSuffix ?? ''
    if (Number.isNaN(target)) continue
    reveal(stat, (tl) => {
      const proxy = { v: 0 }
      tl.to(proxy, {
        v: target,
        duration: 1.1,
        ease: 'power2.out',
        onUpdate: () => {
          stat.textContent = `${Math.round(proxy.v)}${suffix}`
        },
      })
    })
  }

  // station 5: myth pairs — strike draws, truth follows 0.18s later (§8 S5)
  const myths = qa('[data-station="5"] [data-myth-pair]')
  if (myths.length) {
    const strikes = qa('[data-station="5"] [data-myth-strike]')
    const truths = qa('[data-station="5"] [data-myth-truth]')
    // the strike line arrives after the words: text-decoration-color is
    // animatable and stays correct on wrapped lines
    gsap.set(strikes, { autoAlpha: 0, y: 10, textDecorationColor: 'rgba(255, 94, 26, 0)' })
    gsap.set(truths, { autoAlpha: 0, y: 8 })
    reveal(myths[0]!, (tl) => {
      myths.forEach((pair, i) => {
        const strike = pair.querySelector<HTMLElement>('[data-myth-strike]')
        const truth = pair.querySelector<HTMLElement>('[data-myth-truth]')
        const at = i * 0.14
        if (strike) {
          tl.to(strike, { autoAlpha: 1, y: 0, duration: 0.4 }, at)
          tl.to(
            strike,
            { textDecorationColor: 'rgba(255, 94, 26, .9)', duration: 0.5, ease: 'power2.inOut' },
            at + 0.35,
          )
        }
        if (truth) {
          tl.to(truth, { autoAlpha: 1, y: 0, duration: 0.5 }, at + 0.83)
        }
        // the ramp edge runs down the card as the truth lands, so the eye is
        // pulled from the retired claim to the correction
        const edge = pair.querySelector<HTMLElement>('[data-myth-edge]')
        if (edge) {
          tl.fromTo(
            edge,
            { '--edge': 0 } as gsap.TweenVars,
            { '--edge': 1, duration: 0.6, ease: 'power2.inOut' } as gsap.TweenVars,
            at + 0.7,
          )
        }
      })
    })
  }

  // station 6: the aspirations are chips now, so they arrive as objects rather
  // than as rules that draw. Transform and opacity only, staggered tightly
  // enough to read as one gesture instead of eight separate events.
  const aspirations = qa('[data-station="6"] [data-aspiration]')
  if (aspirations.length) {
    gsap.set(aspirations, { autoAlpha: 0, y: 14, scale: 0.96 })
    reveal(aspirations[0]!, (tl) => {
      tl.to(aspirations, {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: 0.5,
        ease: 'back.out(1.6)',
        stagger: 0.045,
      })
    })
  }

  // station 7: testimonial cards stagger in with depth (§8 S7)
  const cards = qa('[data-station="7"] [data-card]')
  if (cards.length) {
    gsap.set(cards, { autoAlpha: 0, y: 40, z: -120 })
    reveal(cards[0]!, (tl) => {
      tl.to(cards, { autoAlpha: 1, y: 0, z: 0, duration: 0.8, stagger: 0.16 })
    })
  }
}
