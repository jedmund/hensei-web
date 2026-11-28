/**
 * Server side of the spark maker's image.
 *
 * A spark link carries its items as granblue_ids (see features/spark), so
 * the image for it can be rebuilt on demand: resolve the ids against the
 * whole SSR catalogue and screenshot the internal `_render/spark` route.
 * Caching, signing and rate limits are shared with the other share images
 * (see shareImage.ts).
 */

import { fetchRateUps } from '$lib/features/spark/rateUps'
import { createHash } from 'node:crypto'
import { getApiBaseUrl } from '$lib/api/adapters/config'
import {
	readSpark,
	resolveSpark,
	sparkItemCount,
	writeSpark,
	type Spark
} from '$lib/features/spark/spark'
import { createShareImage } from '$lib/server/shareImage'
import { oneOf } from '$lib/utils/gachaShare'
import type { CatalogueItem } from '$lib/types/gacha'
import type { SparkRenderData } from '$lib/types/spark'

export const TEMPLATE_ID = 'spark.image' as const
/** Bump to invalidate every cached image and signature */
export const RENDER_VERSION = 4
// Bump when the image's design changes, so cached images re-render without
// changing signatures on links that are already shared
const DESIGN_VERSION = 1

const LOCALES = ['en', 'ja'] as const
// The image is drawn in the viewer's theme when it's copied or saved; link
// previews, which have no viewer, are dark
const THEMES = ['dark', 'light'] as const
// The viewer's element colors the wordmark; none leaves it gray
const ELEMENTS = ['wind', 'fire', 'water', 'earth', 'light', 'dark'] as const

export interface SparkImageRequest {
	spark: Spark
	locale: (typeof LOCALES)[number]
	theme: (typeof THEMES)[number]
	element: (typeof ELEMENTS)[number] | null
	/** Query string every equivalent request reduces to; signed and hashed */
	canonical: string
	/** sha256 of `canonical`; names the cache entry */
	cacheKey: string
}

/** Validate an image request. Returns null when the spark has nothing to draw. */
export function parseSparkImageRequest(params: URLSearchParams): SparkImageRequest | null {
	const spark = readSpark(params)
	if (sparkItemCount(spark) === 0) return null
	const locale = oneOf(params.get('lang'), LOCALES, 'en')
	const theme = oneOf(params.get('theme'), THEMES, 'dark')
	const element = ELEMENTS.find((value) => value === params.get('element')) ?? null
	const canonical = [
		writeSpark(spark),
		`lang=${locale}`,
		...(theme === 'dark' ? [] : [`theme=${theme}`]),
		...(element ? [`element=${element}`] : [])
	].join('&')
	const cacheKey = createHash('sha256')
		.update(`${canonical}|design=${DESIGN_VERSION}`)
		.digest('hex')
	return { spark, locale, theme, element, canonical, cacheKey }
}

export const shareImage = createShareImage({
	templateId: TEMPLATE_ID,
	renderVersion: RENDER_VERSION,
	downloadPath: '/download/spark'
})

/** The catalogue couldn't be loaded; `status` is what to answer with */
export class CatalogueError extends Error {
	constructor(
		readonly status: number,
		readonly retryAfter?: string
	) {
		super('Gacha catalogue unavailable')
		this.name = 'CatalogueError'
	}
}

/** Resolve a spark's ids against every SSR the gacha has offered */
export async function resolveSparkImage(
	fetch: typeof globalThis.fetch,
	spark: Spark
): Promise<SparkRenderData> {
	let response: Response
	try {
		response = await fetch(`${getApiBaseUrl()}/gacha/catalogue?mode=all`, {
			signal: AbortSignal.timeout(30_000)
		})
	} catch {
		throw new CatalogueError(502)
	}
	if (response.status === 429) {
		throw new CatalogueError(429, response.headers.get('Retry-After') ?? '60')
	}
	const body = (await response.json().catch(() => null)) as { items?: CatalogueItem[] } | null
	if (!response.ok || !Array.isArray(body?.items)) throw new CatalogueError(502)
	const byId = new Map(body.items.map((item) => [item.granblue_id, item]))
	const rateUps = await fetchRateUps(
		fetch,
		getApiBaseUrl(),
		spark.date,
		spark.pool,
		AbortSignal.timeout(10_000)
	)
	return { ...resolveSpark(spark, byId).data, rateUps }
}
