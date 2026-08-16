/**
 * check-placeholders.mjs — prebuild guard (§ Station 7 of docs/BUILD_PROMPT.md).
 *
 * Fails a PRODUCTION build while any "[" placeholder remains in testimonial data,
 * so a bracketed testimonial can never ship by accident. Development builds and
 * dev server are unaffected. Override for staging: ALLOW_PLACEHOLDERS=1.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const copyPath = path.resolve(__dirname, '..', 'src', 'content', 'copy.ts')

if (process.env.ALLOW_PLACEHOLDERS === '1') {
  console.warn('[check-placeholders] ALLOW_PLACEHOLDERS=1 — guard bypassed (staging only).')
  process.exit(0)
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
  console.error('\n[check-placeholders] Production build blocked. Placeholder values remain:\n')
  for (const o of offenders) console.error('  · ' + o)
  console.error(
    '\nReplace the bracketed values in src/content/copy.ts with real client data.' +
      '\n(Never invent testimonials — real values only. ALLOW_PLACEHOLDERS=1 bypasses for staging.)\n',
  )
  process.exit(1)
}
console.log('[check-placeholders] OK — no placeholders in guarded copy.')
