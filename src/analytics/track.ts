/**
 * Measurement, only when asked for.
 *
 * GA4 loads when VITE_GA4_ID is set at build time, the Meta Pixel when
 * VITE_META_PIXEL_ID is. With neither, every call here is a no-op and no
 * script, cookie or request ever exists: the site's default is no analytics.
 *
 * Both vendors load after the window load event and in idle time, so they
 * never compete with the film's blocking batch for the connection. Nothing
 * on the page waits for them.
 *
 * Events (documented in docs/ANALYTICS.md):
 *   cta_whatsapp_click {placement}   the conversion: any wa.me link, once per
 *                                    click, with where on the page it was.
 *                                    Sent to Meta as the standard Contact.
 *   section_view {key}               a station's middle crossed the viewport's
 *                                    middle, once per station
 *   scroll_depth {percent}           25 / 50 / 75 / 100, once each
 *   case_view {name}                 a case study half on screen, once each
 *   faq_open {question}              a question opened
 *   video_play {title}               a client clip started
 */
declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
    fbq?: (...args: unknown[]) => void
    _fbq?: unknown
  }
}

const GA4 = ((import.meta.env.VITE_GA4_ID as string | undefined) ?? '').trim() || null
const PIXEL = ((import.meta.env.VITE_META_PIXEL_ID as string | undefined) ?? '').trim() || null

export const analyticsEnabled = GA4 !== null || PIXEL !== null

type Params = Record<string, string | number | boolean>

export function track(name: string, params: Params = {}): void {
  if (GA4) window.gtag?.('event', name, params)
  if (PIXEL) window.fbq?.('trackCustom', name, params)
}

function trackContact(params: Params): void {
  if (GA4) window.gtag?.('event', 'cta_whatsapp_click', params)
  if (PIXEL) window.fbq?.('track', 'Contact', params)
}

const idle = (fn: () => void): void => {
  if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(fn, { timeout: 4000 })
  else window.setTimeout(fn, 1500)
}

const script = (src: string): void => {
  const s = document.createElement('script')
  s.async = true
  s.src = src
  document.head.appendChild(s)
}

const preconnect = (href: string): void => {
  const l = document.createElement('link')
  l.rel = 'preconnect'
  l.href = href
  document.head.appendChild(l)
}

function loadVendors(): void {
  if (GA4) {
    preconnect('https://www.googletagmanager.com')
    window.dataLayer = window.dataLayer ?? []
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments)
    }
    window.gtag('js', new Date())
    window.gtag('config', GA4, { anonymize_ip: true })
    script(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA4)}`)
  }
  if (PIXEL) {
    preconnect('https://connect.facebook.net')
    // the official snippet, written out: a queue that the vendor script drains
    type Queue = ((...args: unknown[]) => void) & {
      callMethod?: (...args: unknown[]) => void
      queue: unknown[]
      push: unknown
      loaded: boolean
      version: string
    }
    const n = function (this: unknown, ...args: unknown[]) {
      if (n.callMethod) n.callMethod.apply(n, args)
      else n.queue.push(args)
    } as Queue
    n.push = n
    n.loaded = true
    n.version = '2.0'
    n.queue = []
    window.fbq = n
    window._fbq = n
    script('https://connect.facebook.net/en_US/fbevents.js')
    window.fbq('init', PIXEL)
    window.fbq('track', 'PageView')
  }
}

/** where on the page a link was: its own data-cta, else its landmark */
function placementOf(a: HTMLElement): string {
  if (a.dataset.cta) return a.dataset.cta
  if (a.closest('#nav-panel')) return 'menu'
  if (a.closest('[data-nav]')) return 'nav'
  if (a.closest('footer')) return 'footer'
  const station = a.closest<HTMLElement>('[data-station-key]')
  return station?.dataset.stationKey ?? 'page'
}

const text = (el: Element | null | undefined, max: number): string => (el?.textContent ?? '').trim().slice(0, max)

function wire(): void {
  // the conversion: every WhatsApp link on the page, exactly once per click
  document.addEventListener('click', (e) => {
    const target = e.target as Element | null
    const a = target?.closest<HTMLAnchorElement>('a[href^="https://wa.me"]')
    if (a) trackContact({ placement: placementOf(a) })
    const v = target?.closest<HTMLElement>('[data-video]')
    if (v) track('video_play', { title: text(v, 80) })
  })

  // toggle does not bubble, so it is caught on the way down
  document.addEventListener(
    'toggle',
    (e) => {
      const d = e.target as HTMLDetailsElement | null
      if (d?.matches?.('[data-faq]') && d.open) track('faq_open', { question: text(d.querySelector('summary'), 120) })
    },
    true,
  )

  if ('IntersectionObserver' in window) {
    const seen = new WeakSet<Element>()
    const once = (io: IntersectionObserver, el: Element, fn: () => void) => {
      if (seen.has(el)) return
      seen.add(el)
      io.unobserve(el)
      fn()
    }
    // a station is taller than the screen, so "seen" is its band crossing the
    // middle of the viewport, not half of it being visible at once
    const stations = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (!en.isIntersecting) continue
          const el = en.target as HTMLElement
          once(stations, el, () => track('section_view', { key: el.dataset.stationKey ?? el.id }))
        }
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 },
    )
    document.querySelectorAll('[data-station-key], #faq').forEach((el) => stations.observe(el))

    const cases = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (!en.isIntersecting) continue
          once(cases, en.target, () => track('case_view', { name: text(en.target.querySelector('figcaption'), 60) }))
        }
      },
      { threshold: 0.5 },
    )
    document.querySelectorAll('[data-case]').forEach((el) => cases.observe(el))
  }

  const fired = new Set<number>()
  let ticking = false
  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        ticking = false
        const max = document.documentElement.scrollHeight - window.innerHeight
        if (max <= 0) return
        const pct = (window.scrollY / max) * 100
        for (const m of [25, 50, 75, 100]) {
          if (pct >= m && !fired.has(m)) {
            fired.add(m)
            track('scroll_depth', { percent: m })
          }
        }
      })
    },
    { passive: true },
  )
}

let installed = false

export function initAnalytics(): void {
  if (installed || !analyticsEnabled) return
  installed = true
  const start = () =>
    idle(() => {
      loadVendors()
      wire()
    })
  if (document.readyState === 'complete') start()
  else window.addEventListener('load', start, { once: true })
}
