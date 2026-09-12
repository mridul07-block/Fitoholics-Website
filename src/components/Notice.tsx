/**
 * One line at the foot of the viewport saying that analytics are on, with
 * the privacy page a tap away. Shown only on builds where analytics exist
 * (analytics/track.ts), only until dismissed, and it gates nothing: the
 * audience is in India, where disclosure rather than consent is the bar, and
 * the privacy page says exactly what is collected.
 *
 * Renders nothing on the server and on first paint, so the prerendered
 * markup and the hydrated tree agree; the line appears after mount.
 */
import { useEffect, useState } from 'react'
import { COPY } from '../content/copy'
import { analyticsEnabled } from '../analytics/track'
import s from './Notice.module.css'

const KEY = 'fitoholix:notice:v1'

export function Notice() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!analyticsEnabled) return
    try {
      if (localStorage.getItem(KEY) !== '1') setShow(true)
    } catch {
      setShow(true)
    }
  }, [])

  if (!show) return null
  const c = COPY.chrome.notice

  const dismiss = () => {
    try {
      localStorage.setItem(KEY, '1')
    } catch {
      // storage refused: the line simply returns next visit
    }
    setShow(false)
  }

  return (
    <div className={s.notice} role="status">
      <span className={s.text}>
        {c.text}{' '}
        <a className={s.link} href="/privacy">
          {c.link}
        </a>
      </span>
      <button type="button" className={s.dismiss} onClick={dismiss}>
        {c.dismiss}
      </button>
    </div>
  )
}
