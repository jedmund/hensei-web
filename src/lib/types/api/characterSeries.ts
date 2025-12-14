/**
 * Character Series Types
 *
 * Type definitions for character series data from the API.
 * CharacterSeries is a database-driven classification system for characters.
 * Unlike weapons (one-to-many), characters can belong to multiple series (many-to-many).
 *
 * @module types/api/characterSeries
 */

/**
 * Embedded series reference on characters.
 * This is the structure returned in character.series field (array).
 */
export interface CharacterSeriesRef {
	id: string
	slug: string
	name: { en: string; ja: string }
}

/**
 * Full character series from /api/v1/character_series endpoint.
 * characterCount is only included in the :full view (show endpoint).
 */
export interface CharacterSeries {
	id: string
	name: { en: string; ja: string }
	slug: string
	order: number
	characterCount?: number
}

/**
 * Input type for character series form (client-side)
 */
export interface CharacterSeriesInput {
	name_en: string
	name_jp: string
	slug: string
	order: number
}

/**
 * Payload for creating a new character series (editor only)
 */
export interface CreateCharacterSeriesPayload {
	name_en: string
	name_jp: string
	slug: string
	order?: number
}

/**
 * Payload for updating an existing character series (editor only)
 */
export interface UpdateCharacterSeriesPayload {
	name_en?: string
	name_jp?: string
	slug?: string
	order?: number
}

/**
 * Type guard to check if a series value is the new object format vs legacy integer.
 * During migration, some characters may still have integer series values.
 *
 * @param series - The series value to check
 * @returns True if series is a CharacterSeriesRef object
 */
export function isCharacterSeriesRef(series: unknown): series is CharacterSeriesRef {
	return (
		series !== null &&
		typeof series === 'object' &&
		'slug' in series &&
		'id' in series &&
		'name' in series
	)
}

/**
 * Type guard to check if series array contains new object format
 *
 * @param series - The series array to check
 * @returns True if array contains CharacterSeriesRef objects
 */
export function hasCharacterSeriesRefs(series: unknown[]): series is CharacterSeriesRef[] {
	return series.length > 0 && isCharacterSeriesRef(series[0])
}
