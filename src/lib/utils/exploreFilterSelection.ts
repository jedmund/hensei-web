/**
 * Pure state transitions for the Gallery filter pills (ExploreFilters):
 * adding, removing and relabelling FilterItems, turning search results into
 * options, and building the placeholder suggestions.
 *
 * Matching typed queries lives in `filterMatching.ts`; URL round-tripping in
 * `exploreFilterParams.ts`.
 */

import * as m from '$lib/paraglide/messages'
import type { EntitySuggestion, UnifiedSearchResult } from '$lib/api/adapters/search.adapter'
import type { RaidFull } from '$lib/types/api/raid'
import type { FilterItem, FilterOption, PlaceholderSuggestion } from '$lib/types/filter'
import { localizedName } from '$lib/utils/locale'

/** Kinds where a new pick replaces the existing filter of that kind */
const SINGLE_SELECT_KINDS = new Set<FilterItem['kind']>([
	'recency',
	'boost',
	'side',
	'evoker',
	'label'
])

export function isFilterSelected(filters: FilterItem[], option: FilterOption): boolean {
	return filters.some((f) => {
		if (f.kind !== option.kind) return false
		if (f.kind === 'entity') return f.granblueId === option.granblueId
		return f.value === option.value
	})
}

/** The filters with `option` added, or null when it's already selected */
export function addFilterOption(filters: FilterItem[], option: FilterOption): FilterItem[] | null {
	if (isFilterSelected(filters, option)) return null

	if (SINGLE_SELECT_KINDS.has(option.kind)) {
		const without = filters.filter((f) => f.kind !== option.kind)
		return [
			...without,
			{ kind: option.kind, value: option.value, label: option.label } as FilterItem
		]
	}

	let newFilter: FilterItem
	if (option.kind === 'entity') {
		newFilter = {
			kind: 'entity',
			value: option.value as string,
			label: option.label,
			entityType: option.entityType!,
			granblueId: option.granblueId!,
			mode: 'include',
			element: option.element
		}
	} else if (option.kind === 'element') {
		newFilter = { kind: 'element', value: option.value as number, label: option.label }
	} else if (option.kind === 'raid' || option.kind === 'class' || option.kind === 'difficulty') {
		newFilter = { kind: option.kind, value: option.value as string, label: option.label }
	} else {
		newFilter = { kind: 'party', value: option.value as string, label: option.label }
	}
	return [...filters, newFilter]
}

/** The filters without the one at `index`, or null when it's pinned */
export function removeFilterAt(filters: FilterItem[], index: number): FilterItem[] | null {
	if (filters[index]?.pinned) return null
	return filters.filter((_, i) => i !== index)
}

/** Index of the last filter that can be removed, or -1 */
export function lastUnpinnedIndex(filters: FilterItem[]): number {
	for (let i = filters.length - 1; i >= 0; i--) {
		if (!filters[i]?.pinned) return i
	}
	return -1
}

/** Flips an entity filter between include and exclude; null for other kinds */
export function toggleEntityModeAt(filters: FilterItem[], index: number): FilterItem[] | null {
	const filter = filters[index]
	if (!filter || filter.kind !== 'entity') return null
	const updated = [...filters]
	updated[index] = { ...filter, mode: filter.mode === 'include' ? 'exclude' : 'include' }
	return updated
}

/**
 * Filters restored from a URL land with label === value (e.g. a difficulty
 * slug) because their catalogue hasn't loaded. Swaps in the resolved label
 * for `kind`; null when nothing changed.
 */
export function relabelFilters(
	filters: FilterItem[],
	kind: FilterItem['kind'],
	resolve: (value: FilterItem['value']) => string | undefined
): FilterItem[] | null {
	let changed = false
	const next = filters.map((f) => {
		if (f.kind !== kind || f.label !== f.value) return f
		const label = resolve(f.value)
		if (label === undefined) return f
		changed = true
		return { ...f, label }
	})
	return changed ? next : null
}

export function entityCategoryLabel(type: string): string {
	return type === 'character'
		? m.filter_cat_character()
		: type === 'weapon'
			? m.filter_cat_weapon()
			: m.filter_cat_summon()
}

