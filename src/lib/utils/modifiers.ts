/**
 * Utility functions for weapon and character modifiers (awakenings, weapon keys, AX skills)
 */

import type { Awakening } from '$lib/types/Awakening'
import type { WeaponKey } from '$lib/types/api/entities'
import type { SimpleAxSkill } from '$lib/types/SimpleAxSkill'

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

	return `/images/awakening/${slug}.${extension}`
}

/**
 * Get the image URL for a weapon key with proper element/proficiency/mod variants
 */
export function getWeaponKeyImage(
	key: WeaponKey,
	weaponElement?: number,
	weaponProficiency?: number,
	weaponSeries?: number,
	weaponName?: { en?: string }
): string {
	if (!key.slug) return ''

	const baseUrl = '/images/weapon-keys/'
	let filename = key.slug

	// Handle element-specific telumas (Draconic weapons)
	const elementalTelumas = [15008, 16001, 16002]
	const granblueId = parseInt(key.granblue_id || '0')

	if (elementalTelumas.includes(granblueId) && weaponElement) {
		filename += `-${weaponElement}`
	}

	// Handle proficiency-specific ultima keys (slot 0)
	if (key.slot === 0 && weaponSeries === 17 && weaponProficiency) {
		filename += `-${weaponProficiency}`
	}

	// Handle element-specific opus pendulums (slot 1)
	if (weaponSeries === 2 && key.slot === 1 && weaponElement) {
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
	weaponProficiency?: number,
	weaponSeries?: number,
	weaponName?: { en?: string }
): Array<{ url: string; alt: string }> {
	if (!keys || keys.length === 0) return []

	return keys
		.filter(key => key.slug)
		.map(key => ({
			url: getWeaponKeyImage(key, weaponElement, weaponProficiency, weaponSeries, weaponName),
			alt: key.name?.en || key.slug || 'Weapon Key'
		}))
}

/**
 * Get the image URL for an AX skill
 * Note: Requires ax data reference implementation
 */
export function getAxSkillImage(axSkill?: { slug?: string }): string | null {
	if (!axSkill?.slug) return null
	return `/images/ax/${axSkill.slug}.png`
}

/**
 * Get all AX skill images for a weapon
 * Note: This is a placeholder until ax data structure is fully implemented
 */
export function getAxSkillImages(ax?: SimpleAxSkill[]): Array<{ url: string; alt: string }> {
	// TODO: Implement when ax data reference is available
	// This would need to map ax modifiers to actual ax skill data
	return []
}