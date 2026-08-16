/**
 * check-placeholders.mjs — prebuild guard (§ Station 7 of docs/BUILD_PROMPT.md).
 *
 * Blocks a PRODUCTION build while any "[" placeholder remains in testimonial
 * data, so a bracketed testimonial can never ship to the live site by accident.
 *
 * Preview and staging deploys are a different case: the point of a preview is
 * to look at work in progress, and a visible "[TESTIMONIAL 1 QUOTE]" is honest
 * about being unfinished in a way an invented quote never would be. So the
 * guard warns there instead of failing, and only hard fails for production.
 *
 * Resolution order:
 *   ALLOW_PLACEHOLDERS=1   warn, never fail (explicit escape hatch)
 *   VERCEL_ENV=preview     warn, never fail (branch and PR deploys)
 *   VERCEL_ENV=production  fail
 *   anything else          fail (local `npm run build`, other CI)
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const copyPath = path.resolve(__dirname, '..', 'src', 'content', 'copy.ts')

const allow = process.env.ALLOW_PLACEHOLDERS === '1'
const vercelEnv = process.env.VERCEL_ENV ?? ''
const previewDeploy = vercelEnv === 'preview' || vercelEnv === 'development'
const warnOnly = allow || previewDeploy

if (allow) {
  console.warn('[check-placeholders] ALLOW_PLACEHOLDERS=1 — guard downgraded to a warning.')
} else if (previewDeploy) {
  console.warn(`[check-placeholders] VERCEL_ENV=${vercelEnv} — guard downgraded to a warning.`)
}

const src = readFileSync(copyPath, 'utf8')

// Extract the testimonials block and the contact fields, the guarded regions.
const guarded = [
  ['testimonials', /testimonials:\s*\[[\s\S]*?\n\s*\]/],
  ['footer contacts', /contact:\s*\{[\s\S]*?\}/],
  ['clientCount stat', /clientCount:\s*'[^']*'/],
]

const offenders = []
for (const [label, re] of guarded) {
  const m = src.match(re)
  if (!m) {
    offenders.push(`${label}: guarded region not found in copy.ts (guard out of date)`)
    continue
  }
  // find bracketed placeholders inside the region
  const brackets = m[0].match(/\[[A-Z][A-Z0-9 ]*\d?\]/g)
  if (brackets) offenders.push(`${label}: ${[...new Set(brackets)].join(', ')}`)
}

if (offenders.length) {
  const log = warnOnly ? console.warn : console.error
  log(
    warnOnly
      ? '\n[check-placeholders] Placeholder values remain (allowed for this build):\n'
      : '\n[check-placeholders] Production build blocked. Placeholder values remain:\n',
  )
  for (const o of offenders) log('  · ' + o)
  log(
    '\nReplace the bracketed values in src/content/copy.ts with real client data.' +
      '\n(Never invent testimonials — real values only.)' +
      (warnOnly
        ? '\n'
        : '\nTo deploy anyway, set ALLOW_PLACEHOLDERS=1 in the environment.\n'),
  )
  if (!warnOnly) process.exit(1)
  process.exit(0)
}
console.log('[check-placeholders] OK — no placeholders in guarded copy.')
