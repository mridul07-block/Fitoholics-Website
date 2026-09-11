import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

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

export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.glsl'],
  define: {
    __SHOW_DRAFTS__: JSON.stringify(showDrafts),
  },
  build: {
    target: 'es2020',
    sourcemap: false,
  },
})
