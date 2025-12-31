import type { GridCharacter, GridWeapon, GridSummon } from '$lib/types/api/party'
import { seriesHasWeaponKeys } from '$lib/utils/weaponSeries'

export interface ModificationStatus {
	hasModifications: boolean
	hasAwakening: boolean
	hasWeaponKeys: boolean
	hasAxSkills: boolean
	hasBefoulment: boolean
	hasRings: boolean
	hasEarring: boolean
	hasPerpetuity: boolean
	hasTranscendence: boolean
	hasUncapLevel: boolean
	hasElement: boolean
	hasQuickSummon: boolean
	hasFriendSummon: boolean
}

export function detectModifications(
	type: 'character' | 'weapon' | 'summon',
	item: GridCharacter | GridWeapon | GridSummon | undefined
): ModificationStatus {
	const status: ModificationStatus = {
		hasModifications: false,
		hasAwakening: false,
		hasWeaponKeys: false,
		hasAxSkills: false,
		hasBefoulment: false,
		hasRings: false,
		hasEarring: false,
		hasPerpetuity: false,
		hasTranscendence: false,
		hasUncapLevel: false,
		hasElement: false,
		hasQuickSummon: false,
		hasFriendSummon: false
	}

	if (!item) return status

	if (type === 'character') {
		const char = item as GridCharacter

		status.hasAwakening = !!char.awakening
		status.hasRings = !!(char.overMastery && char.overMastery.length > 0)
		status.hasEarring = !!char.aetherialMastery
		status.hasPerpetuity = !!char.perpetuity
		status.hasTranscendence = !!(char.transcendenceStep && char.transcendenceStep > 0)
		status.hasUncapLevel = char.uncapLevel !== undefined && char.uncapLevel !== null

		status.hasModifications =
			status.hasAwakening ||
			status.hasRings ||
			status.hasEarring ||
			status.hasPerpetuity ||
			status.hasTranscendence ||
			status.hasUncapLevel
	} else if (type === 'weapon') {
		const weapon = item as GridWeapon

		status.hasAwakening = !!weapon.awakening
		status.hasWeaponKeys = !!(weapon.weaponKeys && weapon.weaponKeys.length > 0)
		status.hasAxSkills = !!(weapon.ax && weapon.ax.length > 0)
		status.hasBefoulment = !!weapon.befoulment?.modifier
		status.hasTranscendence = !!(weapon.transcendenceStep && weapon.transcendenceStep > 0)
		status.hasUncapLevel = weapon.uncapLevel !== undefined && weapon.uncapLevel !== null
		status.hasElement = !!(weapon.element && weapon.weapon?.element === 0)

		status.hasModifications =
			status.hasAwakening ||
			status.hasWeaponKeys ||
			status.hasAxSkills ||
			status.hasBefoulment ||
			status.hasTranscendence ||
			status.hasUncapLevel ||
			status.hasElement
	} else if (type === 'summon') {
		const summon = item as GridSummon

		status.hasTranscendence = !!(summon.transcendenceStep && summon.transcendenceStep > 0)
		status.hasUncapLevel = summon.uncapLevel !== undefined && summon.uncapLevel !== null
		status.hasQuickSummon = !!summon.quickSummon
		status.hasFriendSummon = !!summon.friend

		status.hasModifications =
			status.hasTranscendence ||
			status.hasUncapLevel ||
			status.hasQuickSummon ||
			status.hasFriendSummon
	}

	return status
}

export function hasAnyModification(
	type: 'character' | 'weapon' | 'summon',
	item: GridCharacter | GridWeapon | GridSummon | undefined
): boolean {
	return detectModifications(type, item).hasModifications
}

/**
 * Check if a weapon CAN be modified (has modifiable properties)
 * This is different from hasModifications which checks if it HAS been modified
 */
export function canWeaponBeModified(gridWeapon: GridWeapon | undefined): boolean {
	if (!gridWeapon?.weapon) return false

	const weapon = gridWeapon.weapon

	// Element can be changed (element = 0 means "any element")
	const canChangeElement = weapon.element === 0

	// Weapon keys (series-specific) - use utility function that handles both formats
	const hasWeaponKeys = seriesHasWeaponKeys(weapon.series)

	// AX skills or Befoulment - check augmentType from series
	const augmentType = weapon.series?.augmentType ?? 'none'
	const hasAugments = augmentType !== 'none'

	// Awakening (maxAwakeningLevel > 0 means it can have awakening)
	const hasAwakening = (weapon.maxAwakeningLevel ?? 0) > 0

	return canChangeElement || hasWeaponKeys || hasAugments || hasAwakening
}

/**
 * Check if a character CAN be modified (has modifiable properties)
 * This is different from hasModifications which checks if it HAS been modified
 */
export function canCharacterBeModified(gridCharacter: GridCharacter | undefined): boolean {
	if (!gridCharacter?.character) return false

	const character = gridCharacter.character

	// Awakening (maxAwakeningLevel > 0 means it can have awakening)
	const hasAwakening = (character.maxAwakeningLevel ?? 0) > 0

	// All characters can have rings (Over Mastery)
	const canHaveRings = true

	// All characters can have earrings (Aetherial Mastery)
	const canHaveEarring = true

	// Perpetuity is only for non-MC characters (position > 0)
	const canHavePerpetuity = gridCharacter.position > 0

	return hasAwakening || canHaveRings || canHaveEarring || canHavePerpetuity
}
