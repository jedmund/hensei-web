/**
 * Spark maker image: GET /download/spark?<spark link query>&lang=. Serves the
 * link preview (og:image) and the page's Copy image and Save image buttons.
 * See $lib/server/shareImage for the caching and abuse limits.
 */

import { error } from '@sveltejs/kit'
import { UNIDENTIFIED_CLIENT, clientIp } from '$lib/server/rateLimit'
import { storePrefetch } from '$lib/server/renderPrefetch'
import { getTemplate } from '$lib/server/renderRegistry'
import { RenderBusyError, renderToImage } from '$lib/server/renderService'
import { pngResponse, tooManyRequests } from '$lib/server/shareImage'
import {
	CatalogueError,
	parseSparkImageRequest,
	resolveSparkImage,
	shareImage,
	TEMPLATE_ID
} from '$lib/server/sparkImage'
import type { RequestHandler } from './$types'

const FILENAME = 'spark.png'
// A spark always draws the same, but the catalogue's art and names behind it
// can change, so cached images expire after a day
const HIT_CACHE_CONTROL = 'public, max-age=86400'

export const GET: RequestHandler = async ({ url, request, fetch }) => {
	const imageRequest = parseSparkImageRequest(url.searchParams)
	if (!imageRequest) throw error(400, 'A spark with at least one item is required')

	const signature = shareImage.checkSignature(url.searchParams, imageRequest.canonical)
	if (signature === 'invalid') throw error(403, 'Invalid signature')

	const cached = await shareImage.cache.read(imageRequest.cacheKey)
	if (cached) return pngResponse(cached, FILENAME, HIT_CACHE_CONTROL)

	// Only cache misses cost a render, so only they count
	const identity = clientIp(request) ?? UNIDENTIFIED_CLIENT
	const limiter = signature === 'signed' ? shareImage.signedLimiter : shareImage.unsignedLimiter
	if (!limiter.hit(`spark-image:${signature}:${identity}`)) return tooManyRequests()

	let data
	try {
		data = await resolveSparkImage(fetch, imageRequest.spark)
	} catch (err) {
		if (err instanceof CatalogueError) {
			if (err.status === 429) return tooManyRequests(err.retryAfter)
			throw error(err.status, err.message)
		}
		throw err
	}

	const template = getTemplate(TEMPLATE_ID)
	if (!template) throw error(500, 'Render template missing')
	const prefetch = storePrefetch(data)

	let image: Buffer
	try {
		image = await renderToImage({
			path: template.internalPath({ prefetch, locale: imageRequest.locale }),
			viewport: template.viewport,
			format: 'png'
		})
	} catch (err) {
		if (err instanceof RenderBusyError) {
			return new Response(null, { status: 503, headers: { 'Retry-After': '10' } })
		}
		throw err
	}

	await shareImage.cache.write(imageRequest.cacheKey, image)
	return pngResponse(image, FILENAME, HIT_CACHE_CONTROL)
}
