/**
 * Client side of the gacha simulator's share images: build the image URL for
 * a result link and copy the image to the clipboard.
 */

export interface GachaImageOptions {
	art: 'weapon' | 'character'
	currency: 'usd' | 'jpy' | 'crystals'
	lang: 'en' | 'ja'
}

/** Image URL for a result link's query string (settings plus seed). */
export function gachaImageUrl(query: string, opts: GachaImageOptions): string {
	const params = new URLSearchParams(query)
	params.set('art', opts.art)
	params.set('currency', opts.currency)
	params.set('lang', opts.lang)
	return `/download/gacha?${params.toString()}`
}

async function pngBlob(url: string): Promise<Blob> {
	const response = await fetch(url)
	if (!response.ok) throw new Error(`Image request failed (${response.status})`)
	const blob = await response.blob()
	return blob.type === 'image/png' ? blob : new Blob([blob], { type: 'image/png' })
}

function download(blob: Blob): void {
	const href = URL.createObjectURL(blob)
	const link = document.createElement('a')
	link.href = href
	link.download = 'gacha-result.png'
	document.body.append(link)
	link.click()
	link.remove()
	setTimeout(() => URL.revokeObjectURL(href), 0)
}

/**
 * Copy the result image to the clipboard, or download it where the browser
 * can't copy images. Call directly from a click handler: Safari only keeps
 * the user gesture if the ClipboardItem is created before anything is
 * awaited, so the fetch is handed to it as a promise.
 */
export async function copyResultImage(url: string): Promise<'copied' | 'downloaded'> {
	const image = pngBlob(url)
	if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
		try {
			await navigator.clipboard.write([new ClipboardItem({ 'image/png': image })])
			return 'copied'
		} catch {
			// Fall through to a download, unless the image itself failed
		}
	}
	download(await image)
	return 'downloaded'
}
