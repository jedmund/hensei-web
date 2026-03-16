/**
 * Centralized image utility system for all game assets
 *
 * Supports both local images (development) and remote AWS S3/CDN images (production)
 * Configure via PUBLIC_SIERO_IMG_URL environment variable
 */

import { getImageBaseUrl } from '$lib/api/adapters/config'
import { getElementKey } from '$lib/utils/element'

const BUILD_TIMESTAMP = __BUILD_TIMESTAMP__

export type ResourceType = 'character' | 'weapon' | 'summon'
export type ImageVariant = 'main' | 'tall' | 'grid' | 'square' | 'detail' | 'base' | 'wide'

/**
 * Maps resource type and variant to the correct directory name
 */
function getImageDirectory(type: ResourceType, variant: ImageVariant): string {
	// All directories follow the pattern: {type}-{variant}
	return `${type}-${variant}`
}

/**
 * Determines the file extension for a given resource type and variant
 */
function getFileExtension(type: ResourceType, variant: ImageVariant): string {
	// PNG variants: character-detail, weapon-base, summon-detail
	if (type === 'character' && variant === 'detail') return '.png'
	if (type === 'weapon' && variant === 'base') return '.png'
	if (type === 'summon' && variant === 'detail') return '.png'

	// All other variants use JPG
	return '.jpg'
}

/**
 * Gets the base path for images
 * Returns AWS S3/CDN URL if configured, otherwise local /images path
 */
export function getBasePath(): string {
	const remoteUrl = getImageBaseUrl()
	return remoteUrl || '/images'
}

/**
 * Gets the placeholder image for a given type and variant
 * Uses AWS S3/CDN in production, local path in development
 */
export function getPlaceholderImage(type: ResourceType, variant: ImageVariant): string {
	return `${getBasePath()}/placeholders/placeholder-${type}-${variant}.png`
}

/**
 * Gets a generic placeholder image (weapon-grid variant)
 * Used as fallback for misc image types that don't have specific placeholders
 */
export function getGenericPlaceholder(): string {
	return `${getBasePath()}/placeholders/placeholder-weapon-grid.png`
}

/**
 * Summon IDs that have alternate art at different uncap levels.
 * Only these summons change their image based on uncap/transcendence.
 */
const SUMMONS_WITH_ALT_ART = new Set([
	'2040094000',
	'2040100000',
	'2040080000',
	'2040098000',
	'2040090000',
	'2040084000',
	'2040003000',
	'2040056000',
	'2040020000',
	'2040034000',
	'2040028000',
	'2040027000',
	'2040046000',
	'2040047000',
])

/**
 * Calculates the summon transformation suffix based on uncap level and transcendence
 * Returns undefined for base art, '02' for ULB, '03' for transcendence 1-4, '04' for transcendence 5+
 * Only applies to summons in the SUMMONS_WITH_ALT_ART set.
 */
export function getSummonTransformation(granblueId?: string | number | null, uncapLevel?: number, transcendenceStep?: number): string | undefined {
	if (!granblueId || !SUMMONS_WITH_ALT_ART.has(String(granblueId))) return undefined
	if (transcendenceStep && transcendenceStep >= 5) return '04'
	if (transcendenceStep && transcendenceStep > 0) return '03'
	if (uncapLevel && uncapLevel >= 5) return '02'
	return undefined
}

/**
 * Calculates the weapon transformation suffix based on transcendence step.
 * Returns undefined for base art, '02' for transcendence 1-4, '03' for transcendence 5.
 * Only applies to weapons that have transcendence and are at uncap level 6.
 */
export function getWeaponTransformation(hasTranscendence?: boolean, uncapLevel?: number, transcendenceStep?: number): string | undefined {
	if (!hasTranscendence || uncapLevel !== 6) return undefined
	if (transcendenceStep === 5) return '03'
	if (transcendenceStep && transcendenceStep >= 1) return '02'
	return undefined
}

/**
 * Calculates the character pose based on uncap level and transcendence
 */
export function getCharacterPose(uncapLevel?: number, transcendenceStep?: number): string {
	if (transcendenceStep && transcendenceStep > 0) return '04'
	if (uncapLevel && uncapLevel >= 5) return '03'
	if (uncapLevel && uncapLevel > 2) return '02'
	return '01'
}

/**
 * Pose suffix for style swap character images.
 * Style swap images are stored as {id}_01_style.{ext}
 */
export const STYLE_SWAP_POSE = '01_style'

/**
 * Main function to get image URL for any resource
 */
