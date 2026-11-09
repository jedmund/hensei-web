/**
 * Option lists and pure state helpers for CollectionFilters.
 *
 * URL round-tripping of these filters lives in `filterParams.ts`.
 */

import * as m from '$lib/paraglide/messages'
import type { CollectionSortKey } from '$lib/types/api/collection'
import type {
	CollectionFilterConfig,
	CollectionFilterKey,
	CollectionFilterOption,
	CollectionFilterState
} from '$lib/types/filter'
import { CHARACTER_SEASON_NAMES } from '$lib/types/enums'
import { getElementColor, getElementOptions } from '$lib/utils/element'
import { getWeaponSeriesIcon } from '$lib/utils/images/icons'
import { GENDER_LABELS } from '$lib/utils/gender'
import { localizedName } from '$lib/utils/locale'
import { RACE_LABELS, getRaceLabel } from '$lib/utils/race'

export type CollectionEntityType = 'character' | 'weapon' | 'summon'

export type CollectionFilterVisibility = Partial<Record<CollectionFilterKey, boolean>>

/** Display order of the filter groups */
export const COLLECTION_FILTER_KEYS: CollectionFilterKey[] = [
	'element',
	'rarity',
	'season',
	'series',
	'race',
	'proficiency',
	'gender'
]

/** Maximum number of filters visible in the main row before overflow into "More" */
export const MAX_VISIBLE_FILTERS = 3

/** Default filter visibility per entity type */
export const DEFAULT_FILTERS_BY_ENTITY: Record<CollectionEntityType, CollectionFilterVisibility> = {
	character: {
		element: true,
		rarity: true,
		season: true,
		series: true,
		race: true,
		proficiency: true,
		gender: true
	},
	weapon: {
		element: true,
		rarity: true,
		season: false,
		series: true, // Weapon series
		race: false,
		proficiency: true, // Weapon type
		gender: false
	},
	summon: {
		element: true,
		rarity: true,
		season: false,
		series: true,
		race: false,
		proficiency: false,
		gender: false
	}
}

/** Explicit visibility overrides the entity type's defaults */
export function resolveFilterVisibility(
	entityType: CollectionEntityType,
	overrides?: CollectionFilterVisibility
): CollectionFilterVisibility {
	return { ...DEFAULT_FILTERS_BY_ENTITY[entityType], ...overrides }
}

export function emptyCollectionFilterState(): CollectionFilterState {
	return { element: [], rarity: [], season: [], series: [], race: [], proficiency: [], gender: [] }
}

/** Sort options; summons have no weapon type, so no proficiency sorts */
export function getCollectionSortOptions(
	entityType: CollectionEntityType
): { value: CollectionSortKey; label: string }[] {
	return [
		{ value: 'name_asc', label: m.sort_name_asc() },
		{ value: 'name_desc', label: m.sort_name_desc() },
		{ value: 'element_asc', label: m.sort_element_asc() },
		{ value: 'element_desc', label: m.sort_element_desc() },
		...(entityType !== 'summon'
			? [
					{ value: 'proficiency_asc' as const, label: m.sort_proficiency_asc() },
					{ value: 'proficiency_desc' as const, label: m.sort_proficiency_desc() }
				]
			: []),
		{ value: 'release_date_asc', label: m.sort_release_date_oldest() },
		{ value: 'release_date_desc', label: m.sort_release_date_newest() }
	]
}

export function getElementFilterOptions(): CollectionFilterOption[] {
	return getElementOptions().map((opt) => ({ ...opt, color: getElementColor(opt.value) }))
}

export const RARITY_OPTIONS: CollectionFilterOption[] = [
	{ value: 1, label: 'R' },
	{ value: 2, label: 'SR' },
	{ value: 3, label: 'SSR' }
]

export const SEASON_OPTIONS: CollectionFilterOption[] = Object.entries(CHARACTER_SEASON_NAMES).map(
	([value, label]) => ({ value: Number(value), label })
)

export function getRaceFilterOptions(): CollectionFilterOption[] {
	return Object.keys(RACE_LABELS).map((value) => ({
		value: Number(value),
		label: getRaceLabel(Number(value))
	}))
}

/** Genders, without Unknown */
export const GENDER_OPTIONS: CollectionFilterOption[] = Object.entries(GENDER_LABELS)
	.filter(([value]) => Number(value) !== 0)
	.map(([value, label]) => ({ value: Number(value), label }))

interface SeriesListItem {
	id: string
	order: number
	name: { en: string; ja: string }
}

/** Series list from the API, in display order */
export function seriesToOptions<T extends SeriesListItem>(
	series: T[] | undefined,
	decorate?: (series: T) => Partial<CollectionFilterOption>
): CollectionFilterOption[] {
	if (!series) return []
	return [...series]
		.sort((a, b) => a.order - b.order)
		.map((s) => ({ value: s.id, label: localizedName(s.name), ...decorate?.(s) }))
}

// The game's series filter has no icon for these
const WEAPON_SERIES_WITHOUT_ICON = new Set(['gacha', 'event'])

/** A weapon series option's icon, or a grey circle for series that have none */
export function weaponSeriesImage(
	slug: string
): Pick<CollectionFilterOption, 'image' | 'imageBackground' | 'imageRound' | 'imageUncropped'> {
	return WEAPON_SERIES_WITHOUT_ICON.has(slug)
		? { imageBackground: 'var(--placeholder-bg)', imageRound: true }
		: { image: getWeaponSeriesIcon(slug), imageUncropped: true }
}

/** Weapon series with their icons */
export function weaponSeriesToOptions(
	series: (SeriesListItem & { slug: string })[] | undefined
): CollectionFilterOption[] {
	return seriesToOptions(series, ({ slug }) => weaponSeriesImage(slug))
}

/** Adds the value if absent, removes it if present */
export function toggleFilterValue(
	values: (number | string)[],
	value: number | string
): (number | string)[] {
	return values.includes(value) ? values.filter((v) => v !== value) : [...values, value]
}

/** The visible groups, split into the inline row and the "More" overflow */
export function splitFilterConfigs(
	configs: CollectionFilterConfig[],
	visibility: CollectionFilterVisibility
): {
	active: CollectionFilterConfig[]
	visible: CollectionFilterConfig[]
	more: CollectionFilterConfig[]
} {
	const active = configs.filter((c) => visibility[c.key])
	return {
		active,
		visible: active.slice(0, MAX_VISIBLE_FILTERS),
		more: active.slice(MAX_VISIBLE_FILTERS)
	}
}

export function countSelectedValues(configs: CollectionFilterConfig[]): number {
	return configs.reduce((sum, c) => sum + c.value.length, 0)
}
