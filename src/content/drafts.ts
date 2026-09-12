/**
 * Draft content, and where it is allowed to show.
 *
 * Several rows in copy.ts are written to look finished so a section can be
 * judged as it will actually appear (a case study, a testimonial, a price),
 * but describe a client, a number or a term the client has not supplied. Each
 * carries `draft: true`. A visitor cannot tell a drafted row from a real one,
 * and an invented result on a real coaching business is a fake review, so
 * drafted rows are omitted from every build except the ones that exist to
 * look at unfinished work:
 *
 *   vite dev                       shown, with a visible tag
 *   VERCEL_ENV=preview             shown, with a visible tag
 *   SHOW_DRAFTS=1 at build time    shown, with a visible tag
 *   anything else, production      omitted; the section renders its real rows
 *                                  and, if there are none, its honest note
 *
 * tools/check-placeholders.mjs reports how many drafts remain on every build.
 * To finish a row: replace its content with what the client actually
 * supplied and delete the flag. Never keep a drafted value next to a real
 * name.
 */

/** decided at build time in vite.config.ts */
export const SHOW_DRAFTS: boolean = import.meta.env.DEV || __SHOW_DRAFTS__

/**
 * Any copy row. The flag is read structurally rather than typed, because the
 * deck is `as const` and a row without the flag has no `draft` property at
 * all, which a typed optional field would reject as having nothing in common.
 */
export const isDraft = (row: object): boolean => 'draft' in row && row.draft === true

/** the rows this build is allowed to render */
export function live<T extends object>(rows: readonly T[]): readonly T[] {
  return SHOW_DRAFTS ? rows : rows.filter((r) => !isDraft(r))
}

/** a single optional value, or nothing when it is a draft this build omits */
export function liveOne<T extends object>(row: T): T | null {
  return SHOW_DRAFTS || !isDraft(row) ? row : null
}
