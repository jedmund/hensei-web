/**
 * Grid state update utilities
 * Handles optimistic updates for uncap levels and other grid item properties
 */

import type { Party } from '$lib/types/api/party'
import type { GridService } from '$lib/services/grid.service'
import type { GridItemType, GridCollection } from './gridOperations'
import { getCollectionKey } from './gridOperations'

export interface UncapUpdateParams {
	gridItemId: string
	uncapLevel?: number
	transcendenceStep?: number
}

/**
 * Generic function to update uncap levels for any grid item type
 * Replaces updateCharacterUncap, updateWeaponUncap, updateSummonUncap
 *
 * @param itemType - Type of grid item (character, weapon, or summon)
 * @param params - Uncap update parameters
 * @param partyId - Party UUID
 * @param currentParty - Current party state
 * @param editKey - Optional edit key for authorization
 * @param gridService - Grid service instance
 * @returns Updated party with modified uncap levels
 *
 * @example
 * ```typescript
 * const updated = await updateGridItemUncap(
 *   'weapon',
 *   { gridItemId: 'abc123', uncapLevel: 4, transcendenceStep: 1 },
 *   party.id,
 *   party,
 *   editKey,
 *   gridService
 * )
 * ```
 */
export async function updateGridItemUncap(
	itemType: GridItemType,
	params: UncapUpdateParams,
	partyId: string,
	currentParty: Party,
	editKey: string | undefined,
	gridService: GridService
): Promise<Party> {
	// Get configuration for this item type
	const config = getGridItemConfig(itemType)

	// Call appropriate service method
	const response = await config.updateMethod(
		gridService,
		partyId,
		params.gridItemId,
		params.uncapLevel,
		params.transcendenceStep,
		editKey
	)

	// Extract updated item from response (handle both camelCase and snake_case)
	const updatedItem = response[config.responseKey] || response[config.snakeCaseKey]
	if (!updatedItem) return currentParty

	// Update party state optimistically
	return mergeUpdatedGridItem(currentParty, config.collectionKey, params.gridItemId, {
		uncapLevel: updatedItem.uncapLevel ?? updatedItem.uncap_level,
		transcendenceStep: updatedItem.transcendenceStep ?? updatedItem.transcendence_step
	})
}

/**
 * Configuration map for grid item types
 */
function getGridItemConfig(itemType: GridItemType) {
	const configs = {
		character: {
			updateMethod: (gs: GridService, ...args: any[]) => gs.updateCharacterUncap(...args),
			responseKey: 'gridCharacter',
			snakeCaseKey: 'grid_character',
			collectionKey: 'characters' as GridCollection
		},
		weapon: {
			updateMethod: (gs: GridService, ...args: any[]) => gs.updateWeaponUncap(...args),
			responseKey: 'gridWeapon',
			snakeCaseKey: 'grid_weapon',
			collectionKey: 'weapons' as GridCollection
		},
		summon: {
			updateMethod: (gs: GridService, ...args: any[]) => gs.updateSummonUncap(...args),
			responseKey: 'gridSummon',
			snakeCaseKey: 'grid_summon',
			collectionKey: 'summons' as GridCollection
		}
	}

	return configs[itemType]
}

/**
 * Merges updates into a grid item within party state
 * Preserves immutability by creating new objects
 *
 * @param party - Current party state
 * @param collection - Collection key (characters, weapons, or summons)
 * @param itemId - Grid item ID to update
 * @param updates - Fields to update
 * @returns New party object with updates applied
 */
function mergeUpdatedGridItem(
	party: Party,
	collection: GridCollection,
	itemId: string,
	updates: any
): Party {
	const updatedParty = { ...party }
	const items = updatedParty[collection]

	if (!items) return party

	const itemIndex = items.findIndex((item: any) => item.id === itemId)
	if (itemIndex === -1) return party

	const existingItem = items[itemIndex]
	if (!existingItem) return party

	// Merge updates while preserving essential properties
	items[itemIndex] = {
		...existingItem,
		...updates,
		id: existingItem.id,
		position: existingItem.position
	}

	return updatedParty
}
