import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Vercel serves /privacy from privacy.html (vercel.json cleanUrls). The dev
 * and preview servers do not, so the same links would 404 locally; this
 * mirrors the rewrite for the legal pages only.
 */
const LEGAL_PAGES = ['privacy', 'terms', 'refunds']
const cleanUrls = (): Plugin => {
  // typed loosely on purpose: the request type needs @types/node, which the
  // app does not otherwise carry
  const rewrite = (req: unknown, next: () => void) => {
    const r = req as { url?: string }
    const m = r.url?.match(/^\/([a-z]+)\/?(\?.*)?$/)
    if (m && LEGAL_PAGES.includes(m[1]!)) r.url = `/${m[1]}.html${m[2] ?? ''}`
    next()
  }
  return {
    name: 'legal-clean-urls',
    configureServer: (server) => {
      server.middlewares.use((req, _res, next) => rewrite(req, next))
    },
    configurePreviewServer: (server) => {
      server.middlewares.use((req, _res, next) => rewrite(req, next))
    },
  }
}

/**
 * Drafted copy (rows flagged `draft: true` in src/content/copy.ts) renders
 * only where unfinished work is meant to be looked at: the dev server, Vercel
 * preview deploys, or a build run with SHOW_DRAFTS=1. Production omits it.
 * See src/content/drafts.ts.
 */
// read without @types/node: this file is type checked with the app's config
const env: Record<string, string | undefined> =
  (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {}
const vercelEnv = env.VERCEL_ENV ?? ''
const showDrafts = vercelEnv === 'preview' || vercelEnv === 'development' || env.SHOW_DRAFTS === '1'

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [react(), cleanUrls()],
  assetsInclude: ['**/*.glsl'],
  define: {
    __SHOW_DRAFTS__: JSON.stringify(showDrafts),
  },
  // The server build (tools/prerender.mjs) renders the same components in
  // Node. gsap and lenis ship ESM without package exports Node can resolve
  // as modules, so they are bundled into it rather than imported at run time.
  ssr: {
    noExternal: ['gsap', 'lenis'],
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    // the legal documents are their own pages: no film, no motion, one column.
    // The server build takes its single entry from the command line instead.
    rollupOptions: isSsrBuild
      ? undefined
      : {
          input: {
            main: 'index.html',
            privacy: 'privacy.html',
            terms: 'terms.html',
            refunds: 'refunds.html',
          },
        },
  },
}))
