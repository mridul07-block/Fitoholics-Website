/**
 * prerender.mjs — fills every page's #root at build time, and writes the head.
 *
 * Runs after `vite build` (the client) and `vite build --ssr` (the server
 * entry, into dist/.ssr). It renders each page to a string with React and
 * puts the markup where the client will hydrate it, so the HTML is never
 * empty: the hero is the first paint, previews and crawlers see the copy,
 * and the legal pages are documents rather than scripts.
 *
 * It also writes what index.html cannot know statically: the site URL (for
 * the canonical link, og:url, the sitemap and robots.txt), the social card,
 * the structured data, and the first-paint ground under the film for both
 * orientations.
 *
 * Site URL resolution: SITE_URL, else Vercel's own VERCEL_PROJECT_PRODUCTION_URL.
 * Without either, the absolute-URL tags are omitted with a warning rather
 * than written wrong.
 *
 * Every replacement must match exactly once, or the build fails: a page that
 * silently shipped empty would defeat the point.
 */
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const DIST = path.join(ROOT, 'dist')
const SSR = path.join(DIST, '.ssr')

const fail = (msg) => {
  console.error(`[prerender] ${msg}`)
  process.exit(1)
}

const entryFile = existsSync(SSR) ? readdirSync(SSR).find((f) => /^entry-server.*\.js$/.test(f)) : null
if (!entryFile) fail('no server bundle in dist/.ssr — run `vite build --ssr src/entry-server.tsx --outDir dist/.ssr` first')
const mod = await import(pathToFileURL(path.join(SSR, entryFile)).href)

const rawUrl = process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '')
const siteUrl = rawUrl ? rawUrl.replace(/\/+$/, '') : null
if (!siteUrl) console.warn('[prerender] no SITE_URL or VERCEL_PROJECT_PRODUCTION_URL: canonical, og:url, og:image, sitemap skipped')

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** replace a pattern that must occur exactly once */
function replaceOnce(html, re, replacement, what) {
  const count = (html.match(new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g')) ?? []).length
  if (count !== 1) fail(`${what}: expected exactly one match, found ${count}`)
  return html.replace(re, () => replacement)
}

const read = (f) => readFileSync(path.join(DIST, f), 'utf8')
const write = (f, s) => writeFileSync(path.join(DIST, f), s)

// ---------------------------------------------------------------- index.html
{
  let html = read('index.html')
  const meta = mod.meta
  const body = mod.renderIndex()
  if (!body.includes('data-station')) fail('index: rendered markup has no stations')
  html = replaceOnce(html, /<div id="root"><\/div>/, `<div id="root">${body}</div>`, 'index #root')
  html = replaceOnce(html, /<title>[^<]*<\/title>/, `<title>${esc(meta.title)}</title>`, 'index title')
  html = replaceOnce(
    html,
    /<meta\s+name="description"\s+content="[^"]*"\s*\/>/,
    `<meta name="description" content="${esc(meta.description)}" />`,
    'index description',
  )

  const { lqip } = mod
  const head = [
    // the first-paint ground under the film, before the bundle can set it
    `<style>[data-film-host]{background-image:url("${lqip.landscape}")}@media (max-aspect-ratio:${Math.round(lqip.portraitMaxAspect * 100)}/100){[data-film-host]{background-image:url("${lqip.portrait}")}}</style>`,
    `<meta name="robots" content="index, follow" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${esc(meta.siteName)}" />`,
    `<meta property="og:title" content="${esc(meta.title)}" />`,
    `<meta property="og:description" content="${esc(meta.description)}" />`,
    `<meta property="og:locale" content="${esc(meta.locale)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(meta.title)}" />`,
    `<meta name="twitter:description" content="${esc(meta.description)}" />`,
  ]
  if (siteUrl) {
    head.push(
      `<link rel="canonical" href="${siteUrl}/" />`,
      `<meta property="og:url" content="${siteUrl}/" />`,
      `<meta property="og:image" content="${siteUrl}/og.jpg" />`,
      `<meta property="og:image:width" content="1200" />`,
      `<meta property="og:image:height" content="630" />`,
      `<meta property="og:image:alt" content="${esc(meta.ogImageAlt)}" />`,
      `<meta name="twitter:image" content="${siteUrl}/og.jpg" />`,
    )
  }
  for (const block of mod.jsonLd(siteUrl)) {
    head.push(`<script type="application/ld+json">${JSON.stringify(block).replace(/</g, '\\u003c')}</script>`)
  }
  html = replaceOnce(html, /<\/head>/, `    ${head.join('\n    ')}\n  </head>`, 'index head')
  write('index.html', html)
  console.log(`[prerender] index.html: ${(body.length / 1024).toFixed(1)} KB of markup, ${head.length} head tags`)
}

// ---------------------------------------------------------------- legal pages
for (const page of mod.legalPages) {
  const file = `${page.key}.html`
  let html = read(file)
  const body = mod.renderLegal(page.key)
  html = replaceOnce(
    html,
    new RegExp(`<div id="root" data-page="${page.key}"><\\/div>`),
    `<div id="root" data-page="${page.key}">${body}</div>`,
    `${file} #root`,
  )
  const extra = [`<meta name="robots" content="index, follow" />`]
  if (siteUrl) extra.push(`<link rel="canonical" href="${siteUrl}${page.path}" />`)
  html = replaceOnce(html, /<\/head>/, `    ${extra.join('\n    ')}\n  </head>`, `${file} head`)
  write(file, html)
  console.log(`[prerender] ${file}: ${(body.length / 1024).toFixed(1)} KB of markup`)
}

// ---------------------------------------------------------------- robots + sitemap
{
  const lines = ['User-agent: *', 'Allow: /']
  if (siteUrl) {
    lines.push(`Sitemap: ${siteUrl}/sitemap.xml`)
    const today = new Date().toISOString().slice(0, 10)
    const urls = ['/', ...mod.legalPages.map((p) => p.path)]
      .map((p) => `  <url><loc>${siteUrl}${p}</loc><lastmod>${today}</lastmod></url>`)
      .join('\n')
    write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`)
  }
  write('robots.txt', lines.join('\n') + '\n')
}

rmSync(SSR, { recursive: true, force: true })
console.log('[prerender] done')
