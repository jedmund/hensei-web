import { getPlaceholderImage } from '$lib/utils/images/core'

// ===== Game CDN Images =====
// For new items not yet in our AWS CDN (used in batch import)

const GAME_CDN_BASE = 'https://prd-game-a-granbluefantasy.akamaized.net/assets_en/img/sp/assets'

/**
 * Get character image from the game CDN
 * Used for batch imports where images aren't yet in AWS
 */
export function getGameCdnCharacterImage(
	id: string | number | null | undefined,
	pose: string = '01'
): string {
	if (!id) return getPlaceholderImage('character', 'square')
	return `${GAME_CDN_BASE}/npc/s/${id}_${pose}.jpg`
}

/**
 * Get weapon image from the game CDN
 * Used for batch imports where images aren't yet in AWS
 */
export function getGameCdnWeaponImage(id: string | number | null | undefined): string {
	if (!id) return getPlaceholderImage('weapon', 'square')
	return `${GAME_CDN_BASE}/weapon/s/${id}.jpg`
}

/**
 * Get summon image from the game CDN
 * Used for batch imports where images aren't yet in AWS
 */
export function getGameCdnSummonImage(id: string | number | null | undefined): string {
	if (!id) return getPlaceholderImage('summon', 'square')
	return `${GAME_CDN_BASE}/summon/s/${id}.jpg`
}
