/**
 * Utility functions for weapon and character modifiers (awakenings, weapon keys, AX skills)
 */

import type { Awakening, WeaponKey } from '$lib/types/api/entities'
import type { AugmentSkill } from '$lib/types/api/weaponStatModifier'
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
 */
export function getWeaponKeyImage(key: WeaponKey): string {
	if (!key.slug) return ''
	return `${getBasePath()}/weapon-keys/${key.slug}.png`
}

/**
 * Get all weapon key images for a weapon
 */
export function getWeaponKeyImages(
	keys?: WeaponKey[]
): Array<{ url: string; alt: string }> {
	if (!keys || keys.length === 0) return []

	return keys
		.filter(key => key.slug)
		.map(key => ({
			url: getWeaponKeyImage(key),
			alt: key.name ? localizedName(key.name) : (key.slug || 'Weapon Key')
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