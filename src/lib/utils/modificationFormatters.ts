import type { SimpleAxSkill } from '$lib/types/api/entities'

const RING_STAT_NAMES: Record<number, string> = {
  1: 'HP',
  2: 'Attack',
  3: 'Double Attack',
  4: 'Triple Attack',
  5: 'Elemental Attack',
  6: 'Critical Hit',
  7: 'Skill Damage',
  8: 'Skill DMG Cap',
  9: 'Ougi Damage',
  10: 'Ougi DMG Cap',
  11: 'Chain Burst DMG',
  12: 'Chain Burst Cap',
  13: 'Healing',
  14: 'Healing Cap',
  15: 'Stamina',
  16: 'Enmity',
  17: 'Debuff Success'
}

const EARRING_STAT_NAMES: Record<number, string> = {
  1: 'HP',
  2: 'Attack',
  3: 'Defense',
  4: 'Double Attack',
  5: 'Triple Attack',
  6: 'Elemental Attack',
  7: 'Critical Hit',
  8: 'Skill Damage',
  9: 'Skill DMG Cap',
  10: 'Ougi Damage',
  11: 'Ougi DMG Cap',
  12: 'Auto Attack Cap',
  13: 'Chain Burst DMG',
  14: 'Chain Burst Cap',
  15: 'Healing',
  16: 'Healing Cap'
}

const AX_SKILL_NAMES: Record<number, string> = {
  1: 'Attack',
  2: 'HP',
  3: 'Double Attack',
  4: 'Triple Attack',
  5: 'C.A. DMG',
  6: 'C.A. DMG Cap',
  7: 'Skill DMG',
  8: 'Skill DMG Cap',
  9: 'Stamina',
  10: 'Enmity',
  11: 'Critical Hit'
}

export function formatRingStat(modifier: number, strength: number): string {
  const statName = RING_STAT_NAMES[modifier] || `Unknown (${modifier})`
  const suffix = modifier <= 2 ? '' : '%'
  return `${statName} +${strength}${suffix}`
}

export function formatEarringStat(modifier: number, strength: number): string {
  const statName = EARRING_STAT_NAMES[modifier] || `Unknown (${modifier})`
  const suffix = modifier <= 3 ? '' : '%'
  return `${statName} +${strength}${suffix}`
}

export function formatAxSkill(ax: SimpleAxSkill): string {
  const skillName = AX_SKILL_NAMES[ax.modifier] || `Unknown (${ax.modifier})`
  const suffix = ax.modifier <= 2 ? '' : '%'
  return `${skillName} +${ax.strength}${suffix}`
}

export function getWeaponKeyTitle(series?: number): string {
  switch (series) {
    case 2:
      return 'Opus Pendulums'
    case 3:
    case 34:
      return 'Draconic Telumas'
    case 17:
      return 'Ultima Keys'
    case 22:
      return 'Revans Emblems'
    default:
      return 'Weapon Keys'
  }
}

export function formatUncapLevel(level?: number | null): string {
  if (level === undefined || level === null) return '0★'
  return `${level}★`
}

export function formatTranscendenceStep(step?: number | null): string {
  if (!step || step === 0) return ''
  return `Stage ${step}`
}

export function getStatModifierIcon(type: 'ring' | 'earring', modifier: number): string | null {
  return null
}

export function getElementName(element?: number | null): string {
  switch (element) {
    case 0: return 'Null'
    case 1: return 'Wind'
    case 2: return 'Fire'
    case 3: return 'Water'
    case 4: return 'Earth'
    case 5: return 'Dark'
    case 6: return 'Light'
    default: return 'Unknown'
  }
}