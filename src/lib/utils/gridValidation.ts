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
export function validateGridWeapon(raw: unknown): GridWeapon | null {
	if (!raw || typeof raw !== 'object') return null

	const obj = raw as Record<string, unknown>
	// Handle legacy API responses that use 'object' instead of 'weapon'
	const weapon = (obj.weapon || obj.object) as Record<string, unknown> | undefined

	if (!weapon || !weapon.granblueId) {
		if (import.meta.env.DEV) console.warn('GridWeapon missing nested weapon data:', raw)
		return null
	}

	return {
		...obj,
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
export function validateGridCharacter(raw: unknown): GridCharacter | null {
	if (!raw || typeof raw !== 'object') return null

	const obj = raw as Record<string, unknown>
	const character = (obj.character || obj.object) as Record<string, unknown> | undefined

	if (!character || !character.granblueId) {
		if (import.meta.env.DEV) console.warn('GridCharacter missing nested character data:', raw)
		return null
	}

	return {
		...obj,
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
export function validateGridSummon(raw: unknown): GridSummon | null {
	if (!raw || typeof raw !== 'object') return null

	const obj = raw as Record<string, unknown>
	const summon = (obj.summon || obj.object) as Record<string, unknown> | undefined

	if (!summon || !summon.granblueId) {
		if (import.meta.env.DEV) console.warn('GridSummon missing nested summon data:', raw)
		return null
	}

	return {
		...obj,
		summon,
		object: undefined
	} as GridSummon
}
