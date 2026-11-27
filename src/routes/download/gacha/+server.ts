/**
 * Share image for a gacha simulator result: GET /download/gacha?<result link
 * query>&art=&currency=&lang=. Serves the link preview (og:image) and the
 * page's Copy image button. See $lib/server/shareImage for the caching
 * and abuse limits.
 */

import { error } from '@sveltejs/kit'
import { UNIDENTIFIED_CLIENT, clientIp } from '$lib/server/rateLimit'
import { storePrefetch } from '$lib/server/renderPrefetch'
import { getTemplate } from '$lib/server/renderRegistry'
import { RenderBusyError, renderToImage } from '$lib/server/renderService'
import {
	parseImageRequest,
	runShare,
	shareImage,
	SimulationError,
	TEMPLATE_ID
} from '$lib/server/gachaShareImage'
import { pngResponse, tooManyRequests } from '$lib/server/shareImage'
import type { GachaRenderData } from '$lib/types/gacha'
import type { RequestHandler } from './$types'

// Rendered results are deterministic for a seed, but the pool data behind
// them can change, so cached images expire after a day.
const FILENAME = 'gacha-result.png'
const HIT_CACHE_CONTROL = 'public, max-age=86400'

export const GET: RequestHandler = async ({ url, request, fetch }) => {
	const imageRequest = parseImageRequest(url.searchParams)
	if (!imageRequest) throw error(400, 'A result link with a seed is required')

	const signature = shareImage.checkSignature(url.searchParams, imageRequest.canonical)
	if (signature === 'invalid') throw error(403, 'Invalid signature')

	const cached = await shareImage.cache.read(imageRequest.cacheKey)
	if (cached) return pngResponse(cached, FILENAME, HIT_CACHE_CONTROL)

	// Only cache misses cost a simulation and a render, so only they count
	const identity = clientIp(request) ?? UNIDENTIFIED_CLIENT
	const limiter = signature === 'signed' ? shareImage.signedLimiter : shareImage.unsignedLimiter
	if (!limiter.hit(`gacha-image:${signature}:${identity}`)) return tooManyRequests()

	let simulation
	try {
		simulation = await runShare(fetch, imageRequest.share)
	} catch (err) {
		if (err instanceof SimulationError) {
			if (err.status === 429) return tooManyRequests(err.retryAfter)
			throw error(err.status, err.message)
		}
		throw err
	}

	const template = getTemplate(TEMPLATE_ID)
	if (!template) throw error(500, 'Render template missing')

	const data: GachaRenderData = {
		result: simulation.result,
		operation: imageRequest.share.operation,
		currency: imageRequest.currency,
		art: imageRequest.art,
		...(simulation.target ? { target: simulation.target } : {})
	}
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
