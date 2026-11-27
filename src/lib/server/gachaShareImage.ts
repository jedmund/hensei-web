/**
 * Server side of the gacha simulator's share images.
 *
 * A result link carries the settings and seed (see gachaShare.ts), so the
 * image for it can be rebuilt on demand: resolve the link against the
 * catalogue, re-run the simulation through the API, and screenshot the
 * internal `_render/gacha/result` route. Caching, signing and rate limits
 * are shared with the other share images (see shareImage.ts).
 */

import { createHash } from 'node:crypto'
import { getApiBaseUrl } from '$lib/api/adapters/config'
import { createShareImage } from '$lib/server/shareImage'
import { gachaIdentityFor } from '$lib/utils/gacha'
import { oneOf, readShare, writeShare, type GachaShare } from '$lib/utils/gachaShare'
import type { CatalogueItem, GachaRenderData, GachaResult } from '$lib/types/gacha'

export const TEMPLATE_ID = 'gacha.result' as const
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

export const shareImage = createShareImage({
	templateId: TEMPLATE_ID,
	renderVersion: RENDER_VERSION,
	downloadPath: '/download/gacha'
})

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
	if (share.banner) catalogueQuery.set('banner', share.banner)
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
		seed: share.seed,
		...(share.banner ? { banner: share.banner } : {})
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
