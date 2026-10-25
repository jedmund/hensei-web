import type { AugmentSkill } from '$lib/types/api/weaponStatModifier'
import { getRingStat, getEarringStat, getElementalizedEarringStat } from './masteryUtils'
import type { WeaponSeriesRef, WeaponSeriesSummary } from '$lib/types/api/weaponSeries'
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

export function getWeaponKeyTitle(series?: WeaponSeriesRef | WeaponSeriesSummary | null): string {
	if (typeof series?.slug !== 'string') {
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getStatModifierIcon(_type: 'ring' | 'earring', _modifier: number): string | null {
	return null
}
