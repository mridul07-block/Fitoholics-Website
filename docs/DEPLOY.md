# Deploying to Vercel

## Why the first deploy failed

`npm run build` runs the placeholder guard before anything else, and the guard
exits 1 while `src/content/copy.ts` still contains bracketed values. Vercel runs
`npm run build`, gets exit 1, and fails the deployment. That was the guard doing
exactly what it was built to do — the original brief requires that a bracketed
testimonial can never reach production by accident.

The guard is environment aware instead of unconditional, and since the
audit release (2026-09) it distinguishes two kinds of unfinished value:

- **Literal placeholders** (`[CLIENT COUNT]`, `TBC`) render as themselves, so
  they block a production build.
- **Drafts** (rows flagged `draft: true`: case studies, testimonials, the
  client count, program length, consultation format, the app) are written to
  look finished. They never block a build because they never reach one:
  `src/content/drafts.ts` omits every drafted row from any build that is not
  the dev server, a Vercel preview, or `SHOW_DRAFTS=1`. Previews show them
  with a visible DRAFT tag. The guard reports how many remain.

| Environment | Literal placeholders | Drafts |
|---|---|---|
| `vite` dev server | build proceeds | shown, tagged |
| `VERCEL_ENV=preview` (branch and PR deploys) | warns, build succeeds | shown, tagged |
| `VERCEL_ENV=production` | **fails** | omitted |
| `VERCEL_ENV=production` + `ALLOW_PLACEHOLDERS=1` | warns, build succeeds | omitted |
| local `npm run build` | fails | omitted |

So production deploys need no environment variable at all. **If
`ALLOW_PLACEHOLDERS=1` is still set on the Vercel project from before, remove
it**, so the guard protects the live site again.

## To finish the content

`docs/CONTENT_REQUEST.md` lists what the client has to supply. As each item
arrives: replace the drafted row in `src/content/copy.ts` with the real
value and delete its `draft: true`, together. `node tools/check-placeholders.mjs`
counts what is left.

## What else was fixed

- **`vercel.json`** — pins framework, build command, output directory and
  `npm ci`. Adds `Cache-Control: public, max-age=31536000, immutable` for
  `/film/*`, `/fonts/*` and `/assets/*`. The film is 900 immutable files across
  three tiers; without this every visit refetches them.
- **`.vercelignore`** — the 15 MB source plate in `video frame/` is only ever
  read by the encoder, which never runs during a deploy. It was being uploaded
  on every deployment for nothing. Also excludes `tools/node_modules`, `dist`
  and `docs`.
- **`tsconfig.tsbuildinfo` untracked** — a committed incremental build cache
  carries absolute Windows paths and makes `tsc -b` behave unpredictably on
  Vercel's Linux builders.
- **`engines.node: >=20`** — pins the builder's Node major.
- **Frame zero preload fixed.** It was declared `as="image"` with an
  `imagesrcset`, but frames were fetched inside the frame worker. Preloads are
  document scoped, so a worker fetch can never consume one: frame zero was
  downloaded twice on every visit and Chrome warned about an unused preload on
  every load. Frame zero is now loaded on the main thread through an `Image`,
  which matches the preload, and the preload picks one tier by `media` instead
  of letting the browser guess from a srcset. One request, no warning.

## Checked before shipping

- all four build paths behave as tabled above
- `npm ci` resolves cleanly from the committed lockfile
- every relative import resolves case exact, so the Linux builder cannot fail
  on a casing difference that Windows tolerates
- the built artifact was served from `dist` and verified end to end: film
  renders, scroll scrubs, zero console errors
