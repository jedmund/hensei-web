/**
 * Character art: portraits, poses and style swaps
 */

import { getImageUrl, getPlaceholderImage, type ImageVariant } from '$lib/utils/images/core'

/**
 * Calculates the character pose based on uncap level and transcendence
 */
export function getCharacterPose(
	uncapLevel?: number,
	transcendenceStep?: number,
	simplePortraits?: boolean,
	special?: boolean
): string {
	if (transcendenceStep && transcendenceStep > 0) return '04'
	if (special && uncapLevel && uncapLevel >= 5) return '04'
	if (special && uncapLevel && uncapLevel >= 4) return '03'
	if (uncapLevel && uncapLevel >= 5) return '03'
	if (uncapLevel && uncapLevel > 2) return simplePortraits ? '01' : '02'
	return '01'
}

/**
 * Pose suffix for style swap character images.
 * Style swap images are stored as {id}_01_style.{ext}
 */
export const STYLE_SWAP_POSE = '01_style'

/**
 * Get character image URL
 */
export function getCharacterImage(
	id: string | number | null | undefined,
	variant: ImageVariant = 'main',
	pose?: string
): string {
	return getImageUrl('character', id, variant, { pose })
}

/**
 * Get character detail image (PNG) with pose
 */
export function getCharacterDetailImage(
	id: string | number | null | undefined,
	pose?: string
): string {
	return getImageUrl('character', id, 'detail', { pose })
}

/**
 * Get character image with automatic pose calculation
 */
export function getCharacterImageWithPose(
	id: string | number | null | undefined,
	variant: ImageVariant,
	uncapLevel?: number,
	transcendenceStep?: number,
	mainWeaponElement?: number | null,
	partyElement?: number | null,
	styleSwap?: boolean,
	simplePortraits?: boolean,
	characterElement?: number | null,
	gender?: number,
	special?: boolean
): string {
	if (!id) {
		return getPlaceholderImage('character', variant)
	}

	// Style swap characters always use the _01_style pose
	if (styleSwap) {
		return getImageUrl('character', id, variant, { pose: STYLE_SWAP_POSE })
	}

	let pose = getCharacterPose(uncapLevel, transcendenceStep, simplePortraits, special)

	// Null-element characters (element === 0) use element-suffixed images
	// based on the mainhand weapon element or party element.
	if (characterElement === 0 && (mainWeaponElement || partyElement)) {
		const element = mainWeaponElement || partyElement
		pose = `${pose}_0${element}`
	}

	// Gender suffix applies to any character: _0 = Gran, _1 = Djeeta
	if (gender !== undefined && gender !== null) {
		pose = `${pose}_${gender}`
	}

	return getImageUrl('character', id, variant, { pose })
}
