/**
 * Conflict Types
 *
 * Type definitions for conflict detection and resolution when adding
 * characters or weapons to a party that would violate uniqueness constraints.
 *
 * @module types/api/conflict
 */

import type { Character, Weapon } from './entities'
import type { GridCharacter, GridWeapon } from './party'

/**
 * Types of units that can have conflicts
 */
export type ConflictType = 'character' | 'weapon'

/**
 * Conflict data when adding a character that already exists in the party
 */
export interface CharacterConflictData {
	type: 'character'
	position: number
	conflicts: GridCharacter[]
	incoming: Character
}

/**
 * Conflict data when adding a weapon that violates series constraints
 */
export interface WeaponConflictData {
	type: 'weapon'
	position: number
	conflicts: GridWeapon[]
	incoming: Weapon
}

/**
 * Union type for all conflict data
 */
export type ConflictData = CharacterConflictData | WeaponConflictData

/**
 * Raw conflict response from API (before adding type discriminator)
 */
export interface RawConflictResponse {
	position: number
	conflicts: unknown[]
	incoming: unknown
}

/**
 * Type guard to check if an API response is a conflict response.
 * Conflict responses have `conflicts`, `incoming`, and `position` properties.
 *
 * @param data - The API response data to check
 * @returns True if the response is a conflict response
 */
export function isConflictResponse(data: unknown): data is RawConflictResponse {
	return (
		data !== null &&
		typeof data === 'object' &&
		'conflicts' in data &&
		'incoming' in data &&
		'position' in data &&
		Array.isArray((data as RawConflictResponse).conflicts)
	)
}

/**
 * Creates typed ConflictData from a raw API conflict response.
 *
 * @param raw - The raw conflict response from the API
 * @param type - The type of conflict ('character' or 'weapon')
 * @returns Typed ConflictData ready for use in ConflictDialog
 */
export function createConflictData(raw: RawConflictResponse, type: ConflictType): ConflictData {
	if (type === 'character') {
		return {
			type: 'character',
			position: raw.position,
			conflicts: raw.conflicts as GridCharacter[],
			incoming: raw.incoming as Character
		}
	}
	return {
		type: 'weapon',
		position: raw.position,
		conflicts: raw.conflicts as GridWeapon[],
		incoming: raw.incoming as Weapon
	}
}
