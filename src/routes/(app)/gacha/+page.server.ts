import { getLocale } from '$lib/paraglide/runtime'
import { parseImageRequest, signedImageUrl } from '$lib/server/gachaShareImage'
import type { PageServerLoad } from './$types'

/**
 * Result links (those with a seed) get a preview image of their result, so
 * pasting one into Discord or Twitter shows what was drawn.
 */
export const load: PageServerLoad = ({ url }) => {
	const params = new URLSearchParams(url.searchParams)
	params.set('lang', getLocale() === 'ja' ? 'ja' : 'en')
	const request = parseImageRequest(params)
	return { ogImage: request ? signedImageUrl(url.origin, request) : null }
}
