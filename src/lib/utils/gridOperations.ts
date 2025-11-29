/**
 * Grid operation utilities
 * Consolidates duplicated grid CRUD logic
 */

import type { Party } from '$lib/types/api/party'
import type { GridService } from '$lib/services/grid.service'
import type { PartyService } from '$lib/services/party.service'

export type GridItemType = 'character' | 'weapon' | 'summon'
export type GridCollection = 'characters' | 'weapons' | 'summons'

/**
 * Maps grid item type to collection key in Party object
 *
 * @param type - Grid item type (character, weapon, or summon)
 * @returns Collection key name
 *
 * @example
 * ```typescript
 * const key = getCollectionKey('weapon') // Returns: 'weapons'
 * const items = party[key] // Access party.weapons
 * ```
 */
export function getCollectionKey(type: GridItemType): GridCollection {
	const map: Record<GridItemType, GridCollection> = {
		character: 'characters',
		weapon: 'weapons',
		summon: 'summons'
	}
	return map[type]
}

/**
 * Maps operation and grid type to service method name
 *
 * @param operation - CRUD operation type
 * @param type - Grid item type
 * @returns Method name on GridService
 *
 * @example
 * ```typescript
 * const methodName = getGridMethodName('add', 'weapon') // Returns: 'addWeapon'
 * const methodName = getGridMethodName('remove', 'character') // Returns: 'removeCharacter'
 * ```
 */
export function getGridMethodName(
	operation: 'add' | 'move' | 'remove' | 'update',
	type: GridItemType
): string {
	const typeCapitalized = type.charAt(0).toUpperCase() + type.slice(1)
	return `${operation}${typeCapitalized}`
}

/**
 * Execute grid move/swap operation
 * Consolidates handleSwap and handleMove logic
 *
 * @param operationType - Type of operation (move or swap)
 * @param source - Source item information
 * @param target - Target position information
 * @param context - Party context (ID, shortcode, edit key)
 * @param gridService - Grid service instance
 * @param partyService - Party service instance
 * @returns Updated party data
 *
 * @example
 * ```typescript
 * const updated = await executeGridOperation(
 *   'swap',
 *   { type: 'weapon', itemId: 'abc123', position: 0 },
 *   { type: 'weapon', position: 1, itemId: 'def456' },
 *   { partyId: party.id, shortcode: party.shortcode, editKey },
 *   gridService,
 *   partyService
 * )
 * ```
 */
export async function executeGridOperation(
	operationType: 'move' | 'swap',
	source: { type: GridItemType; itemId: string; position: number },
	target: { type: GridItemType; position: number; itemId?: string },
	context: { partyId: string; shortcode: string; editKey?: string },
	gridService: GridService,
	partyService: PartyService
): Promise<Party> {
	// Validation
	if (operationType === 'swap' && !target.itemId) {
		throw new Error('Swap operation requires target item')
	}
	if (operationType === 'move' && target.itemId) {
		throw new Error('Move operation requires empty target')
	}

	// Call appropriate grid service method
	const methodName = getGridMethodName('move', source.type)
	const method = (gridService as any)[methodName]

	if (!method) {
		throw new Error(`Unknown grid method: ${methodName}`)
	}

	await method.call(
		gridService,
		context.partyId,
		source.itemId,
		target.position,
		context.editKey,
		{ shortcode: context.shortcode }
	)

	// Clear cache and refresh party
	partyService.clearPartyCache(context.shortcode)
	return await partyService.getByShortcode(context.shortcode)
}

/**
 * Generic grid item remover
 * Replaces three similar remove{Type} methods in clientGridService
 *
 * @param type - Grid item type to remove
 * @param partyId - Party UUID
 * @param gridItemId - Grid item UUID to remove
 * @param party - Current party state
 * @param shortcode - Party shortcode for cache clearing
 * @param editKey - Optional edit key for authorization
 * @param gridService - Grid service instance
 * @returns Updated party with item removed
 *
 * @example
 * ```typescript
 * const updated = await removeGridItem(
 *   'weapon',
 *   party.id,
 *   gridWeaponId,
 *   party,
 *   party.shortcode,
 *   editKey,
 *   gridService
 * )
 * ```
 */
export async function removeGridItem(
	type: GridItemType,
	partyId: string,
	gridItemId: string,
	party: Party,
	shortcode: string,
	editKey: string | undefined,
	gridService: GridService
): Promise<Party> {
	// Call appropriate remove method
	const methodName = getGridMethodName('remove', type)
	const method = (gridService as any)[methodName]

	await method.call(gridService, partyId, gridItemId, editKey, { shortcode })

	// Update local state by removing item
	const collection = getCollectionKey(type)
	const updatedParty = { ...party }

	if (updatedParty[collection]) {
		updatedParty[collection] = updatedParty[collection].filter(
			(item: any) => item.id !== gridItemId
		)
	}

	return updatedParty
}

/**
 * Generic grid item updater
 * Replaces three similar update{Type} methods
 *
 * @param type - Grid item type to update
 * @param partyId - Party UUID
 * @param gridItemId - Grid item UUID to update
 * @param updates - Object containing fields to update
 * @param editKey - Optional edit key for authorization
 * @param gridService - Grid service instance
 * @returns Updated grid item data
 *
 * @example
 * ```typescript
 * const updated = await updateGridItem(
 *   'weapon',
 *   party.id,
 *   gridWeaponId,
 *   { ax1: 10, ax2: 5 },
 *   editKey,
 *   gridService
 * )
 * ```
 */
export async function updateGridItem(
	type: GridItemType,
	partyId: string,
	gridItemId: string,
	updates: any,
	editKey: string | undefined,
	gridService: GridService
): Promise<any> {
	const methodName = getGridMethodName('update', type)
	const method = (gridService as any)[methodName]

	return await method.call(gridService, partyId, gridItemId, updates, editKey)
}
