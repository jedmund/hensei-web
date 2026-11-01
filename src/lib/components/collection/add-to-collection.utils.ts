import type { SearchFilters, SearchPageResult } from '$lib/api/queries/search.queries'
import type {
	CollectionCharacterInput,
	CollectionSummonInput,
	CollectionWeaponInput
} from '$lib/types/api/collection'
import type { CollectionFilterState } from '$lib/types/filter'
import { nonEmpty } from '$lib/components/sidebar/search/search-filters.utils'
import { normalizeCharacterUncap } from '$lib/utils/uncap'
import * as m from '$lib/paraglide/messages'

export type AddToCollectionEntityType = 'character' | 'weapon' | 'summon'
export type AddToCollectionResult = SearchPageResult['results'][number]

export interface EntityNames {
	singular: string
	plural: string
}

/** Localized display names for an entity type, in the current locale */
export function entityNames(entityType: AddToCollectionEntityType): EntityNames {
	if (entityType === 'character') {
		return { singular: m.collection_entity_character(), plural: m.collection_entity_characters() }
	}
	if (entityType === 'weapon') {
		return { singular: m.collection_entity_weapon(), plural: m.collection_entity_weapons() }
	}
	return { singular: m.collection_entity_summon(), plural: m.collection_entity_summons() }
}

/**
 * Search filters for the modal. Empty selections are left out so they don't
 * end up in the query key; only UUID (string) series filters are sent.
 */
export function buildAddToCollectionFilters(filters: CollectionFilterState): SearchFilters {
	const series = filters.series.filter((s): s is string => typeof s === 'string')
	return {
		element: nonEmpty(filters.element),
		rarity: nonEmpty(filters.rarity),
		season: nonEmpty(filters.season),
		series: nonEmpty(series),
		proficiency: nonEmpty(filters.proficiency),
		race: nonEmpty(filters.race),
		gender: nonEmpty(filters.gender)
	}
}

/** Whether the user has typed a query or picked any filter */
export function hasActiveSearch(query: string, filters: SearchFilters): boolean {
	return !!query || Object.values(filters).some((v) => v)
}

/** Flatten search pages, keeping the first copy of each id */
export function uniqueResults<T extends { id: string }>(pages: { results: T[] }[]): T[] {
	const seen = new Set<string>()
	const results: T[] = []
	for (const page of pages) {
		for (const result of page.results) {
			if (!seen.has(result.id)) {
				seen.add(result.id)
				results.push(result)
			}
		}
	}
	return results
}

export interface MaxLevels {
	uncapLevel: number
	transcendenceStep: number
}

/** The highest uncap level and transcendence step an item can reach; new items are added maxed */
export function getMaxLevels(
	item: AddToCollectionResult | undefined,
	isCharacter: boolean
): MaxLevels {
	const uncap = item?.uncap
	const baseLevel = isCharacter ? 4 : 3
	if (!uncap) return { uncapLevel: baseLevel, transcendenceStep: 0 }
	if (isCharacter && item?.special) {
		const normalized = normalizeCharacterUncap({ special: true, uncap })
		if (normalized.ulb) return { uncapLevel: 5, transcendenceStep: 0 }
		if (uncap.flb) return { uncapLevel: 4, transcendenceStep: 0 }
		return { uncapLevel: 3, transcendenceStep: 0 }
	}
	if (uncap.transcendence) {
		return {
			uncapLevel: 6,
			transcendenceStep: isCharacter ? (uncap.maxTranscendenceStage ?? 5) : 5
		}
	}
	if (uncap.ulb) return { uncapLevel: 5, transcendenceStep: 0 }
	if (uncap.flb) return { uncapLevel: isCharacter ? 5 : 4, transcendenceStep: 0 }
	return { uncapLevel: baseLevel, transcendenceStep: 0 }
}

function findResult(results: AddToCollectionResult[], id: string) {
	return results.find((r) => r.id === id)
}

/** Add-characters payload: one maxed entry per selected character */
export function buildCharacterInputs(
	selectedIds: Iterable<string>,
	results: AddToCollectionResult[]
): CollectionCharacterInput[] {
	return Array.from(selectedIds).map((characterId) => ({
		characterId,
		...getMaxLevels(findResult(results, characterId), true)
	}))
}

/** Add-weapons payload: one maxed entry per selected weapon, with its quantity */
export function buildWeaponInputs(
	quantities: Map<string, number>,
	results: AddToCollectionResult[]
): Array<CollectionWeaponInput & { quantity: number }> {
	return Array.from(quantities.entries()).map(([weaponId, quantity]) => ({
		weaponId,
		quantity,
		...getMaxLevels(findResult(results, weaponId), false)
	}))
}

/** Add-summons payload: one maxed entry per selected summon, with its quantity */
export function buildSummonInputs(
	quantities: Map<string, number>,
	results: AddToCollectionResult[]
): Array<CollectionSummonInput & { quantity: number }> {
	return Array.from(quantities.entries()).map(([summonId, quantity]) => ({
		summonId,
		quantity,
		...getMaxLevels(findResult(results, summonId), false)
	}))
}

export interface SelectionCounts {
	/** Characters selected, or total copies of weapons/summons */
	count: number
	/** Distinct items selected */
	itemCount: number
}

export function selectionCounts(
	entityType: AddToCollectionEntityType,
	selectedIds: Set<string>,
	quantities: Map<string, number>
): SelectionCounts {
	if (entityType === 'character') {
		return { count: selectedIds.size, itemCount: selectedIds.size }
	}
	return {
		count: Array.from(quantities.values()).reduce((sum, qty) => sum + qty, 0),
		itemCount: quantities.size
	}
}

/** Footer label for the selection; weapons and summons also show the total copies */
export function selectedText(
	entityType: AddToCollectionEntityType,
	{ count, itemCount }: SelectionCounts,
	names: EntityNames
): string {
	if (entityType === 'character') {
		return m.collection_add_selected({
			count,
			type: count === 1 ? names.singular : names.plural
		})
	}
	if (itemCount === 0) return ''
	if (count > itemCount) {
		return m.collection_add_items_selected({ count: itemCount, total: count })
	}
	return m.collection_add_selected({ count: itemCount, type: names.plural })
}

/** TanStack Query's error when a mutation is cancelled; not worth reporting */
export function isCancelledError(error: unknown): boolean {
	return !!error && typeof error === 'object' && 'name' in error && error.name === 'CancelledError'
}
