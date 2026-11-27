/**
 * Share images rebuilt on demand from a link: gacha results and sparks.
 *
 * A link carries everything the image needs, so anyone can mint new ones,
 * and every distinct link could mean a fresh Playwright render. Three things
 * keep that in check:
 * - renders are cached by a hash of the request's canonical query (S3 when
 *   RENDER_S3_BUCKET is set, otherwise a small in-memory cache);
 * - cache misses are rate-limited per IP, more loosely for signed URLs (the
 *   og:image our pages emit for crawlers) than unsigned ones (the pages'
 *   Copy image buttons);
 * - renderService caps concurrent renders globally.
 *
 * Each image type makes one of these with createShareImage and keeps its own
 * parsing and data building.
 */

import { env } from '$env/dynamic/private'
import { getCachedRender, putRender } from '$lib/server/renderCache'
import { createRateLimiter } from '$lib/server/rateLimit'
import { s3KeyFor, TEMPLATES, type RenderTemplateId } from '$lib/server/renderRegistry'
import {
	appendRenderSignature,
	extractRenderSignature,
	verifyRenderRequest
} from '$lib/server/renderSigning'

const MEMORY_MAX_ENTRIES = 50
const MEMORY_MAX_BYTES = 64 * 1024 * 1024
const MINUTE = 60_000

export type SignatureCheck = 'signed' | 'unsigned' | 'invalid'

export interface ShareImageCache {
	read(cacheKey: string): Promise<Buffer | null>
	write(cacheKey: string, image: Buffer): Promise<void>
	/** Test-only: empty the in-memory cache */
	reset(): void
}

function createCache(templateId: RenderTemplateId, renderVersion: number): ShareImageCache {
	const memory = new Map<string, Buffer>()
	let memoryBytes = 0
	const label = `[shareImage:${templateId}]`
	const s3Key = (cacheKey: string) => s3KeyFor(TEMPLATES[templateId], cacheKey, renderVersion)

	return {
		async read(cacheKey) {
			if (env.RENDER_S3_BUCKET) {
				try {
					return await getCachedRender(s3Key(cacheKey))
				} catch (err) {
					console.error(`${label} S3 cache read failed:`, err)
					return null
				}
			}
			const hit = memory.get(cacheKey)
			if (!hit) return null
			// Refresh recency
			memory.delete(cacheKey)
			memory.set(cacheKey, hit)
			return hit
		},

		async write(cacheKey, image) {
			if (env.RENDER_S3_BUCKET) {
				try {
					await putRender(s3Key(cacheKey), image)
				} catch (err) {
					console.error(`${label} S3 cache write failed:`, err)
				}
				return
			}
			if (image.length > MEMORY_MAX_BYTES) return
			const existing = memory.get(cacheKey)
			if (existing) {
				memoryBytes -= existing.length
				memory.delete(cacheKey)
			}
			memory.set(cacheKey, image)
			memoryBytes += image.length
			for (const [key, value] of memory) {
				if (memory.size <= MEMORY_MAX_ENTRIES && memoryBytes <= MEMORY_MAX_BYTES) break
				memory.delete(key)
				memoryBytes -= value.length
			}
		},

		reset() {
			memory.clear()
			memoryBytes = 0
		}
	}
}

export interface ShareImageOptions {
	templateId: RenderTemplateId
	/** Bump to invalidate every cached image and signature of this type */
	renderVersion: number
	/** The public image endpoint, e.g. `/download/gacha` */
	downloadPath: string
}

export function createShareImage({ templateId, renderVersion, downloadPath }: ShareImageOptions) {
	return {
		templateId,
		cache: createCache(templateId, renderVersion),

		/**
		 * Absolute, signed image URL for a canonical query, for an og:image.
		 * Signing is skipped when RENDER_HMAC_SECRET isn't configured (local
		 * development).
		 */
		signedUrl(origin: string, canonical: string): string {
			const url = new URL(`${downloadPath}?${canonical}`, origin)
			if (!env.RENDER_HMAC_SECRET) return url.toString()
			return appendRenderSignature(url, templateId, { query: canonical }, renderVersion).toString()
		},

		/**
		 * Signed URLs come from our own pages (the og:image), unsigned ones from
		 * the Copy image buttons. Both are allowed; a present but wrong signature
		 * is not.
		 */
		checkSignature(params: URLSearchParams, canonical: string): SignatureCheck {
			const { signature, version } = extractRenderSignature(params)
			if (!signature) return 'unsigned'
			if (!env.RENDER_HMAC_SECRET || version !== String(renderVersion)) return 'invalid'
			return verifyRenderRequest(templateId, { query: canonical }, renderVersion, signature)
				? 'signed'
				: 'invalid'
		},

		// Cache misses per IP per minute. Crawlers (Discord, Twitter, Slack)
		// fetch once per unfurl, so the signed allowance is generous; unsigned
		// requests come from people pressing Copy image.
		signedLimiter: createRateLimiter({ limit: 30, windowMs: MINUTE }),
		unsignedLimiter: createRateLimiter({ limit: 10, windowMs: MINUTE })
	}
}

export function pngResponse(image: Buffer, filename: string, cacheControl: string): Response {
	return new Response(new Uint8Array(image), {
		headers: {
			'Content-Type': 'image/png',
			'Content-Length': String(image.length),
			'Content-Disposition': `inline; filename="${filename}"`,
			'Cache-Control': cacheControl,
			'X-Content-Type-Options': 'nosniff'
		}
	})
}

export function tooManyRequests(retryAfter = '60'): Response {
	return new Response(JSON.stringify({ error: 'Too many requests. Please try again later.' }), {
		status: 429,
		headers: { 'Content-Type': 'application/json', 'Retry-After': retryAfter }
	})
}
