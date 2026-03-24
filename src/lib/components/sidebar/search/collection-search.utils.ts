import type {
	CollectionCharacter,
	CollectionWeapon,
	CollectionSummon
} from '$lib/types/api/collection'
import type { AddItemResult } from '$lib/types/api/search'

/**
 * Extract the underlying entity from a collection item regardless of type
 */
export function getCollectionEntity(
	item: CollectionCharacter | CollectionWeapon | CollectionSummon
) {
	return 'character' in item ? item.character : 'weapon' in item ? item.weapon : item.summon
}

/**
 * Map a collection item to the unified AddItemResult format used by SearchContent
 */
export function mapCollectionToSearchResult(
	item: CollectionCharacter | CollectionWeapon | CollectionSummon
): AddItemResult {
	const entity = getCollectionEntity(item)
	return {
		id: entity.id,
		granblueId: entity.granblueId,
		name: entity.name,
		element: entity.element,
		rarity: entity.rarity,
		proficiency: 'proficiency' in entity ? entity.proficiency : undefined,
		collectionId: item.id,
		styleSwap: 'character' in item ? item.character.styleSwap : undefined,
		season: 'character' in item ? item.character.season : undefined,
		series: 'character' in item ? item.character.series : undefined
	}
}

/**
 * Client-side text filter for collection items by English or Japanese name
 */
export function filterCollectionByQuery<
	T extends CollectionCharacter | CollectionWeapon | CollectionSummon
>(items: T[], query: string): T[] {
	if (!query.trim()) return items
	const lowerQuery = query.toLowerCase()
	return items.filter((item) => {
		const entity = getCollectionEntity(item)
		const name = entity.name
		const nameEn = typeof name === 'string' ? name : name?.en || ''
		const nameJa = typeof name === 'string' ? '' : name?.ja || ''
		return nameEn.toLowerCase().includes(lowerQuery) || nameJa.toLowerCase().includes(lowerQuery)
	})
}
