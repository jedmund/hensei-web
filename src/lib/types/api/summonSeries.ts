/**
 * Summon Series Types
 *
 * Type definitions for summon series data from the API.
 * SummonSeries is a database-driven classification system for summons.
 *
 * @module types/api/summonSeries
 */

/**
 * Embedded series reference on summons.
 * This is the structure returned in summon.series field.
 */
export interface SummonSeriesRef {
	id: string
	slug: string
	name: { en: string; ja: string }
}

/**
 * Full summon series from /api/v1/summon_series endpoint.
 * summonCount is only included in the :full view (show endpoint).
 */
export interface SummonSeries {
	id: string
	name: { en: string; ja: string }
	slug: string
	order: number
	summonCount?: number
}

/**
 * Input type for summon series form (client-side)
 */
export interface SummonSeriesInput {
	name_en: string
	name_jp: string
	slug: string
	order: number
}

/**
 * Payload for creating a new summon series (editor only)
 */
export interface CreateSummonSeriesPayload {
	name_en: string
	name_jp: string
	slug: string
	order?: number
}

/**
 * Payload for updating an existing summon series (editor only)
 */
export interface UpdateSummonSeriesPayload {
	name_en?: string
	name_jp?: string
	slug?: string
	order?: number
}

/**
 * Type guard to check if a series value is the new object format.
 *
 * @param series - The series value to check
 * @returns True if series is a SummonSeriesRef object
 */
export function isSummonSeriesRef(series: unknown): series is SummonSeriesRef {
	return (
		series !== null &&
		typeof series === 'object' &&
		'slug' in series &&
		'id' in series &&
		'name' in series
	)
}
