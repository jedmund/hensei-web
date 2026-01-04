/**
 * URL Filter Parameter Utilities
 *
 * Bidirectional mappings for human-readable URL parameters
 * and functions to parse/build filter URLs.
 */

import type { CollectionFilterState } from '$lib/components/collection/CollectionFilters.svelte'
import type { WeaponSeries } from '$lib/types/api/weaponSeries'

// ============================================================================
// Element Mapping (0-6)
// ============================================================================

export const ELEMENT_TO_PARAM: Record<number, string> = {
	0: 'null',
	1: 'wind',
	2: 'fire',
	3: 'water',
	4: 'earth',
	5: 'dark',
	6: 'light'
}

export const PARAM_TO_ELEMENT: Record<string, number> = {
	null: 0,
	wind: 1,
	fire: 2,
	water: 3,
	earth: 4,
	dark: 5,
	light: 6
}

// ============================================================================
// Rarity Mapping (1-3)
// ============================================================================

export const RARITY_TO_PARAM: Record<number, string> = {
	1: 'r',
	2: 'sr',
	3: 'ssr'
}

export const PARAM_TO_RARITY: Record<string, number> = {
	r: 1,
	sr: 2,
	ssr: 3
}

// ============================================================================
// Proficiency Mapping (1-10)
// ============================================================================

export const PROFICIENCY_TO_PARAM: Record<number, string> = {
	1: 'sabre',
	2: 'dagger',
	3: 'axe',
	4: 'spear',
	5: 'bow',
	6: 'staff',
	7: 'melee',
	8: 'harp',
	9: 'gun',
	10: 'katana'
}

export const PARAM_TO_PROFICIENCY: Record<string, number> = {
	sabre: 1,
	dagger: 2,
	axe: 3,
	spear: 4,
	bow: 5,
	staff: 6,
	melee: 7,
	harp: 8,
	gun: 9,
	katana: 10
}

// ============================================================================
// Season Mapping (1-5) - Characters only
// ============================================================================

export const SEASON_TO_PARAM: Record<number, string> = {
	1: 'valentine',
	2: 'formal',
	3: 'summer',
	4: 'halloween',
	5: 'holiday'
}

export const PARAM_TO_SEASON: Record<string, number> = {
	valentine: 1,
	formal: 2,
	summer: 3,
	halloween: 4,
	holiday: 5
}

// ============================================================================
// Character Series Mapping (1-15) - Characters only
// ============================================================================

export const CHARACTER_SERIES_TO_PARAM: Record<number, string> = {
	1: 'grand',
	2: 'zodiac',
	3: 'promo',
	4: 'collab',
	5: 'eternal',
	6: 'evoker',
	7: 'saint',
	8: 'fantasy',
	9: 'summer',
	10: 'yukata',
	11: 'valentine',
	12: 'halloween',
	13: 'formal',
	14: 'holiday',
	15: 'event'
}

export const PARAM_TO_CHARACTER_SERIES: Record<string, number> = {
	grand: 1,
	zodiac: 2,
	promo: 3,
	collab: 4,
	eternal: 5,
	evoker: 6,
	saint: 7,
	fantasy: 8,
	summer: 9,
	yukata: 10,
	valentine: 11,
	halloween: 12,
	formal: 13,
	holiday: 14,
	event: 15
}

// ============================================================================
// Parsed Filters Type
// ============================================================================

export interface ParsedFilters {
	element: number[]
	rarity: number[]
	proficiency: number[]
	season: number[]
	series: (number | string)[] // numbers for characters, UUIDs for weapons
	searchQuery: string
	page: number
}

// ============================================================================
// Parse Functions
// ============================================================================

/**
 * Parse a comma-separated URL param into an array of values using a mapping
 */
function parseParamArray<T>(
	searchParams: URLSearchParams,
	paramName: string,
	mapping: Record<string, T>
): T[] {
	const param = searchParams.get(paramName)
	if (!param) return []

	return param
		.split(',')
		.map((v) => v.trim().toLowerCase())
		.map((v) => mapping[v])
		.filter((v): v is T => v !== undefined)
}

/**
 * Parse URL search params into filter state
 *
 * For weapons, pass the weaponSeriesList to resolve slugs to UUIDs
 */
