import type { RequestHandler } from './$types'
import { BlockedUrlError, fetchPublicUrl } from '$lib/server/ssrfGuard'

// Serves link-preview images (the og:image found by /api/og) from our own
// origin, so the Content-Security-Policy's img-src can stay a short allow-list
// instead of allowing every host. Rate-limited per IP in the hooks.

const MAX_IMAGE_BYTES = 2 * 1024 * 1024

// Raster formats only. SVG can carry script, which must never be served from
// our own origin.
const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/avif'])

function error(status: number): Response {
	return new Response(null, { status })
}

export const GET: RequestHandler = async ({ url, request }) => {
	// Only our own pages should use this; other sites can't hotlink through it.
	if (request.headers.get('sec-fetch-site') === 'cross-site') return error(403)

	const target = url.searchParams.get('url')
	if (!target) return error(400)

	let parsed: URL
	try {
		parsed = new URL(target)
	} catch {
		return error(400)
	}
	if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return error(400)

	const controller = new AbortController()
	const timeout = setTimeout(() => controller.abort(), 5000)
	try {
		const res = await fetchPublicUrl(parsed.href, {
			signal: controller.signal,
			headers: { 'User-Agent': 'bot', Accept: 'image/*' }
		})
		if (!res.ok) return error(502)

		const contentType = (res.headers.get('content-type') ?? '').split(';')[0]?.trim().toLowerCase()
		if (!contentType || !ALLOWED_TYPES.has(contentType)) {
			await res.body?.cancel()
			return error(415)
		}

		const declaredLength = Number(res.headers.get('content-length'))
		if (declaredLength > MAX_IMAGE_BYTES) {
			await res.body?.cancel()
			return error(413)
		}

		const body = await readCapped(res, MAX_IMAGE_BYTES)
		if (!body) return error(413)

		return new Response(body, {
			headers: {
				'Content-Type': contentType,
				'Cache-Control': 'public, max-age=86400',
				'X-Content-Type-Options': 'nosniff',
				'Content-Security-Policy': "default-src 'none'; sandbox"
			}
		})
	} catch (err) {
		if (err instanceof BlockedUrlError) return error(400)
		return error(502)
	} finally {
		clearTimeout(timeout)
	}
}

/** Reads the body, or returns null once it passes `limit` bytes. */
async function readCapped(res: Response, limit: number): Promise<Uint8Array<ArrayBuffer> | null> {
	const reader = res.body?.getReader()
	if (!reader) return new Uint8Array(new ArrayBuffer(0))

	const chunks: Uint8Array[] = []
	let total = 0
	for (;;) {
		const { done, value } = await reader.read()
		if (done) break
		total += value.byteLength
		if (total > limit) {
			await reader.cancel()
			return null
		}
		chunks.push(value)
	}

	const body = new Uint8Array(new ArrayBuffer(total))
	let offset = 0
	for (const chunk of chunks) {
		body.set(chunk, offset)
		offset += chunk.byteLength
	}
	return body
}
