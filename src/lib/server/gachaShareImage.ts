/**
 * Server side of the gacha simulator's share images.
 *
 * A result link carries the settings and seed (see gachaShare.ts), so the
 * image for it can be rebuilt on demand: resolve the link against the
 * catalogue, re-run the simulation through the API, and screenshot the
 * internal `_render/gacha/result` route.
 *
 * Anyone can mint new links, so every distinct link could mean a fresh
 * Playwright render. Three things keep that in check:
 * - renders are cached by a hash of the canonical query (S3 when
 *   RENDER_S3_BUCKET is set, otherwise a small in-memory cache);
 * - cache misses are rate-limited per IP, more loosely for signed URLs (the
 *   og:image the page emits for crawlers) than unsigned ones (the page's
 *   Copy image button);
 * - renderService caps concurrent renders globally.
 */

import { createHash } from 'node:crypto'
import { env } from '$env/dynamic/private'
import { getApiBaseUrl } from '$lib/api/adapters/config'
import { getCachedRender, putRender } from '$lib/server/renderCache'
import { createRateLimiter } from '$lib/server/rateLimit'
import { s3KeyFor, TEMPLATES } from '$lib/server/renderRegistry'
import {
	appendRenderSignature,
	extractRenderSignature,
	verifyRenderRequest
} from '$lib/server/renderSigning'
import { gachaIdentityFor } from '$lib/utils/gacha'
import { oneOf, readShare, writeShare, type GachaShare } from '$lib/utils/gachaShare'
import type { CatalogueItem, GachaRenderData, GachaResult } from '$lib/types/gacha'

export const TEMPLATE_ID = 'gacha.result'
/** Bump to invalidate every cached share image (e.g. after a card redesign). */
export const RENDER_VERSION = 1
// Bump when the share image's design changes, so cached images re-render
// without changing signatures on links that are already shared
const DESIGN_VERSION = 4

const ARTS = ['weapon', 'character'] as const
const CURRENCIES = ['usd', 'jpy', 'crystals'] as const
const LOCALES = ['en', 'ja'] as const

export type ImageLocale = (typeof LOCALES)[number]

export interface ImageRequest {
	share: GachaShare
	art: GachaRenderData['art']
	currency: GachaRenderData['currency']
	locale: ImageLocale
	/** Query string every equivalent request reduces to; signed and hashed */
	canonical: string
	/** sha256 of `canonical`; names the cache entry */
	cacheKey: string
}

/**
 * Validate an image request. Returns null when there is nothing to draw: a
 * result needs a seed, and Until/Odds need a target.
 */
export function parseImageRequest(params: URLSearchParams): ImageRequest | null {
	const share = readShare(params)
	if (!share.seed) return null
	if (share.operation !== 'draw' && !share.target) return null

	const locale = oneOf(params.get('lang'), LOCALES, 'en')
	const art = oneOf(params.get('art'), ARTS, 'character')
	const currency = oneOf(params.get('currency'), CURRENCIES, locale === 'ja' ? 'jpy' : 'usd')

	const query = new URLSearchParams(writeShare(share))
	query.set('art', art)
	query.set('currency', currency)
	query.set('lang', locale)
	const canonical = query.toString()
	const cacheKey = createHash('sha256')
		.update(`${canonical}|design=${DESIGN_VERSION}`)
		.digest('hex')
	return { share, art, currency, locale, canonical, cacheKey }
}

/**
 * Absolute, signed image URL for a result link, for its og:image. Signing is
 * skipped when RENDER_HMAC_SECRET isn't configured (local development).
 */
export function signedImageUrl(origin: string, request: ImageRequest): string {
	const url = new URL(`/download/gacha?${request.canonical}`, origin)
	if (!env.RENDER_HMAC_SECRET) return url.toString()
	return appendRenderSignature(
		url,
		TEMPLATE_ID,
		{ query: request.canonical },
		RENDER_VERSION
	).toString()
}

export type SignatureCheck = 'signed' | 'unsigned' | 'invalid'

/**
 * Signed URLs come from our own pages (the og:image), unsigned ones from the
 * Copy image button. Both are allowed; a present but wrong signature is not.
 */
export function checkSignature(params: URLSearchParams, request: ImageRequest): SignatureCheck {
	const { signature, version } = extractRenderSignature(params)
	if (!signature) return 'unsigned'
	if (!env.RENDER_HMAC_SECRET || version !== String(RENDER_VERSION)) return 'invalid'
	return verifyRenderRequest(TEMPLATE_ID, { query: request.canonical }, RENDER_VERSION, signature)
		? 'signed'
		: 'invalid'
}

// Cache misses per IP per minute. Crawlers (Discord, Twitter, Slack) fetch
// once per unfurl, so the signed allowance is generous; unsigned requests
// come from people pressing Copy image.
const MINUTE = 60_000
export const signedLimiter = createRateLimiter({ limit: 30, windowMs: MINUTE })
export const unsignedLimiter = createRateLimiter({ limit: 10, windowMs: MINUTE })

// --- Cache -----------------------------------------------------------------

