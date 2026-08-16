/**
 * Frame fetch + decode, off the main thread (§7.3).
 * ImageBitmap is transferable — decode happens here, the bitmap moves to the
 * main thread zero copy. Decode options keep texImage2D on the GPU fast path.
 */

interface FetchMsg {
  type: 'fetch'
  index: number
  url: string
}

interface DoneMsg {
  type: 'done'
  index: number
  bitmap: ImageBitmap
  bytes: number
}

interface FailMsg {
  type: 'fail'
  index: number
  error: string
}

self.onmessage = async (e: MessageEvent<FetchMsg>) => {
  const { index, url } = e.data
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const blob = await res.blob()
    const bitmap = await createImageBitmap(blob, {
      imageOrientation: 'none',
      premultiplyAlpha: 'none',
      colorSpaceConversion: 'none',
    })
    const msg: DoneMsg = { type: 'done', index, bitmap, bytes: bitmap.width * bitmap.height * 4 }
    ;(self as unknown as Worker).postMessage(msg, [bitmap])
  } catch (err) {
    const msg: FailMsg = { type: 'fail', index, error: String(err) }
    ;(self as unknown as Worker).postMessage(msg)
  }
}
