# Analytics

The site loads no analytics unless asked to. Two build time variables turn it
on (`.env.example`, `docs/DEPLOY.md`): `VITE_GA4_ID` for Google Analytics 4
and `VITE_META_PIXEL_ID` for the Meta Pixel. Either, both, or neither. Both
vendors load after the window load event, in idle time, so they never compete
with the film for the connection.

The implementation is `src/analytics/track.ts`. It is wired once, by
delegation, so nothing in a component knows analytics exist: a WhatsApp link
is measured because it is a WhatsApp link, not because someone remembered to
add a handler.

## Events

| Event | Parameters | Fires |
|---|---|---|
| `cta_whatsapp_click` | `placement`: `nav`, `menu`, `hero`, `close`, `footer`, or the station key | **The conversion.** Any link to `wa.me`, once per click. Sent to Meta as the standard `Contact` event, so it can be optimised for. |
| `section_view` | `key`: the station key, or `faq` | A station's band crosses the middle of the viewport. Once per station per page view. |
| `scroll_depth` | `percent`: 25, 50, 75, 100 | Once each. |
| `case_view` | `name`: the case caption | A case study is half on screen. Once each. |
| `faq_open` | `question` | A question in the trust block is opened. |
| `video_play` | `title` | A client clip is started. |

GA4 also records its automatic `page_view`; Meta its `PageView`.

## Setting up the conversion

**GA4.** Admin → Events → mark `cta_whatsapp_click` as a key event. In
reports, `placement` is available as a custom dimension once registered under
Admin → Custom definitions (event scoped, parameter `placement`).

**Meta.** The Pixel sends the standard `Contact` event for the same click, with
`placement` as a custom parameter. Use `Contact` as the conversion in Ads
Manager. The other events arrive as custom events under their own names.

## Verifying

Build with the IDs set (or run `vite dev` with a `.env.local`), open the page,
and:

- GA4: Admin → DebugView shows events live in DebugView mode; the browser's
  Network panel shows one `collect` request per event.
- Meta: the Meta Pixel Helper extension lists `PageView` and `Contact`.
- With neither variable set: the Network panel shows no request to
  `googletagmanager.com` or `connect.facebook.net`, and `window.gtag` and
  `window.fbq` are undefined.

Each WhatsApp click must produce exactly one `cta_whatsapp_click`; the
handler is a single delegated listener, so a second one can only come from
loading the tag twice (a tag manager container that also loads GA, say).

## The notice

When analytics are configured, one dismissible line appears at the foot of
the viewport (`src/components/Notice.tsx`) linking to the privacy page. It
gates nothing: the audience is in India, where disclosure is the bar, and the
privacy page (`src/content/legal.ts`) states what is collected and how to
refuse cookies in the browser.
