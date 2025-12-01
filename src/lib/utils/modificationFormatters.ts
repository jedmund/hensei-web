import type { SimpleAxSkill } from '$lib/types/api/entities'
import { getRingStat, getEarringStat, getElementalizedEarringStat } from './masteryUtils'

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

export function formatRingStat(
	modifier: number,
	strength: number,
	locale: 'en' | 'ja' = 'en'
): string {
	const stat = getRingStat(modifier)
	if (!stat) return `Unknown +${strength}`

	const statName = stat.name[locale]
	return `${statName} +${strength}${stat.suffix}`
}

export function formatEarringStat(
	modifier: number,
	strength: number,
	locale: 'en' | 'ja' = 'en',
	characterElement?: number
): string {
	// Use elementalized version if element is provided and it's an element-specific stat
	const stat =
		characterElement !== undefined && (modifier === 3 || modifier === 4)
			? getElementalizedEarringStat(modifier, characterElement, locale)
			: getEarringStat(modifier)

	if (!stat) return `Unknown +${strength}`

	const statName = stat.name[locale]
	return `${statName} +${strength}${stat.suffix}`
}

export function formatAxSkill(ax: SimpleAxSkill): string {
	const skillName = AX_SKILL_NAMES[ax.modifier] || `Unknown (${ax.modifier})`
	const suffix = ax.modifier <= 2 ? '' : '%'
	return `${skillName} +${ax.strength}${suffix}`
}

export function getWeaponKeyTitle(series?: number): string {
	switch (series) {
		case 2:
			return 'Pendulums & Chains'
		case 3:
		case 34:
			return 'Telumas'
		case 17:
			return 'Ultima Keys'
		case 22:
			return 'Emblems'
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
		case 0:
			return 'Null'
		case 1:
			return 'Wind'
		case 2:
			return 'Fire'
		case 3:
			return 'Water'
		case 4:
			return 'Earth'
		case 5:
			return 'Dark'
		case 6:
			return 'Light'
		default:
			return 'Unknown'
	}
}
