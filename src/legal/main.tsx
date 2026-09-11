/**
 * Entry for the legal pages (privacy.html, terms.html, refunds.html).
 * The page decides which document it is with data-page on #root.
 */
import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import '../styles/tokens.css'
import '../styles/fonts.css'
import '../styles/reset.css'
import '../styles/base.css'
import { LegalPage } from './LegalPage'
import type { LegalKey } from '../content/legal'

const root = document.getElementById('root')!
const page = (root.dataset.page ?? 'privacy') as LegalKey
const app = (
  <StrictMode>
    <LegalPage page={page} />
  </StrictMode>
)

// prerendered in production (tools/prerender.mjs), empty on the dev server
if (root.hasChildNodes()) hydrateRoot(root, app)
else createRoot(root).render(app)
