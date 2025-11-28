/**
 * Centralized image utility system for all game assets
 */

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
 * Gets the placeholder image for a given type and variant
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
	const basePath = `/images/${directory}`

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
 */
export function getWeaponImage(
	id: string | number | null | undefined,
	variant: ImageVariant = 'main',
	element?: number
): string {
	return getImageUrl('weapon', id, variant, { element })
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
 */
export function getSummonImage(
	id: string | number | null | undefined,
	variant: ImageVariant = 'main'
): string {
	return getImageUrl('summon', id, variant)
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
