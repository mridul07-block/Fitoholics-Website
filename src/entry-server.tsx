/**
 * The server entry, for tools/prerender.mjs.
 *
 * Renders the same trees main.tsx and legal/main.tsx hydrate, to strings, at
 * build time, so no page is ever an empty #root: the hero copy is in the
 * HTML for the first paint, for link previews, and for search. Nothing here
 * runs in a browser, and this file must never import main.tsx (which installs
 * dev tooling against window at module scope).
 */
import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { App } from './App'
import { LegalPage } from './legal/LegalPage'
import { COPY } from './content/copy'
import { LEGAL, type LegalKey } from './content/legal'
import { jsonLd } from './content/schema'
import { FILM, PORTRAIT_MAX_ASPECT } from './film/manifest'

export function renderIndex(): string {
  return renderToString(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

export function renderLegal(key: LegalKey): string {
  return renderToString(
    <StrictMode>
      <LegalPage page={key} />
    </StrictMode>,
  )
}

export const legalPages = LEGAL.map((d) => ({ key: d.key, path: d.path, title: d.title, summary: d.summary }))

/** the first-paint ground under the film, per orientation (see index.html preloads) */
export const lqip = {
  landscape: FILM.lqip[0]!,
  portrait: FILM.lqipPortrait[0]!,
  portraitMaxAspect: PORTRAIT_MAX_ASPECT,
}

export const meta = COPY.meta

export { jsonLd }
