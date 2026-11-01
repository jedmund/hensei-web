import type { SearchFilters } from '$lib/api/queries/search.queries'
import type { AddItemResult, SearchMode } from '$lib/types/api/search'
import type { Party } from '$lib/types/api/party'

export type SearchEntityType = 'weapon' | 'character' | 'summon'

export interface SearchFilterInput {
	type: SearchEntityType
	searchMode: SearchMode
	elementFilters: number[]
	rarityFilters: number[]
	proficiencyFilters: number[]
	/** Locked proficiencies for a mainhand slot; only applies to the catalogue ('all') search */
	requiredProficiencies?: number[] | undefined
	seriesFilter?: string | undefined
	subauraFilter: boolean
	isExtraSlot: boolean
}

/** An empty selection becomes undefined so it stays out of the query key. */
export function nonEmpty<T>(values: T[]): T[] | undefined {
	return values.length > 0 ? values : undefined
}

/**
 * Build the filters for the search sidebar. Empty selections are left out so
 * they don't end up in the query key. Proficiency only applies to weapons and
 * characters; a slot's required proficiencies replace the user's choice on the
 * catalogue search, but not on a collection search.
 */
export function buildSearchFilters(input: SearchFilterInput): SearchFilters {
	const { type, searchMode, proficiencyFilters, requiredProficiencies } = input
	const chosenProficiencies = nonEmpty(proficiencyFilters)

	let proficiency: number[] | undefined
	if (type === 'weapon' || type === 'character') {
		proficiency =
			searchMode === 'collection'
				? chosenProficiencies
				: (requiredProficiencies ?? chosenProficiencies)
	}

	return {
		element: nonEmpty(input.elementFilters),
		rarity: nonEmpty(input.rarityFilters),
		proficiency,
		series: input.seriesFilter ? [input.seriesFilter] : undefined,
		subaura: input.subauraFilter ? true : undefined,
		extra: input.isExtraSlot ? true : undefined
	}
}

/**
 * Filters for the collection query. Outside collection mode the query only
 * backs the owned-item lookup, so it runs unfiltered.
 */
export function buildCollectionFilters(
	filters: SearchFilters,
	searchMode: SearchMode,
	query: string
) {
	if (searchMode !== 'collection') return {}
	return {
		element: filters.element,
		rarity: filters.rarity,
		proficiency: filters.proficiency,
		series: filters.series,
		search: query || undefined
	}
}

/** Drop repeated results across pages, keeping the last copy of each id. */
export function dedupeResultsById(results: AddItemResult[]): AddItemResult[] {
	return Array.from(new Map(results.map((item) => [item.id, item])).values())
}

/** Collection item ids already placed in the party's grids. */
export function partyCollectionIds(
	party: Partial<Pick<Party, 'weapons' | 'characters' | 'summons'>> | undefined | null
): Set<string> {
	const ids = new Set<string>()
	if (!party) return ids
	for (const w of party.weapons ?? []) {
		if (w.collectionWeaponId) ids.add(w.collectionWeaponId)
	}
	for (const c of party.characters ?? []) {
		if (c.collectionCharacterId) ids.add(c.collectionCharacterId)
	}
	for (const s of party.summons ?? []) {
		if (s.collectionSummonId) ids.add(s.collectionSummonId)
	}
	return ids
}
