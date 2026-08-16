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
  // Z travel (§7.7) — panels move through a real perspective context.
  // Enter from depth, rest >= 45% of range, exit TOWARD the camera.
  // Station 1 (entrance owns it) and station 4 (pinned) are excluded.
  // ---------------------------------------------------------------
  const blurOk = window.matchMedia('(min-width: 900px)').matches
  for (const n of [2, 3, 5, 6, 7, 8]) {
    const section = q(`[data-station="${n}"]`)
    const panel = section?.querySelector<HTMLElement>('[data-panel]')
    if (!section || !panel) continue
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
        onToggle: (self) => {
          panel.style.willChange = self.isActive ? 'transform, opacity' : 'auto'
        },
      },
      defaults: { ease: 'none' },
    })
    tl.fromTo(
      panel,
      { z: -620, rotationX: 7, autoAlpha: 0, ...(blurOk ? { filter: 'blur(8px)' } : {}) },
      { z: 0, rotationX: 0, autoAlpha: 1, ...(blurOk ? { filter: 'blur(0px)' } : {}), duration: 0.275 },
    )
      .to(panel, { z: 0, duration: 0.45 })
      .to(panel, {
        z: 340,
        rotationX: -5,
        autoAlpha: 0,
        ...(blurOk ? { filter: 'blur(6px)' } : {}),
        duration: 0.275,
      })
  }

  // ---------------------------------------------------------------
  // One shot reveals, latched, fired as each station reaches 75% vh.
  // ---------------------------------------------------------------
  const reveal = (
    trigger: Element,
    build: (tl: gsap.core.Timeline) => void,
    start = 'top 72%',
  ) => {
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
    reveal(el, (tl) =>
      tl.fromTo(split.lines, { yPercent: 110 }, { yPercent: 0, duration: 0.9, stagger: 0.09 }),
    )
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
    gsap.set(strikes, { autoAlpha: 0, y: 10, textDecorationColor: 'rgba(154, 150, 143, 0)' })
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
            { textDecorationColor: 'rgba(154, 150, 143, 1)', duration: 0.5, ease: 'power2.inOut' },
            at + 0.35,
          )
        }
        if (truth) {
          tl.to(truth, { autoAlpha: 1, y: 0, duration: 0.5 }, at + 0.83)
        }
      })
    })
  }

  // station 6: aspiration rules grow 0 -> 24px (§8 S6)
  const aspirations = qa('[data-station="6"] [data-aspiration]')
  if (aspirations.length) {
    gsap.set(aspirations, { autoAlpha: 0, '--ruleW': '0px' } as gsap.TweenVars)
    reveal(aspirations[0]!, (tl) => {
      aspirations.forEach((item, i) => {
        tl.to(item, { '--ruleW': '24px', duration: 0.4 } as gsap.TweenVars, i * 0.07)
          .to(item, { autoAlpha: 1, duration: 0.45 }, i * 0.07 + 0.08)
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
