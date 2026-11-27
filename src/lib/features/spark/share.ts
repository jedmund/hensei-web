/**
 * Sharing a spark, from the page or a saved spark's dialog: its link, and the
 * image the server renders for it. Each takes the spark's query string
 * (writeSpark), so a saved spark shares itself rather than what's on the board.
 */

import { toast } from 'svelte-sonner'
import { m } from '$lib/paraglide/messages'
import { getLocale } from '$lib/paraglide/runtime'
import { copyShareImage, saveShareImage } from '$lib/utils/shareImage'

const FILENAME = 'spark.png'

const siteTheme = () => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark')

// Drawn in the viewer's theme, with the wordmark in their element
const imageUrl = (query: string, element?: string) =>
	`/download/spark?${query ? `${query}&` : ''}lang=${getLocale() === 'ja' ? 'ja' : 'en'}&theme=${siteTheme()}${element ? `&element=${element}` : ''}`

/** The page's address for a spark, which reopens it */
export const sparkLink = (query: string) =>
	`${window.location.origin}/spark${query ? `?${query}` : ''}`

export async function copySparkLink(query: string) {
	try {
		await navigator.clipboard.writeText(sparkLink(query))
		toast.success(m.toast_copied())
	} catch {
		toast.error(m.toast_copy_failed())
	}
}

/** Call straight from a click: Safari keeps the gesture only until the first await */
export function copySparkImage(query: string, element?: string) {
	copyShareImage(imageUrl(query, element), FILENAME)
		.then((outcome) =>
			toast.success(outcome === 'copied' ? m.toast_copied() : m.spark_image_saved())
		)
		.catch(() => toast.error(m.toast_copy_failed()))
}

export function saveSparkImage(query: string, element?: string) {
	saveShareImage(imageUrl(query, element), FILENAME)
		.then(() => toast.success(m.spark_image_saved()))
		.catch(() => toast.error(m.gacha_error()))
}

/** The system share sheet, where there is one (phones and tablets) */
export async function shareSpark(query: string, title: string) {
	try {
		await navigator.share({ title, url: sparkLink(query) })
	} catch (error) {
		// Closing the share sheet isn't an error
		if (error instanceof DOMException && error.name === 'AbortError') return
		toast.error(m.gacha_error())
	}
}

/** Touch-first devices get the share sheet; desktops copy instead */
export const canShareSheet = () =>
	typeof navigator.share === 'function' && window.matchMedia('(pointer: coarse)').matches