export function parseFiltersFromUrl(
	searchParams: URLSearchParams,
	entityType: 'character' | 'weapon' | 'summon' | 'job',
	weaponSeriesList?: WeaponSeries[]
): ParsedFilters {
	const element = parseParamArray(searchParams, 'element', PARAM_TO_ELEMENT)
	const rarity = parseParamArray(searchParams, 'rarity', PARAM_TO_RARITY)
	const proficiency = parseParamArray(searchParams, 'proficiency', PARAM_TO_PROFICIENCY)
	const season =
		entityType === 'character' ? parseParamArray(searchParams, 'season', PARAM_TO_SEASON) : []

	// Parse series based on entity type
	let series: (number | string)[] = []
	const seriesParam = searchParams.get('series')
	if (seriesParam) {
		const seriesSlugs = seriesParam.split(',').map((v) => v.trim().toLowerCase())

		if (entityType === 'character') {
			// Characters use numeric series enum
			series = seriesSlugs
				.map((slug) => PARAM_TO_CHARACTER_SERIES[slug])
				.filter((v): v is number => v !== undefined)
		} else if (entityType === 'weapon' && weaponSeriesList) {
			// Weapons use UUIDs, need to look up by slug
			series = seriesSlugs
				.map((slug) => weaponSeriesList.find((ws) => ws.slug === slug)?.id)
				.filter((id): id is string => id !== undefined)
		}
	}

	// Parse search query
	const searchQuery = searchParams.get('q') ?? ''

	// Parse page
	const pageParam = searchParams.get('page')
	const page = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1

	return {
		element,
		rarity,
		proficiency,
		season,
		series,
		searchQuery,
		page
	}
}

// ============================================================================
// Build Functions
// ============================================================================

/**
 * Convert an array of values to a comma-separated URL param string
 */
function buildParamString<T extends string | number>(
	values: T[],
	mapping: Record<T, string>
): string | null {
	if (values.length === 0) return null
	const params = values.map((v) => mapping[v]).filter(Boolean)
	return params.length > 0 ? params.join(',') : null
}

/**
 * Build URL search params from filter state
 *
 * For weapons, pass the weaponSeriesList to resolve UUIDs to slugs
 */
export function buildUrlFromFilters(
	filters: CollectionFilterState,
	searchQuery: string,
	page: number,
	entityType: 'character' | 'weapon' | 'summon' | 'job',
	weaponSeriesList?: WeaponSeries[]
): URLSearchParams {
	const params = new URLSearchParams()

	// Element
	const elementParam = buildParamString(
		filters.element,
		ELEMENT_TO_PARAM as Record<number, string>
	)
	if (elementParam) params.set('element', elementParam)

	// Rarity
	const rarityParam = buildParamString(filters.rarity, RARITY_TO_PARAM as Record<number, string>)
	if (rarityParam) params.set('rarity', rarityParam)

	// Proficiency
	const proficiencyParam = buildParamString(
		filters.proficiency,
		PROFICIENCY_TO_PARAM as Record<number, string>
	)
	if (proficiencyParam) params.set('proficiency', proficiencyParam)

	// Season (characters only)
	if (entityType === 'character' && filters.season.length > 0) {
		const seasonParam = buildParamString(
			filters.season,
			SEASON_TO_PARAM as Record<number, string>
		)
		if (seasonParam) params.set('season', seasonParam)
	}

	// Series
	if (filters.series.length > 0) {
		if (entityType === 'character') {
			// Characters use numeric series, convert to slugs
			const numericSeries = filters.series.filter((s): s is number => typeof s === 'number')
			const seriesParam = buildParamString(
				numericSeries,
				CHARACTER_SERIES_TO_PARAM as Record<number, string>
			)
			if (seriesParam) params.set('series', seriesParam)
		} else if (entityType === 'weapon' && weaponSeriesList) {
			// Weapons use UUIDs, look up slugs
			const slugs = filters.series
				.filter((s): s is string => typeof s === 'string')
				.map((uuid) => weaponSeriesList.find((ws) => ws.id === uuid)?.slug)
				.filter((slug): slug is string => slug !== undefined)
			if (slugs.length > 0) params.set('series', slugs.join(','))
		}
	}

	// Search query
	if (searchQuery.trim()) {
		params.set('q', searchQuery.trim())
	}

	// Page (only include if > 1)
	if (page > 1) {
		params.set('page', String(page))
	}

	return params
}

/**
 * Check if any filters are active
 */
export function hasActiveFilters(filters: CollectionFilterState, searchQuery: string): boolean {
	return (
		filters.element.length > 0 ||
		filters.rarity.length > 0 ||
		filters.proficiency.length > 0 ||
		filters.season.length > 0 ||
		filters.series.length > 0 ||
		filters.race.length > 0 ||
		filters.gender.length > 0 ||
		searchQuery.trim().length > 0
	)
}