export function getImageUrl(
	type: ResourceType,
	id: string | number | null | undefined,
	variant: ImageVariant,
	options?: {
		pose?: string | undefined // For character poses
		element?: number | undefined // For element-specific weapon grids
	}
): string {
	// Return placeholder if no ID
	if (!id) {
		return getPlaceholderImage(type, variant)
	}

	const directory = getImageDirectory(type, variant)
	const extension = getFileExtension(type, variant)
	const basePath = `${getBasePath()}/${directory}`

	// Handle character-specific logic
	if (type === 'character') {
		const pose = options?.pose || '01'
		return `${basePath}/${id}_${pose}${extension}`
	}

	// Handle weapon element variants (including element 0 for null-element weapons)
	if (type === 'weapon' && (variant === 'grid' || variant === 'main' || variant === 'square') && options?.element !== undefined && options.element >= 0) {
		return `${basePath}/${id}_${options.element}${extension}`
	}

	// Standard format for weapons and summons
	return `${basePath}/${id}${extension}`
}

// ===== Convenience Functions =====

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
 * Get weapon image URL
 * @param transformation - Optional transformation suffix ('02' for transcendence)
 */
export function getWeaponImage(
	id: string | number | null | undefined,
	variant: ImageVariant = 'main',
	element?: number,
	transformation?: string
): string {
	if (!id) {
		return getPlaceholderImage('weapon', variant)
	}

	const directory = getImageDirectory('weapon', variant)
	const extension = getFileExtension('weapon', variant)
	const basePath = `${getBasePath()}/${directory}`

	// Handle element-specific weapons (including element 0 for null-element weapons)
	if (element !== undefined && element >= 0) {
		return `${basePath}/${id}_${element}${extension}`
	}

	// Handle transformation suffix (transcendence)
	if (transformation) {
		return `${basePath}/${id}_${transformation}${extension}`
	}

	return `${basePath}/${id}${extension}`
}

/**
 * Get weapon base image (PNG)
 */
export function getWeaponBaseImage(
	id: string | number | null | undefined
): string {
	return getImageUrl('weapon', id, 'base')
}

/**
 * Get summon image URL
 * @param transformation - Optional transformation suffix ('02' for ULB, '03' for transcendence)
 */
export function getSummonImage(
	id: string | number | null | undefined,
	variant: ImageVariant = 'main',
	transformation?: string
): string {
	if (!id) {
		return getPlaceholderImage('summon', variant)
	}

	const directory = getImageDirectory('summon', variant)
	const extension = getFileExtension('summon', variant)
	const basePath = `${getBasePath()}/${directory}`

	// Handle transformation suffix (ULB, transcendence)
	if (transformation) {
		return `${basePath}/${id}_${transformation}${extension}`
	}

	return `${basePath}/${id}${extension}`
}

/**
 * Get summon detail image (PNG)
 */
export function getSummonDetailImage(
	id: string | number | null | undefined
): string {
	return getImageUrl('summon', id, 'detail')
}

/**
 * Get summon wide image
 */
export function getSummonWideImage(
	id: string | number | null | undefined
): string {
	return getImageUrl('summon', id, 'wide')
}

// ===== Special Handlers =====

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
	styleSwap?: boolean
): string {
	if (!id) {
		return getPlaceholderImage('character', variant)
	}

	// Style swap characters always use the _01_style pose
	if (styleSwap) {
		return getImageUrl('character', id, variant, { pose: STYLE_SWAP_POSE })
	}

	let pose = getCharacterPose(uncapLevel, transcendenceStep)

	// Special handling for Gran/Djeeta (3030182000)
	if (String(id) === '3030182000') {
		const element = mainWeaponElement || partyElement || 1
		pose = `${pose}_0${element}`
	}

	return getImageUrl('character', id, variant, { pose })
}

/**
 * Get weapon grid image with element support
 * For element-changeable weapons (element === 0), uses instanceElement or defaults to 0 (no element image)
 */
export function getWeaponGridImage(
	id: string | number | null | undefined,
	element?: number,
	instanceElement?: number
): string {
	// Handle element-changeable weapons (element 0 means null/changeable)
	// Use instance element if set, otherwise default to 0 (no element selected image)
	if (id && element === 0) {
		return getImageUrl('weapon', id, 'grid', { element: instanceElement ?? 0 })
	}
	return getImageUrl('weapon', id, 'grid')
}

// ===== Job-Related Images =====

/**
 * Get job skill icon URL
 * Uses slug for the image path
 */
export function getJobSkillIcon(skill: { imageId?: string; slug?: string } | string | undefined): string {
	if (!skill) return '/images/job-skills/default.png'

	// Handle string input (backward compatibility)
	if (typeof skill === 'string') {
		return `${getBasePath()}/job-skills/${skill}.png`
	}

	// Use slug for the image path
	if (skill.slug) {
		return `${getBasePath()}/job-skills/${skill.slug}.png`
	}
	return '/images/job-skills/default.png'
}

/**
 * Get accessory square image URL
 */
export function getAccessoryImage(granblueId: string | undefined): string {
	if (!granblueId) return getGenericPlaceholder()
	return `${getBasePath()}/accessory-square/${granblueId}.jpg`
}

// ===== Modification Images =====

/**
 * Get awakening image URL
 */
