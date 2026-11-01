import { BUCKET, getBasePath, getGenericPlaceholder } from '$lib/utils/images/core'

const BUILD_TIMESTAMP = __BUILD_TIMESTAMP__

// ===== Raid Images =====

export type RaidImageVariant = 'icon' | 'thumbnail' | 'lobby' | 'background'

// Game CDN URLs for raid images
const RAID_ICON_CDN =
	'https://prd-game-a-granbluefantasy.akamaized.net/assets_en/img/sp/assets/enemy/m'
const RAID_THUMBNAIL_CDN =
	'https://prd-game-a1-granbluefantasy.akamaized.net/assets_en/img/sp/assets/summon/qm'
const RAID_LOBBY_CDN =
	'https://prd-game-a1-granbluefantasy.akamaized.net/assets_en/img/sp/quest/assets/lobby'
const RAID_BACKGROUND_CDN =
	'https://prd-game-a-granbluefantasy.akamaized.net/assets_en/img/sp/quest/assets/treasureraid'

/**
 * Get raid image URL (stored images from our CDN/local)
 * @param variant - 'icon', 'thumbnail', 'lobby', or 'background'
 */
export function getRaidImage(
	slug: string | undefined,
	/** Stored sizes: the CDN's, plus 'banner' (the battle's news art, 588×256) */
	variant: RaidImageVariant | 'banner' = 'thumbnail'
): string {
	if (!slug) return getGenericPlaceholder()
	return `${getBasePath()}/${BUCKET.raids}/${variant}/${slug}.png?v=${BUILD_TIMESTAMP}`
}

/**
 * Get raid image from game CDN (for images tab and initial downloads)
 * @param variant - 'icon', 'thumbnail', 'lobby', or 'background'
 * @param id - enemy_id for icon, summon_id for thumbnail, quest_id for lobby/background
 */
export function getRaidCdnImage(variant: RaidImageVariant, id: number | undefined): string {
	if (!id) return getGenericPlaceholder()

	switch (variant) {
		case 'icon':
			return `${RAID_ICON_CDN}/${id}.png`
		case 'thumbnail':
			return `${RAID_THUMBNAIL_CDN}/${id}_high.png`
		case 'lobby':
			return `${RAID_LOBBY_CDN}/${id}1.png`
		case 'background':
			return `${RAID_BACKGROUND_CDN}/${id}/raid_image_new.png`
		default:
			return getGenericPlaceholder()
	}
}
