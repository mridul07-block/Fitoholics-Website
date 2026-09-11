/**
 * Content choreography (§7.7, §8, §9) — Phase 6.
 *
 * Everything scroll driven is scrubbed; the only timed sequences are the
 * entrance and hovers (§9 law 2). SplitText always by line, always masked
 * (§9 law 5). Easing vocabulary: power2.out, power2.inOut, power3.out,
 * linear — nothing else (§9 law 3).
 *
 * Two entry points, because they wait for different things. initEntrance()
 * runs the moment the page mounts: it needs no fonts (the headline is never
 * split or hidden) and the hero is the first paint. initChoreography() runs
 * once the fonts are in, because it splits headlines into lines.
 *
 * Under prefers-reduced-motion both resolve immediately and hide nothing:
 * content is fully visible, counters show final values.
 */
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { bindMagnetic, bindTilt } from './pointer'
import { SplitText } from 'gsap/SplitText'
import { prefersReducedMotion } from '../film/useMasterProgress'
import { GEOMETRY, type StationKey } from '../stations/geometry'

gsap.registerPlugin(ScrollTrigger, SplitText)

/** a station's root, by the stable key App.tsx writes as data-station-key */
const station = (key: StationKey) => `[data-station-key="${key}"]`

/**
 * Past this the CSS fallback in index.html has begun revealing the hero's
 * supporting elements on its own, and a visitor may already be reading them.
 * Hiding them again to play a sequence would be a flash, so the timed
 * entrance only plays if the bundle got here first. Mirrors the 800ms delay
 * on the s1Reveal animation in index.html; the two must move together.
 */
const ENTRANCE_LATEST_MS = 800

/** Resolves when the entrance sequence completes (or immediately, reduced). */
let resolveEntrance: () => void = () => {}
export const entranceDone: Promise<void> = new Promise((res) => {
  resolveEntrance = res
})

let entranceStarted = false

/**
 * The hero's arrival, ~0.8s (§8 S1). The headline is never touched: it is the
 * LCP element and it is already on screen. Only the eyebrow, the lead, the
 * buttons and the cue take part, and the buttons are usable from 0.35s.
 */
export function initEntrance(): void {
  if (entranceStarted) return
  entranceStarted = true
  performance.mark('entrance:start')

  const done = () => {
    performance.mark('entrance:done')
    resolveEntrance()
  }

  const s1 = document.querySelector<HTMLElement>(station('hero'))
  const cue = s1?.querySelector<HTMLElement>('[data-scroll-cue]') ?? null
  const cueFadesOnScroll = () => {
    if (!cue) return
    cue.classList.add('cueRunning')
    // the cue fades permanently after 40px of scroll and never returns
    ScrollTrigger.create({
      start: 40,
      once: true,
      onEnter: () => gsap.to(cue, { autoAlpha: 0, duration: 0.4, ease: 'power2.out' }),
    })
  }

  if (!s1 || prefersReducedMotion()) {
    done()
    return
  }
  if (performance.now() > ENTRANCE_LATEST_MS) {
    // the CSS fallback is already showing the page; leave it alone
    cueFadesOnScroll()
    done()
    return
  }

  const eyebrow = s1.querySelector<HTMLElement>('[data-s1-eyebrow]')
  const hero = s1.querySelector<HTMLElement>('h1')
  const lead = s1.querySelector<HTMLElement>('[data-s1-lead]')
  const actions = s1.querySelector<HTMLElement>('[data-s1-actions]')
  const detail = s1.querySelector<HTMLElement>('[data-s1-detail]')
  const parts = [eyebrow, lead, actions, detail, cue].filter((el): el is HTMLElement => !!el)

  // Hide first, then take over from the CSS fallback. While its animation is
  // in its delay it holds these at opacity 0 above any inline style, so the
  // inline hide is in place before the animation is cancelled and there is
  // no frame in which the elements are visible.
  gsap.set(parts, { autoAlpha: 0 })
  document.documentElement.dataset.entrance = ''

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
  if (eyebrow) tl.fromTo(eyebrow, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.35 }, 0)
  // a band of the room's light crosses the headline instead of the headline
  // rising: it was there already, so it is lit rather than delivered
  if (hero) tl.fromTo(hero, { '--sweep': -1 }, { '--sweep': 1, duration: 0.9, ease: 'power2.inOut' } as gsap.TweenVars, 0.05)
  if (lead) tl.fromTo(lead, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.5 }, 0.2)
  if (actions) tl.fromTo(actions, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, 0.35)
  if (detail) tl.fromTo(detail, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, 0.5)
  tl.add(done, 0.8)
  if (cue) {
    tl.fromTo(cue, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, 0.8)
    tl.add(cueFadesOnScroll, 0.8)
  }
}

let initialized = false

