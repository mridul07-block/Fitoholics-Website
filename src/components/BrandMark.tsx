/**
 * The brand lockup: the full logo, stated once in the footer.
 *
 * The persistent maker's mark used to live here too, fixed to the corner
 * opposite the measure rail. The masthead owns that corner now and carries the
 * mark inside itself (components/Nav.tsx), so a second fixed mark would have
 * been the same statement made twice, overlapping.
 *
 * A plain `img` with explicit dimensions so it cannot shift layout, and
 * `alt`-texted because it is the only place the company is named in an image
 * rather than in copy.
 */
import s from './BrandMark.module.css'

const BRAND = 'Fitoholix'

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
