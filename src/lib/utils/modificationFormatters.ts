import type { AugmentSkill } from '$lib/types/api/weaponStatModifier'
import { getRingStat, getEarringStat, getElementalizedEarringStat } from './masteryUtils'
import { isWeaponSeriesRef, type WeaponSeriesRef } from '$lib/types/api/weaponSeries'
import * as m from '$lib/paraglide/messages'

export function formatRingStat(
	modifier: number,
	strength: number,
	locale: 'en' | 'ja' = 'en'
): string {
	const stat = getRingStat(modifier)
	if (!stat) return m.modifier_unknown({ strength: String(strength) })

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

	if (!stat) return m.modifier_unknown({ strength: String(strength) })

	const statName = stat.name[locale]
	return `${statName} +${strength}${stat.suffix}`
}

export function formatAxSkill(ax: AugmentSkill, locale: 'en' | 'ja' = 'en'): string {
	const skillName = locale === 'ja' ? ax.modifier.nameJp : ax.modifier.nameEn
	const suffix = ax.modifier.suffix ?? ''
	return `${skillName} +${ax.strength}${suffix}`
}

export function getWeaponKeyTitle(series?: WeaponSeriesRef | null): string {
	if (!isWeaponSeriesRef(series)) {
		return m.details_weapon_keys()
	}

	switch (series.slug) {
		case 'dark-opus':
			return m.details_weapon_key_pendulums()
		case 'draconic':
		case 'draconic-providence':
		case 'superlative':
			return m.details_weapon_key_telumas()
		case 'ultima':
			return m.details_weapon_key_ultima()
		case 'astral':
			return m.details_weapon_key_emblems()
		default:
			return m.details_weapon_keys()
	}
}

export function formatUncapLevel(level?: number | null): string {
	if (level === undefined || level === null) return '0★'
	return `${level}★`
}

export function formatTranscendenceStep(step?: number | null): string {
	if (!step || step === 0) return ''
	return m.transcendence_stage({ step: String(step) })
}

export function getStatModifierIcon(type: 'ring' | 'earring', modifier: number): string | null {
	return null
}

export function getElementName(element?: number | null): string {
	switch (element) {
		case 0:
			return m.element_null()
		case 1:
			return m.element_wind()
		case 2:
			return m.element_fire()
		case 3:
			return m.element_water()
		case 4:
			return m.element_earth()
		case 5:
			return m.element_dark()
		case 6:
			return m.element_light()
		default:
			return m.mention_unknown()
	}
}
