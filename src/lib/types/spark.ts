import type { SparkColumn, SparkMark } from '$lib/features/spark/spark'
import type { CatalogueItem } from '$lib/types/gacha'

/**
 * A spark with its items resolved against the catalogue: everything the
 * image needs. The page builds it from the loaded catalogue; the image
 * endpoint builds it server-side and hands it to `_render/spark` with
 * storePrefetch.
 */
export interface SparkRenderData {
	columns: Record<SparkColumn, CatalogueItem[]>
	sparked: SparkMark[]
	draws: number
	/** For the image's title: the spark's day and the gacha it was on */
	date: string | null
	pool: string | null
	season: string | null
}
