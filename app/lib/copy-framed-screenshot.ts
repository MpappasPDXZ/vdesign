/**
 * Compose a viewport PNG with a simple header/footer and copy to the clipboard.
 * Source should already be chrome-free (WebGL / plan canvas only — not the HTML shell).
 */

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to decode screenshot'))
    img.src = dataUrl
  })
}

export type FramedScreenshotMeta = {
  header: string
  footer: string
}

/** Draw header + image + footer → PNG blob. */
export async function composeFramedScreenshot(
  sourceDataUrl: string,
  meta: FramedScreenshotMeta
): Promise<Blob> {
  const img = await loadImage(sourceDataUrl)
  const headerH = Math.max(44, Math.round(img.width * 0.035))
  const footerH = Math.max(36, Math.round(img.width * 0.028))
  const padX = Math.max(16, Math.round(img.width * 0.018))

  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height + headerH + footerH
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable')

  // Header
  ctx.fillStyle = '#0f172a'
  ctx.fillRect(0, 0, canvas.width, headerH)
  ctx.fillStyle = '#f8fafc'
  ctx.font = `600 ${Math.round(headerH * 0.42)}px ui-sans-serif, system-ui, sans-serif`
  ctx.textBaseline = 'middle'
  ctx.fillText(meta.header, padX, headerH / 2, canvas.width - padX * 2)

  // Viewport
  ctx.drawImage(img, 0, headerH)

  // Footer
  const footerY = headerH + img.height
  ctx.fillStyle = '#0f172a'
  ctx.fillRect(0, footerY, canvas.width, footerH)
  ctx.fillStyle = '#94a3b8'
  ctx.font = `500 ${Math.round(footerH * 0.4)}px ui-sans-serif, system-ui, sans-serif`
  ctx.fillText(meta.footer, padX, footerY + footerH / 2, canvas.width - padX * 2)

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/png')
  )
  if (!blob) throw new Error('PNG encode failed')
  return blob
}

/** Copy framed screenshot image to the system clipboard. */
export async function copyFramedScreenshotToClipboard(
  sourceDataUrl: string,
  meta: FramedScreenshotMeta
): Promise<void> {
  const blob = await composeFramedScreenshot(sourceDataUrl, meta)
  if (!navigator.clipboard || typeof ClipboardItem === 'undefined') {
    throw new Error('Clipboard API unavailable')
  }
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
}
