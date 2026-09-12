/**
 * check-placeholders.mjs — prebuild guard over src/content/copy.ts.
 *
 * Two kinds of unfinished value live in the copy deck, and they are handled
 * differently because they fail differently.
 *
 * 1. Literal placeholders: a bracketed "[CLIENT COUNT]", or TBC / TBD. These
 *    render as themselves, which announces unfinished work to every visitor,
 *    so a production build is BLOCKED while any remains.
 *
 * 2. Drafts: rows flagged `draft: true`. These are written to look finished
 *    so a section can be judged as it will actually appear, and nothing about
 *    them warns a visitor that the client, number or term is invented. They
 *    are not blocked, because they cannot ship: src/content/drafts.ts omits
 *    every drafted row from any build that is not a dev server, a Vercel
 *    preview, or an explicit SHOW_DRAFTS=1. This guard reports how many
 *    remain so nobody forgets they exist.
 *
 * Resolution order for literal placeholders:
 *   ALLOW_PLACEHOLDERS=1   warn, never fail (explicit escape hatch)
 *   VERCEL_ENV=preview     warn, never fail (branch and PR deploys)
 *   VERCEL_ENV=production  fail
 *   anything else          fail (local `npm run build`, other CI)
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
/** every content deck: the page copy and the legal documents */
const decks = ['copy.ts', 'legal.ts'].map((f) => path.resolve(__dirname, '..', 'src', 'content', f))

const allow = process.env.ALLOW_PLACEHOLDERS === '1'
const vercelEnv = process.env.VERCEL_ENV ?? ''
const previewDeploy = vercelEnv === 'preview' || vercelEnv === 'development'
const warnOnly = allow || previewDeploy
const showDrafts = previewDeploy || process.env.SHOW_DRAFTS === '1'

if (allow) {
  console.warn('[check-placeholders] ALLOW_PLACEHOLDERS=1 — guard downgraded to a warning.')
} else if (previewDeploy) {
  console.warn(`[check-placeholders] VERCEL_ENV=${vercelEnv} — guard downgraded to a warning.`)
}

/** comments stripped first: a comment may legitimately mention a bracket or TBC */
const src = decks
  .map((p) => readFileSync(p, 'utf8'))
  .join('\n')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '')

/** only string literals */
const literals = [...src.matchAll(/'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g)].map(
  (m) => m[1] ?? m[2] ?? m[3] ?? '',
)

const offenders = new Set()
for (const text of literals) {
  for (const b of text.match(/\[[A-Z][A-Z0-9 ]*\d?\]/g) ?? []) offenders.add(b)
  for (const t of text.match(/\bTB[CD]\b/g) ?? []) offenders.add(t)
}

const drafts = (src.match(/draft:\s*true/g) ?? []).length

if (drafts) {
  console.warn(
    `[check-placeholders] ${drafts} drafted row${drafts === 1 ? '' : 's'} remain in the content decks` +
      (showDrafts
        ? ' — this build SHOWS them, tagged, because it is a preview.'
        : ' — omitted from this build (drafts render on previews only).'),
  )
}

if (offenders.size) {
  const log = warnOnly ? console.warn : console.error
  log(
    warnOnly
      ? '\n[check-placeholders] Literal placeholders remain (allowed for this build):\n'
      : '\n[check-placeholders] Production build blocked. Literal placeholders remain:\n',
  )
  for (const o of offenders) log('  · ' + o)
  log(
    '\nReplace them in src/content with real client data, or flag the' +
      '\nrow `draft: true` so it is omitted from production instead of rendered.' +
      '\n(Never invent testimonials, results or numbers as real values.)' +
      (warnOnly ? '\n' : '\nTo deploy anyway, set ALLOW_PLACEHOLDERS=1 in the environment.\n'),
  )
  if (!warnOnly) process.exit(1)
  process.exit(0)
}
console.log('[check-placeholders] OK — no literal placeholders in the content decks.')