export function searchResultToOption(r: UnifiedSearchResult): FilterOption {
	const type = r.searchableType.toLowerCase()
	return {
		kind: 'entity',
		value: r.searchableId,
		label: localizedName({ en: r.nameEn ?? '', ja: r.nameJp ?? '' }) ?? 'Unknown',
		category: entityCategoryLabel(type),
		entityType: type,
		granblueId: r.granblueId,
		element: r.element,
		season: r.season,
		series: r.series
	}
}

export function entitySuggestionToOption(entity: EntitySuggestion): FilterOption {
	return {
		kind: 'entity',
		value: entity.id,
		label: localizedName(entity.name as { en: string; ja: string }) ?? 'Unknown',
		category: entityCategoryLabel(entity.type),
		entityType: entity.type,
		granblueId: entity.granblueId,
		element: entity.element
	}
}

export interface ExploreCategoryLabels {
	element: string
	recency: string
	party: string
	raid: string
	boost: string
	side: string
	difficulty: string
	evoker: string
	label: string
}

export function getExploreCategoryLabels(): ExploreCategoryLabels {
	return {
		element: m.filter_cat_element(),
		recency: m.filter_cat_recency(),
		party: m.filter_cat_party(),
		raid: m.filter_cat_raid(),
		boost: m.filter_cat_boost(),
		side: m.filter_cat_side(),
		difficulty: m.filter_cat_difficulty(),
		evoker: m.filter_cat_evoker(),
		label: m.explore_filter_label()
	}
}

export function pickRandom<T>(arr: T[]): T | undefined {
	if (arr.length === 0) return undefined
	return arr[Math.floor(Math.random() * arr.length)]
}

interface PlaceholderParams {
	filters: FilterItem[]
	excludedKinds: FilterItem['kind'][]
	categoryLabels: ExploreCategoryLabels
	/** Evokers not already filtered by; all are offered */
	evokerSuggestions: FilterOption[]
	elementSuggestions: FilterOption[]
	allRaids: RaidFull[]
	labelOptions: { value: string; label: string }[]
	/** A random entity from the suggestions endpoint, already fetched */
	entity?: FilterOption
	pick?: <T>(arr: T[]) => T | undefined
}

/** The suggestions shown in the dropdown before anything is typed */
export function buildPlaceholderSuggestions({
	filters,
	excludedKinds,
	categoryLabels,
	evokerSuggestions,
	elementSuggestions,
	allRaids,
	labelOptions,
	entity,
	pick = pickRandom
}: PlaceholderParams): PlaceholderSuggestion[] {
	const picks: PlaceholderSuggestion[] = []
	const push = (option: FilterOption) =>
		picks.push({ label: option.label, category: option.category, option })

	for (const evoker of evokerSuggestions) push(evoker)

	if (!excludedKinds.includes('element')) {
		const el = pick(elementSuggestions)
		if (el) push(el)
	}

	if (!excludedKinds.includes('raid')) {
		const raid = pick(
			allRaids.filter((r) => !filters.some((f) => f.kind === 'raid' && f.value === r.id))
		)
		if (raid) {
			push({
				kind: 'raid',
				value: raid.id,
				label: localizedName(raid.name) ?? raid.slug,
				category: categoryLabels.raid
			})
		}
	}

	if (!excludedKinds.includes('label') && !filters.some((f) => f.kind === 'label')) {
		const sticker = pick(labelOptions)
		if (sticker) {
			push({
				kind: 'label',
				value: sticker.value,
				label: sticker.label,
				category: categoryLabels.label
			})
		}
	}

	if (!excludedKinds.includes('recency')) {
		push({
			kind: 'recency',
			value: 604800,
			label: m.recency_week(),
			category: categoryLabels.recency
		})
	}

	if (!excludedKinds.includes('entity') && entity) push(entity)

	if (!excludedKinds.includes('party')) {
		const party: [string, string][] = [
			['full_auto', m.filter_full_auto()],
			['solo', m.filter_solo()],
			['youtube', m.filter_youtube()]
		]
		for (const [value, label] of party) {
			push({ kind: 'party', value, label, category: categoryLabels.party })
		}
	}

	return picks
}
