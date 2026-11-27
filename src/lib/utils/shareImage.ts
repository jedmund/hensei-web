/**
 * Client side of the share images (gacha results, sparks): copy one to the
 * clipboard, or save it as a file.
 */

async function pngBlob(url: string): Promise<Blob> {
	// Revalidate: the image for a link can change (a new render, another theme),
	// and a copy or save should get the current one, not the browser's cached copy
	const response = await fetch(url, { cache: 'no-cache' })
	if (!response.ok) throw new Error(`Image request failed (${response.status})`)
	const blob = await response.blob()
	return blob.type === 'image/png' ? blob : new Blob([blob], { type: 'image/png' })
}

function download(blob: Blob, filename: string): void {
	const href = URL.createObjectURL(blob)
	const link = document.createElement('a')
	link.href = href
	link.download = filename
	document.body.append(link)
	link.click()
	link.remove()
	setTimeout(() => URL.revokeObjectURL(href), 0)
}

/**
 * Copy the image to the clipboard, or download it where the browser can't
 * copy images. Call directly from a click handler: Safari only keeps the user
 * gesture if the ClipboardItem is created before anything is awaited, so the
 * fetch is handed to it as a promise.
 */
export async function copyShareImage(
	url: string,
	filename: string
): Promise<'copied' | 'downloaded'> {
	const image = pngBlob(url)
	if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
		try {
			await navigator.clipboard.write([new ClipboardItem({ 'image/png': image })])
			return 'copied'
		} catch {
			// Fall through to a download, unless the image itself failed
		}
	}
	download(await image, filename)
	return 'downloaded'
}

/** Save the image as a file */
export async function saveShareImage(url: string, filename: string): Promise<void> {
	download(await pngBlob(url), filename)
}
