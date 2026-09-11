import { installRafAudit } from './dev/rafAudit'
import { installPerfTrace } from './dev/perfTrace'
import { installScrubTrace } from './dev/scrubTrace'
installRafAudit()
installPerfTrace()
installScrubTrace()

import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './styles/tokens.css'
import './styles/fonts.css'
import './styles/reset.css'
import './styles/base.css'
import { assertFilmCoverage } from './film/beats'
import { App } from './App'

if (import.meta.env.DEV) assertFilmCoverage()

const root = document.getElementById('root')!
const app = (
  <StrictMode>
    <App />
  </StrictMode>
)

// Production HTML arrives prerendered (tools/prerender.mjs), so the page is
// on screen before this runs and React only has to attach to it. The dev
// server serves an empty root and renders from scratch.
if (root.hasChildNodes()) hydrateRoot(root, app)
else createRoot(root).render(app)