export function getAwakeningImage(slug: string | undefined, extension: 'png' | 'jpg' = 'jpg'): string {
	if (!slug) return ''
	return `${getBasePath()}/awakening/${slug}.${extension}`
}

/**
 * Get weapon key image URL
 */
export function getWeaponKeyImage(slug: string, element?: number): string {
	const basePath = `${getBasePath()}/weapon-keys`

	// Check if this key type needs element suffix
	if (element && isElementalWeaponKey(slug)) {
		return `${basePath}/${slug}-${element}.png`
	}
	return `${basePath}/${slug}.png`
}

/**
 * Check if weapon key slug requires element suffix
 */
function isElementalWeaponKey(slug: string): boolean {
	const elementalKeys = [
		'elemental-teluma',
		'pendulum',
		'chain-of-causality',
		'ultima'
	]
	return elementalKeys.some((key) => slug.includes(key))
}

/**
 * Get AX skill image URL
 */
export function getAxSkillImage(slug: string | undefined): string {
	if (!slug) return ''
	return `${getBasePath()}/ax/${slug}.png`
}

/**
 * Get mastery image URL
 */
export function getMasteryImage(slug: string | undefined): string {
	if (!slug) return ''
	return `${getBasePath()}/mastery/${slug}.png`
}

// ===== Label Images =====

/**
 * Get element label image URL
 */
export function getElementLabelImage(elementName: string): string {
	const capitalizedLabel = elementName.charAt(0).toUpperCase() + elementName.slice(1).toLowerCase()
	return `${getBasePath()}/labels/element/Label_Element_${capitalizedLabel}.png`
}

/**
 * Get proficiency label image URL
 */
export function getProficiencyLabelImage(proficiencyName: string): string {
	const capitalizedLabel =
		proficiencyName.charAt(0).toUpperCase() + proficiencyName.slice(1).toLowerCase()
	return `${getBasePath()}/labels/proficiency/Label_Weapon_${capitalizedLabel}.png`
}

/**
 * Get race label image URL
 */
export function getRaceLabelImage(raceName: string): string {
	return `${getBasePath()}/labels/race/Label_Race_${raceName}.png`
}

/**
 * Get gender label image URL
 */
export function getGenderLabelImage(genderLabel: string): string {
	return `${getBasePath()}/labels/gender/Label_Gender_${genderLabel.replace('/', '_')}.png`
}

// ===== Element Icons =====

/**
 * Get element icon image URL (for select dropdowns, etc.)
 */
export function getElementIcon(element: number): string {
	const name = getElementKey(element)
	return `${getBasePath()}/elements/element-${name}.png`
}

// ===== Artifact Images =====

export type ArtifactImageVariant = 'square' | 'wide'

/**
 * Get artifact image URL
 * @param variant - 'square' for thumbnails/icons, 'wide' for grid-sized display
 */
export function getArtifactImage(
	granblueId: string | number | null | undefined,
	variant: ArtifactImageVariant = 'square'
): string {
	if (!granblueId) return getGenericPlaceholder()
	const directory = `artifact-${variant}`
	return `${getBasePath()}/${directory}/${granblueId}.jpg`
}

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

// ===== Other Game Images =====

/**
 * Get guidebook image URL
 */
export function getGuidebookImage(granblueId: string | number | undefined): string {
	if (!granblueId) return getGenericPlaceholder()
	return `${getBasePath()}/guidebooks/book_${granblueId}.png`
}

// ===== Raid Images =====

export type RaidImageVariant = 'icon' | 'thumbnail' | 'lobby' | 'background'

// Game CDN URLs for raid images
const RAID_ICON_CDN = 'https://prd-game-a-granbluefantasy.akamaized.net/assets_en/img/sp/assets/enemy/m'
const RAID_THUMBNAIL_CDN = 'https://prd-game-a1-granbluefantasy.akamaized.net/assets_en/img/sp/assets/summon/qm'
const RAID_LOBBY_CDN = 'https://prd-game-a1-granbluefantasy.akamaized.net/assets_en/img/sp/quest/assets/lobby'
const RAID_BACKGROUND_CDN = 'https://prd-game-a-granbluefantasy.akamaized.net/assets_en/img/sp/quest/assets/treasureraid'

/**
 * Get raid image URL (stored images from our CDN/local)
 * @param variant - 'icon', 'thumbnail', 'lobby', or 'background'
 */
export function getRaidImage(
	slug: string | undefined,
	variant: RaidImageVariant = 'thumbnail'
): string {
	if (!slug) return getGenericPlaceholder()
	const directory = `raid-${variant}`
	return `${getBasePath()}/${directory}/${slug}.png?v=${BUILD_TIMESTAMP}`
}

/**
 * Get raid image from game CDN (for images tab and initial downloads)
 * @param variant - 'icon', 'thumbnail', 'lobby', or 'background'
 * @param id - enemy_id for icon, summon_id for thumbnail, quest_id for lobby/background
 */
export function getRaidCdnImage(
	variant: RaidImageVariant,
	id: number | undefined
): string {
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
