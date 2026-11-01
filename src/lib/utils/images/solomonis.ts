/**
 * Evoking Solomonis images: guidebook effects, blessings and spaces
 */

import { BUCKET, getBasePath } from '$lib/utils/images/core'

/**
 * Get an Evoking Solomonis guidebook effect icon, keyed by the game's icon_type
 */
export function getGuideEffectIcon(iconType: number): string {
	return `${getBasePath()}/${BUCKET.guideEffects}/${iconType}.png`
}

export type BlessingImageVariant = 'icon' | 'card' | 'card-list'

/**
 * Get an Arcarum Blessing image by the blessing's slug: the round icon for
 * lists, or the tarot card at full (`card`) or picker (`card-list`) size
 */
export function getBlessingImage(slug: string, variant: BlessingImageVariant = 'icon'): string {
	return `${getBasePath()}/${BUCKET.blessings}/${variant}/${slug}.png`
}

/**
 * Get an Evoking Solomonis space icon (battle, boss, chest…), by stat key
 */
export function getSolomonisSpaceIcon(key: string): string {
	return `${getBasePath()}/${BUCKET.solomonisSpaces}/${key}.png`
}
