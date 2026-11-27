import { getLocale } from '$lib/paraglide/runtime'
import { parseSparkImageRequest, shareImage } from '$lib/server/sparkImage'
import type { PageServerLoad } from './$types'

/**
 * Spark links get a preview image of the spark, so pasting one into Discord
 * or Twitter shows it.
 */
export const load: PageServerLoad = ({ url }) => {
	const params = new URLSearchParams(url.searchParams)
	params.set('lang', getLocale() === 'ja' ? 'ja' : 'en')
	const request = parseSparkImageRequest(params)
	return { ogImage: request ? shareImage.signedUrl(url.origin, request.canonical) : null }
}
