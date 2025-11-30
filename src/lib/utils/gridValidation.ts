/**
 * Grid Validation Utilities
 *
 * Validates and normalizes grid item data from API responses.
 * Handles legacy 'object' property and ensures complete nested entity data.
 *
 * @module utils/gridValidation
 */

import type { GridWeapon, GridCharacter, GridSummon } from '$lib/types/api/party'

/**
 * Validates that a GridWeapon has complete nested weapon data.
 * Normalizes legacy 'object' property to 'weapon' if needed.
 *
 * @param raw - Raw grid weapon data from API
 * @returns Validated GridWeapon or null if incomplete
 *
 * @example
 * ```typescript
 * // Valid data
 * const validated = validateGridWeapon({
 *   id: '123',
 *   position: 0,
 *   weapon: { granblueId: '1040', name: {...} }
 * })
 *
 * // Legacy data with 'object' property
 * const validated = validateGridWeapon({
 *   id: '123',
 *   position: 0,
 *   object: { granblueId: '1040', name: {...} }
 * }) // Automatically normalized to 'weapon'
 * ```
 */
export function validateGridWeapon(raw: any): GridWeapon | null {
	if (!raw || typeof raw !== 'object') return null

	// Handle legacy API responses that use 'object' instead of 'weapon'
	const weapon = raw.weapon || raw.object

	if (!weapon || !weapon.granblueId) {
		console.warn('GridWeapon missing nested weapon data:', raw)
		return null
	}

	return {
		...raw,
		weapon, // Ensure 'weapon' property exists
		object: undefined // Remove legacy 'object' property
	} as GridWeapon
}

/**
 * Validates that a GridCharacter has complete nested character data.
 * Normalizes legacy 'object' property to 'character' if needed.
 *
 * @param raw - Raw grid character data from API
 * @returns Validated GridCharacter or null if incomplete
 */
export function validateGridCharacter(raw: any): GridCharacter | null {
	if (!raw || typeof raw !== 'object') return null

	const character = raw.character || raw.object

	if (!character || !character.granblueId) {
		console.warn('GridCharacter missing nested character data:', raw)
		return null
	}

	return {
		...raw,
		character,
		object: undefined
	} as GridCharacter
}

/**
 * Validates that a GridSummon has complete nested summon data.
 * Normalizes legacy 'object' property to 'summon' if needed.
 *
 * @param raw - Raw grid summon data from API
 * @returns Validated GridSummon or null if incomplete
 */
export function validateGridSummon(raw: any): GridSummon | null {
	if (!raw || typeof raw !== 'object') return null

	const summon = raw.summon || raw.object

	if (!summon || !summon.granblueId) {
		console.warn('GridSummon missing nested summon data:', raw)
		return null
	}

	return {
		...raw,
		summon,
		object: undefined
	} as GridSummon
}