const MEMORY_MAX_ENTRIES = 50
const MEMORY_MAX_BYTES = 64 * 1024 * 1024
const memory = new Map<string, Buffer>()
let memoryBytes = 0

function useS3(): boolean {
	return !!env.RENDER_S3_BUCKET
}

function s3Key(cacheKey: string): string {
	return s3KeyFor(TEMPLATES[TEMPLATE_ID], cacheKey, RENDER_VERSION)
}

export async function readCachedImage(cacheKey: string): Promise<Buffer | null> {
	if (useS3()) {
		try {
			return await getCachedRender(s3Key(cacheKey))
		} catch (err) {
			console.error('[gachaShareImage] S3 cache read failed:', err)
			return null
		}
	}
	const hit = memory.get(cacheKey)
	if (!hit) return null
	// Refresh recency
	memory.delete(cacheKey)
	memory.set(cacheKey, hit)
	return hit
}

export async function writeCachedImage(cacheKey: string, image: Buffer): Promise<void> {
	if (useS3()) {
		try {
			await putRender(s3Key(cacheKey), image)
		} catch (err) {
			console.error('[gachaShareImage] S3 cache write failed:', err)
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
}

/** Test-only: empty the in-memory cache. */
export function _resetImageCacheForTests(): void {
	memory.clear()
	memoryBytes = 0
}

// --- Simulation --------------------------------------------------------------

/** The API refused or failed the simulation; `status` is what to answer with. */
export class SimulationError extends Error {
	constructor(
		readonly status: number,
		message: string,
		readonly retryAfter?: string
	) {
		super(message)
		this.name = 'SimulationError'
	}
}

const JOB_DEADLINE_MS = 20_000
const JOB_POLL_MS = 1_000

async function apiJson(
	fetch: typeof globalThis.fetch,
	path: string,
	init?: RequestInit
): Promise<Record<string, unknown>> {
	let response: Response
	try {
		response = await fetch(`${getApiBaseUrl()}/gacha/${path}`, {
			...init,
			headers: { 'Content-Type': 'application/json', ...init?.headers },
			signal: AbortSignal.timeout(30_000)
		})
	} catch {
		throw new SimulationError(502, 'Gacha service unavailable')
	}
	const data = (await response.json().catch(() => null)) as Record<string, unknown> | null
	if (response.status === 429) {
		throw new SimulationError(429, 'Rate limited', response.headers.get('Retry-After') ?? '60')
	}
	if (!data) throw new SimulationError(502, 'Gacha service unavailable')
	if (response.status === 422 || response.status === 400) {
		throw new SimulationError(400, String(data.error ?? 'Invalid simulation'))
	}
	if (!response.ok) throw new SimulationError(502, 'Gacha service unavailable')
	return data
}

/**
 * Resolve a share against the catalogue and re-run its simulation. Rate-ups
 * must be SSRs; ids that aren't in the pool are dropped, as on the page.
 */
export async function runShare(
	fetch: typeof globalThis.fetch,
	share: GachaShare,
	sleep: (ms: number) => Promise<void> = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
): Promise<{ result: GachaResult; target?: CatalogueItem }> {
	const season = share.mode.startsWith('classic') ? '' : share.season
	const catalogueQuery = new URLSearchParams({ mode: share.mode })
	if (season) catalogueQuery.set('season', season)
	const catalogue = await apiJson(fetch, `catalogue?${catalogueQuery.toString()}`)
	const items = (catalogue.items ?? []) as CatalogueItem[]

	const target = gachaIdentityFor(items, share.target)
	if (share.operation !== 'draw' && !target) {
		throw new SimulationError(400, 'Target is not in this pool')
	}

	const payload = {
		mode: share.mode,
		season: season || null,
		purchase: share.purchase,
		draws: share.draws,
		copies: Number(share.copies),
		comparison: share.comparison,
		target,
		rateups: share.rateups.flatMap(({ id, percent }) => {
			const identity = gachaIdentityFor(items, id, 3)
			return identity ? [{ identity, percent }] : []
		}),
		seed: share.seed
	}
	const endpoint = share.operation === 'draw' ? 'simulations' : share.operation
	let data = await apiJson(fetch, endpoint, { method: 'POST', body: JSON.stringify(payload) })

	if (data.token) {
		const deadline = Date.now() + JOB_DEADLINE_MS
		for (;;) {
			if (Date.now() >= deadline) throw new SimulationError(503, 'Simulation is still running')
			await sleep(JOB_POLL_MS)
			const job = await apiJson(fetch, `jobs/${encodeURIComponent(String(data.token))}`)
			if (job.status === 'failed') throw new SimulationError(502, String(job.error ?? 'Failed'))
			if (job.status === 'complete') {
				data = job.result as Record<string, unknown>
				break
			}
		}
	}
	if (!data || !data.draws) throw new SimulationError(502, 'Gacha service unavailable')
	const targetItem = items.find((item) => item.identity === target)
	return { result: data as unknown as GachaResult, ...(targetItem ? { target: targetItem } : {}) }
}
