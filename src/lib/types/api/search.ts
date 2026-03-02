/**
 * Search-related types for collection-to-grid linking
 */

import type { SearchResult } from '$lib/api/adapters/search.adapter'

/**
 * Search mode for toggling between all items and user's collection
 */
export type SearchMode = 'all' | 'collection'

/**
 * Result passed back when adding items from search
 * Contains the essential fields needed to create a grid item
 * Can include collectionId if the item was selected from user's collection
 */
export interface AddItemResult {
	/** Unique entity ID (character, weapon, or summon ID) */
	id: string
	/** Granblue game ID */
	granblueId: string
	/** Localized names */
	name: {
		en?: string
		ja?: string
	}
	/** Element type (1-6 for different elements) */
	element?: number
	/** Rarity level */
	rarity?: number
	/** Proficiency - number for weapons, array for characters */
	proficiency?: number | number[]
	/** Collection ID if the item was selected from user's collection */
	collectionId?: string
	/** Type of entity */
	searchableType?: 'Weapon' | 'Character' | 'Summon'
}
