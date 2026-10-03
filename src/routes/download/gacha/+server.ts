/**
 * Share image for a gacha simulator result: GET /download/gacha?<result link
 * query>&art=&currency=&lang=. Serves the link preview (og:image) and the
 * page's Copy image button. See $lib/server/gachaShareImage for the caching
 * and abuse limits.
 */

import { error } from '@sveltejs/kit'
import { clientIp } from '$lib/server/rateLimit'
import { storePrefetch } from '$lib/server/renderPrefetch'
import { getTemplate } from '$lib/server/renderRegistry'
import { RenderBusyError, renderToImage } from '$lib/server/renderService'
import {
	checkSignature,
	parseImageRequest,
	readCachedImage,
	runShare,
	signedLimiter,
	SimulationError,
	TEMPLATE_ID,
	unsignedLimiter,
	writeCachedImage
} from '$lib/server/gachaShareImage'
import type { GachaRenderData } from '$lib/types/gacha'
import type { RequestHandler } from './$types'

function png(image: Buffer, cacheControl: string): Response {
	return new Response(new Uint8Array(image), {
		headers: {
			'Content-Type': 'image/png',
			'Content-Length': String(image.length),
			'Content-Disposition': 'inline; filename="gacha-result.png"',
			'Cache-Control': cacheControl,
			'X-Content-Type-Options': 'nosniff'
		}
	})
}

function tooManyRequests(retryAfter = '60'): Response {
	return new Response(JSON.stringify({ error: 'Too many requests. Please try again later.' }), {
		status: 429,
		headers: { 'Content-Type': 'application/json', 'Retry-After': retryAfter }
	})
}

// Rendered results are deterministic for a seed, but the pool data behind
// them can change, so cached images expire after a day.
const HIT_CACHE_CONTROL = 'public, max-age=86400'

export const GET: RequestHandler = async ({ url, request, fetch }) => {
	const imageRequest = parseImageRequest(url.searchParams)
	if (!imageRequest) throw error(400, 'A result link with a seed is required')

	const signature = checkSignature(url.searchParams, imageRequest)
	if (signature === 'invalid') throw error(403, 'Invalid signature')

	const cached = await readCachedImage(imageRequest.cacheKey)
	if (cached) return png(cached, HIT_CACHE_CONTROL)

	// Only cache misses cost a simulation and a render, so only they count
	const ip = clientIp(request)
	const limiter = signature === 'signed' ? signedLimiter : unsignedLimiter
	if (ip && !limiter.hit(`gacha-image:${signature}:${ip}`)) return tooManyRequests()

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
		simplePortraits: imageRequest.simplePortraits,
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

	await writeCachedImage(imageRequest.cacheKey, image)
	return png(image, HIT_CACHE_CONTROL)
}
