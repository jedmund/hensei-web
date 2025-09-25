import type { GridCharacter, GridWeapon, GridSummon } from '$lib/types/api/party'

export interface ModificationStatus {
  hasModifications: boolean
  hasAwakening: boolean
  hasWeaponKeys: boolean
  hasAxSkills: boolean
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
    status.hasRings = !!(char.over_mastery && char.over_mastery.length > 0)
    status.hasEarring = !!char.aetherial_mastery
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
    status.hasTranscendence = !!(weapon.transcendenceStep && weapon.transcendenceStep > 0)
    status.hasUncapLevel = weapon.uncapLevel !== undefined && weapon.uncapLevel !== null
    status.hasElement = !!(weapon.element && weapon.weapon?.element === 0)

    status.hasModifications =
      status.hasAwakening ||
      status.hasWeaponKeys ||
      status.hasAxSkills ||
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