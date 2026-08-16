import { installRafAudit } from './dev/rafAudit'
import { installPerfTrace } from './dev/perfTrace'
installRafAudit()
installPerfTrace()

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tokens.css'
import './styles/fonts.css'
import './styles/reset.css'
import './styles/base.css'
import { assertFilmCoverage } from './film/beats'
import { App } from './App'

if (import.meta.env.DEV) assertFilmCoverage()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
