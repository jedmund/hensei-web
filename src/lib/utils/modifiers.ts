/**
 * Utility functions for weapon and character modifiers (awakenings, weapon keys, AX skills)
 */

import type { Awakening, WeaponKey } from '$lib/types/api/entities'
import type { AugmentSkill } from '$lib/types/api/weaponStatModifier'
import { isWeaponSeriesRef, type WeaponSeriesRef } from '$lib/types/api/weaponSeries'
import { getBasePath } from '$lib/utils/images'

/**
 * Get the image URL for an awakening type
 */
export function getAwakeningImage(awakening?: { type?: Awakening; level?: number }): string | null {
	if (!awakening?.type?.slug) return null

	const slug = awakening.type.slug

	// No image for Balanced awakening type (character only)
	if (slug === 'character-balanced') return null

	// Character awakenings are JPG, weapon awakenings are PNG
	const isCharacterAwakening = slug.startsWith('character-')
	const extension = isCharacterAwakening ? 'jpg' : 'png'

	return `${getBasePath()}/awakening/${slug}.${extension}`
}

/**
 * Helper to get series slug from WeaponSeriesRef
 */
function getSeriesSlug(series?: WeaponSeriesRef | null): string | undefined {
	if (!isWeaponSeriesRef(series)) {
		return undefined
	}
	return series.slug
}

/**
 * Get the image URL for a weapon key with proper element/proficiency/mod variants
 */
export function getWeaponKeyImage(
	key: WeaponKey,
	weaponElement?: number,
	weaponProficiency?: number,
	weaponSeries?: WeaponSeriesRef | null,
	weaponName?: { en?: string }
): string {
	if (!key.slug) return ''

	const baseUrl = `${getBasePath()}/weapon-keys/`
	let filename = key.slug

	// Get series slug for comparison
	const seriesSlug = getSeriesSlug(weaponSeries)

	// Handle element-specific telumas (Draconic weapons)
	const elementalTelumas = [15008, 16001, 16002]
	const granblueId = key.granblue_id ?? 0

	if (elementalTelumas.includes(granblueId) && weaponElement) {
		filename += `-${weaponElement}`
	}

	// Handle proficiency-specific ultima keys (slot 0)
	if (key.slot === 0 && seriesSlug === 'ultima' && weaponProficiency) {
		filename += `-${weaponProficiency}`
	}

	// Handle element-specific opus pendulums (slot 1)
	if (seriesSlug === 'dark-opus' && key.slot === 1 && weaponElement) {
		const mod = weaponName?.en?.includes('Repudiation') ? 'primal' : 'magna'
		const suffixes = [
			'pendulum-strength',
			'pendulum-zeal',
			'pendulum-strife',
			'chain-temperament',
			'chain-restoration',
			'chain-glorification'
		]

		if (suffixes.includes(key.slug)) {
			filename += `-${mod}-${weaponElement}`
		}
	}

	return `${baseUrl}${filename}.png`
}

/**
 * Get all weapon key images for a weapon
 */
export function getWeaponKeyImages(
	keys?: WeaponKey[],
	weaponElement?: number,
	weaponProficiency?: number | number[],
	weaponSeries?: WeaponSeriesRef | null,
	weaponName?: { en?: string }
): Array<{ url: string; alt: string }> {
	if (!keys || keys.length === 0) return []

	// Handle proficiency being an array (take first element)
	const proficiency = Array.isArray(weaponProficiency) ? weaponProficiency[0] : weaponProficiency

	return keys
		.filter(key => key.slug)
		.map(key => ({
			url: getWeaponKeyImage(key, weaponElement, proficiency, weaponSeries, weaponName),
			alt: key.name?.en || key.slug || 'Weapon Key'
		}))
}

/**
 * Get the image URL for an AX skill
 * Note: Requires ax data reference implementation
 */
export function getAxSkillImage(axSkill?: { slug?: string }): string | null {
	if (!axSkill?.slug) return null
	return `${getBasePath()}/ax/${axSkill.slug}.png`
}

/**
 * Get all AX skill images for a weapon
 */
export function getAxSkillImages(ax?: AugmentSkill[]): Array<{ url: string; alt: string }> {
	if (!ax || ax.length === 0) return []

	return ax
		.filter((skill) => skill.modifier?.slug)
		.map((skill) => ({
			url: `${getBasePath()}/ax/${skill.modifier.slug}.png`,
			alt: skill.modifier.nameEn || skill.modifier.slug || 'AX Skill'
		}))
}