export function initChoreography(): void {
  if (initialized) return
  initialized = true

  if (prefersReducedMotion()) return

  const q = (sel: string) => document.querySelector<HTMLElement>(sel)
  const qa = (sel: string) => Array.from(document.querySelectorAll<HTMLElement>(sel))

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
  // Enter from depth, rest >= 70% of range, exit TOWARD the camera.
  // The entrance (it owns its own motion) and the pinned protocol opt out in
  // geometry.ts.
  // ---------------------------------------------------------------
  // No filter: blur() on the travelling panels. Animating a blur re-rasterises
  // the whole panel every frame while the film is also being drawn, and it
  // measured at about half the frame budget. Depth is already carried by the
  // perspective translate, the rotation and opacity, and the film behind has
  // its own defocus in the shader — the blur was the accessory to remove.
  for (const g of GEOMETRY) {
    if (!g.zTravel) continue
    const section = q(station(g.key))
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
    // Proportions are the reading budget. The panel used to travel 620px of
    // depth and hold legible for 55% of its window; at perspective 1400 that
    // is the copy scaling from 0.69 to 1.32 while someone is trying to read
    // it, and the exit fade started before the section did. Depth is now a
    // quarter of what it was and the still, fully opaque middle is 72% of the
    // section, so the copy arrives, holds long enough to be read at a constant
    // size, and only then leaves.
    //
    // The eases matter as much as the numbers: on a scrub, `none` means the
    // fade tracks the wheel linearly and the copy spends the whole entrance
    // half visible. power2.out brings it to full opacity early and holds it
    // there; power2.in keeps it solid until it is genuinely on its way out.
    tl.fromTo(
      panel,
      { z: -260, rotationX: 4, autoAlpha: 0 },
      { z: 0, rotationX: 0, autoAlpha: 1, duration: 0.14, ease: 'power2.out' },
    )
      .to(panel, { z: 0, duration: 0.72 })
      .to(panel, { z: 150, rotationX: -3, autoAlpha: 0, duration: 0.14, ease: 'power2.in' })
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

  // headline line reveals: every station marks the one element that is its
  // headline (an h2, or the positioning quote) with data-headline, so a new
  // station gets the reveal without an entry here
  for (const el of qa('[data-station-key] [data-headline]')) {
    const split = SplitText.create(el, { type: 'lines', mask: 'lines' })
    reveal(el, (tl) => {
      tl.fromTo(split.lines, { yPercent: 110 }, { yPercent: 0, duration: 0.9, stagger: 0.09 })
      // a band of the room's light crosses the headline as it lands
      tl.fromTo(el, { '--sweep': -1 }, { '--sweep': 1, duration: 1.05, ease: 'power2.inOut' } as gsap.TweenVars, 0.12)
    })
  }

  // Rule rows: the hairline draws, the text follows (§8 S2). The problem's
  // pain list, the coach's credentials and the "what you receive" list all
  // share the shape, one gesture per station.
  for (const sel of ['[data-pain-row]', '[data-credential]', '[data-receive-row]']) {
    const rows = qa(`[data-station-key] ${sel}`)
    if (!rows.length) continue
    gsap.set(rows, { autoAlpha: 0, '--ruleScale': 0 } as gsap.TweenVars)
    reveal(rows[0]!, (tl) => {
      rows.forEach((row, i) => {
        tl.to(row, { '--ruleScale': 1, duration: 0.42, ease: 'power2.inOut' } as gsap.TweenVars, i * 0.06)
          .to(row, { autoAlpha: 1, duration: 0.5 }, i * 0.06 + 0.1)
      })
    })
  }

  // Stat cards arrive as objects, then take their reading — the bar fills and
  // the numeral counts at the same time, so the card reads like an instrument
  // settling rather than like text appearing. Per station, because the coach
  // and the "what you receive" facts each have their own set.
  for (const g of GEOMETRY) {
    const statCards = qa(`${station(g.key)} [data-stat-card]`)
    if (!statCards.length) continue
    gsap.set(statCards, { autoAlpha: 0, y: 20 })
    reveal(statCards[0]!, (tl) => {
      tl.to(statCards, { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.09 })
      statCards.forEach((card, i) => {
        const bar = card.querySelector<HTMLElement>('[data-stat-bar]')
        if (!bar) return
        // a value with nothing to count has no reading to give, so its bar
        // stays nearly empty
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

  // stat numerals count up (§8 S3)
  const stats = qa('[data-station-key] [data-count-to]')
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

  // nutrition: myth pairs — strike draws, truth follows 0.18s later (§8 S5)
  const myths = qa(`${station('nutrition')} [data-myth-pair]`)
  if (myths.length) {
    const strikes = qa(`${station('nutrition')} [data-myth-strike]`)
    const truths = qa(`${station('nutrition')} [data-myth-truth]`)
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

  // pathways: the aspirations are chips, so they arrive as objects rather
  // than as rules that draw. Transform and opacity only, staggered tightly
  // enough to read as one gesture instead of eight separate events.
  const aspirations = qa(`${station('pathways')} [data-aspiration]`)
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

  // the footer assembles rather than appearing: rule draws, then the columns
  const footRule = q('[data-footer-rule]')
  const footCols = qa('[data-footer-col]')
  if (footRule && footCols.length) {
    gsap.set(footRule, { '--ruleScale': 0 } as gsap.TweenVars)
    gsap.set(footCols, { autoAlpha: 0, y: 18 })
    gsap
      .timeline({
        scrollTrigger: { trigger: footRule, start: 'top 92%', once: true },
        defaults: { ease: 'power2.out' },
      })
      .to(footRule, { '--ruleScale': 1, duration: 0.7, ease: 'power2.inOut' } as gsap.TweenVars)
      .to(footCols, { autoAlpha: 1, y: 0, duration: 0.65, stagger: 0.09 }, 0.18)
  }

  // Cards stagger in with depth (§8 S7): the case studies, clips and
  // testimonials under the results, and the three paths under "who it is
  // for". One gesture per station, in document order.
  for (const key of ['transformations', 'pathways'] as const) {
    const cards = qa(`${station(key)} [data-case], ${station(key)} [data-video], ${station(key)} [data-card], ${station(key)} [data-path]`)
    if (!cards.length) continue
    gsap.set(cards, { autoAlpha: 0, y: 40, z: -120 })
    reveal(cards[0]!, (tl) => {
      tl.to(cards, { autoAlpha: 1, y: 0, z: 0, duration: 0.8, stagger: 0.12 })
    })
  }
}
