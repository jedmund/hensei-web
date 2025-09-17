/**
 * Utility functions for character uncap calculations
 */

export interface UncapData {
	flb: boolean
	ulb: boolean
	transcendence?: boolean
}

export interface CharacterUncapData {
	special: boolean
	uncap: UncapData
}

/**
 * Calculate the maximum uncap level for a character based on their uncap data
 * @param special - Whether the character is special (limited/seasonal)
 * @param flb - Whether the character has FLB (4th uncap)
 * @param ulb - Whether the character has ULB (5th uncap)
 * @returns The maximum uncap level
 */
export function getMaxUncapLevel(special: boolean, flb: boolean, ulb: boolean): number {
	if (special) {
		// Special characters: 3 base + FLB + ULB
		return ulb ? 5 : flb ? 4 : 3
	} else {
		// Regular characters: 4 base + FLB + ULB/transcendence
		return ulb ? 6 : flb ? 5 : 4
	}
}

/**
 * Calculate the maximum uncap level from character uncap data
 * @param character - Character data with uncap information
 * @returns The maximum uncap level
 */
export function getCharacterMaxUncapLevel(character: CharacterUncapData): number {
	const { special, uncap } = character
	return getMaxUncapLevel(special, uncap.flb, uncap.ulb)
}
