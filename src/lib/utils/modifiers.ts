/**
 * Utility functions for weapon and character modifiers (awakenings, weapon keys, AX skills)
 */

import type { Awakening, WeaponKey } from '$lib/types/api/entities'
import type { AugmentSkill, Befoulment } from '$lib/types/api/weaponStatModifier'
import { getBasePath } from '$lib/utils/images'
import { localizedName } from '$lib/utils/locale'

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
 * Get the image URL for a weapon key
 * Gauph keys (ultima slot 0) require a proficiency suffix for the correct image variant
 */
export function getWeaponKeyImage(key: WeaponKey, weaponProficiency?: number): string {
	if (!key.slug) return ''

	let filename = key.slug

	// Gauph keys have proficiency-specific image variants
	const hasVariant = [
		'gauph-courage',
		'gauph-strength',
		'gauph-strife',
		'gauph-vitality',
		'gauph-will',
		'gauph-zeal'
	]

	if (hasVariant.includes(key.slug)) {
		filename += `-${weaponProficiency}`
	}

	return `${getBasePath()}/weapon-keys/${filename}.png`
}

/**
 * Get all weapon key images for a weapon
 */
export function getWeaponKeyImages(
	keys?: WeaponKey[],
	weaponProficiency?: number
): Array<{ url: string; alt: string }> {
	if (!keys || keys.length === 0) return []

	return keys
		.filter((key) => key.slug)
		.map((key) => ({
			url: getWeaponKeyImage(key, weaponProficiency),
			alt: key.name ? localizedName(key.name) : key.slug || 'Weapon Key'
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

/**
 * Get befoulment image for a weapon
 */
export function getBefoulmentImages(
	befoulment?: Befoulment | null
): Array<{ url: string; alt: string }> {
	if (!befoulment?.modifier?.slug) return []

	return [
		{
			url: `${getBasePath()}/ax/${befoulment.modifier.slug}.png`,
			alt: befoulment.modifier.nameEn || befoulment.modifier.slug || 'Befoulment'
		}
	]
}
