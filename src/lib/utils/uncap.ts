/**
 * Utility functions for character uncap calculations
 */

export interface UncapData {
	flb?: boolean
	ulb?: boolean
	transcendence?: boolean
	maxTranscendenceStage?: number
}

export interface CharacterUncapData {
	special: boolean
	uncap: UncapData
}

export interface SummonUncapData {
	uncap: UncapData
}

export interface NormalizedCharacterUncap {
	flb: boolean
	ulb: boolean
	transcendence: boolean
	maxTranscendenceStage: number
	/** True only for responses from before story-character ULB had its own API field. */
	legacySpecialUlb: boolean
}

export interface CharacterProgressionData extends CharacterUncapData {
	hp?: { maxHpUlb?: number; maxHpTranscendence?: number }
	atk?: { maxAtkUlb?: number; maxAtkTranscendence?: number }
	ulbDate?: string
	transcendenceDate?: string
}

export interface NormalizedCharacterProgression extends NormalizedCharacterUncap {
	maxHpUlb: number
	maxHpTranscendence: number
	maxAtkUlb: number
	maxAtkTranscendence: number
	ulbDate: string
	transcendenceDate: string
}

/**
 * Normalizes character uncap capabilities across the old and new API shapes.
 * The legacy fallback can be removed once every deployed API returns `ulb` and
 * `maxTranscendenceStage` for characters.
 */
export function normalizeCharacterUncap(character: CharacterUncapData): NormalizedCharacterUncap {
	const { special, uncap } = character
	const legacySpecialUlb = special && uncap.ulb === undefined && uncap.transcendence === true
	const transcendence = special && legacySpecialUlb ? false : (uncap.transcendence ?? false)

	return {
		flb: uncap.flb ?? false,
		ulb: uncap.ulb ?? legacySpecialUlb,
		transcendence,
		maxTranscendenceStage: transcendence ? (uncap.maxTranscendenceStage ?? 5) : 0,
		legacySpecialUlb
	}
}

/** Moves legacy story-ULB stats and dates out of transcendence fields for editing. */
export function normalizeCharacterProgression(
	character: CharacterProgressionData
): NormalizedCharacterProgression {
	const normalized = normalizeCharacterUncap(character)
	const legacy = normalized.legacySpecialUlb

	return {
		...normalized,
		maxHpUlb: legacy
			? (character.hp?.maxHpUlb ?? character.hp?.maxHpTranscendence ?? 0)
			: (character.hp?.maxHpUlb ?? 0),
		maxHpTranscendence: legacy ? 0 : (character.hp?.maxHpTranscendence ?? 0),
		maxAtkUlb: legacy
			? (character.atk?.maxAtkUlb ?? character.atk?.maxAtkTranscendence ?? 0)
			: (character.atk?.maxAtkUlb ?? 0),
		maxAtkTranscendence: legacy ? 0 : (character.atk?.maxAtkTranscendence ?? 0),
		ulbDate: legacy
			? (character.ulbDate ?? character.transcendenceDate ?? '')
			: (character.ulbDate ?? ''),
		transcendenceDate: legacy ? '' : (character.transcendenceDate ?? '')
	}
}

/**
 * Calculate the maximum uncap level for a character based on their uncap data
 * @param special - Whether the character uses the three-star story-character uncap model
 * @param flb - Whether the character has FLB (4th uncap)
 * @param finalUncap - Whether the character has ULB (special) or transcendence (regular)
 * @returns The maximum uncap level
 */
export function getMaxUncapLevel(special: boolean, flb: boolean, finalUncap: boolean): number {
	if (special) {
		// Special characters: 3 base + FLB + ULB
		return finalUncap ? 5 : flb ? 4 : 3
	} else {
		// Regular characters: 4 base + FLB + transcendence
		return finalUncap ? 6 : flb ? 5 : 4
	}
}

/**
 * Calculate the maximum uncap level from character uncap data
 * @param character - Character data with uncap information
 * @returns The maximum uncap level
 */
export function getCharacterMaxUncapLevel(character: CharacterUncapData): number {
	const uncap = normalizeCharacterUncap(character)
	const finalUncap = character.special ? uncap.ulb : uncap.transcendence
	return getMaxUncapLevel(character.special, uncap.flb, finalUncap)
}

/**
 * Calculate the maximum uncap level from summon uncap data
 * Summons: 3 base, +1 for FLB (4), +1 for ULB (5), transcendence stage tracked separately
 * @param summon - Summon data with uncap information
 * @returns The maximum uncap level
 */
export function getSummonMaxUncapLevel(summon: SummonUncapData): number {
	const { uncap } = summon
	if (uncap.ulb) return 5
	if (uncap.flb) return 4
	return 3
}

/**
 * Get the default max uncap level for an item type (without transcendence)
 * @param type - The type of item (character, weapon, or summon)
 * @returns The default maximum uncap level
 */
export function getDefaultMaxUncapLevel(type: 'character' | 'weapon' | 'summon'): number {
	switch (type) {
		case 'character':
			// Most characters can go to 5* (uncap level 5)
			return 5
		case 'weapon':
		case 'summon':
			// Weapons and summons typically max at 3* without transcendence
			return 3
		default:
			return 3
	}
}
