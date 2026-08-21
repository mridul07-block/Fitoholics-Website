/**
 * The brand, in the two places it belongs.
 *
 * `BrandMark` is the persistent maker's mark, fixed to the corner opposite the
 * measure rail. `BrandLockup` is the full logo, stated once in the footer.
 *
 * Both are plain `img` with explicit dimensions so neither can shift layout,
 * and both are decorative-with-a-name: the mark links home and carries a label,
 * the lockup is `alt`-texted because it is the only place the company is named
 * in an image rather than in copy.
 */
import s from './BrandMark.module.css'

const BRAND = 'Fitoholix'

export function BrandMark() {
  return (
    <a className={s.mark} href="#top" aria-label={`${BRAND} — back to top`}>
      <img src="/brand/mark-sm.webp" alt="" width={34} height={31} decoding="async" />
    </a>
  )
}

export function BrandLockup() {
  return (
    <div className={s.lockup}>
      <img
        src="/brand/lockup.webp"
        alt={`${BRAND} — fit for life`}
        width={720}
        height={214}
        loading="lazy"
        decoding="async"
      />
    </div>
  )
}
