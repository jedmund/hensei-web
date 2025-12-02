/**
 * Centralized image utility system for all game assets
 *
 * Supports both local images (development) and remote AWS S3/CDN images (production)
 * Configure via PUBLIC_SIERO_IMG_URL environment variable
 */

import { getImageBaseUrl } from '$lib/api/adapters/config'

export type ResourceType = 'character' | 'weapon' | 'summon'
export type ImageVariant = 'main' | 'grid' | 'square' | 'detail' | 'base' | 'wide'

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
 * Placeholders are always served locally
 */
export function getPlaceholderImage(type: ResourceType, variant: ImageVariant): string {
	return `/images/placeholders/placeholder-${type}-${variant}.png`
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

	// Handle weapon grid element variants
	if (type === 'weapon' && variant === 'grid' && options?.element && options.element > 0) {
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

	// Handle element-specific weapon grids
	if (variant === 'grid' && element && element > 0) {
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
	partyElement?: number | null
): string {
	if (!id) {
		return getPlaceholderImage('character', variant)
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
 */
export function getWeaponGridImage(
	id: string | number | null | undefined,
	element?: number,
	instanceElement?: number
): string {
	// Handle element-specific weapons (primal weapons)
	if (id && element === 0 && instanceElement) {
		return getImageUrl('weapon', id, 'grid', { element: instanceElement })
	}
	return getImageUrl('weapon', id, 'grid')
}

// ===== Job-Related Images =====

/**
 * Get job skill icon URL
 */
export function getJobSkillIcon(slug: string | undefined): string {
	if (!slug) return '/images/job-skills/default.png'
	return `${getBasePath()}/job-skills/${slug}.png`
}

/**
 * Get accessory square image URL
 */
export function getAccessoryImage(granblueId: string | undefined): string {
	if (!granblueId) return '/images/placeholders/placeholder-weapon-grid.png'
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
	const elementNames: Record<number, string> = {
		1: 'wind',
		2: 'fire',
		3: 'water',
		4: 'earth',
		5: 'dark',
		6: 'light'
	}
	const name = elementNames[element] || 'none'
	return `${getBasePath()}/elements/element-${name}.png`
}

// ===== Other Game Images =====

/**
 * Get guidebook image URL
 */
export function getGuidebookImage(granblueId: string | number | undefined): string {
	if (!granblueId) return '/images/placeholders/placeholder-weapon-grid.png'
	return `${getBasePath()}/guidebooks/book_${granblueId}.png`
}

/**
 * Get raid image URL
 */
export function getRaidImage(slug: string | undefined): string {
	if (!slug) return '/images/placeholders/placeholder-weapon-grid.png'
	return `${getBasePath()}/raids/${slug}.png`
}
