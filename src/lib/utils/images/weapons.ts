/**
 * Weapon art, transcendence transformations and weapon keys
 */

import {
	BUCKET,
	getBasePath,
	getFileExtension,
	getImageDirectory,
	getImageUrl,
	getPlaceholderImage,
	renumberedImage,
	type ImageVariant,
	type TransformationStage
} from '$lib/utils/images/core'

/**
 * Returns the list of available transformation stages for a weapon.
 *
 * Stage-specific art only exists for series that ship it (see
 * {@link seriesHasTranscendenceArt}); pass that result as `hasTranscendenceArt`.
 * Weapons that transcend but reuse their base art (e.g. Illustrious) expose only
 * the Base stage so we never request a non-existent {id}_02/{id}_03 image.
 */
export function getWeaponTransformationStages(
	hasTranscendenceArt?: boolean
): TransformationStage[] {
	const stages: TransformationStage[] = [{ id: '01', label: 'Base', suffix: undefined }]

	if (hasTranscendenceArt) {
		stages.push(
			{ id: '02', label: 'Transcendence (1)', suffix: '02' },
			{ id: '03', label: 'Transcendence (5)', suffix: '03' }
		)
	}

	return stages
}

/**
 * Calculates the weapon transformation suffix based on transcendence step.
 * Returns undefined for base art, '02' for transcendence 1-4, '03' for transcendence 5.
 *
 * Only weapons whose series ships stage-specific art swap images — pass
 * {@link seriesHasTranscendenceArt} as `hasTranscendenceArt`. Weapons that
 * transcend but reuse their base art (e.g. Illustrious) always return undefined
 * so their grid keeps the base image.
 */
export function getWeaponTransformation(
	hasTranscendenceArt?: boolean,
	uncapLevel?: number,
	transcendenceStep?: number
): string | undefined {
	if (!hasTranscendenceArt || uncapLevel !== 6) return undefined
	if (transcendenceStep === 5) return '03'
	if (transcendenceStep && transcendenceStep >= 1) return '02'
	return undefined
}

/**
 * Get weapon image URL
 * @param transformation - Optional transformation suffix ('02' for transcendence)
 */
export function getWeaponImage(
	id: string | number | null | undefined,
	variant: ImageVariant = 'main',
	element?: number,
	transformation?: string,
	elementVariantIds?: Record<string, string> | null
): string {
	if (!id) {
		return getPlaceholderImage('weapon', variant)
	}

	const directory = getImageDirectory('weapon', variant)
	const extension = getFileExtension('weapon', variant)
	const basePath = `${getBasePath()}/${directory}`

	// Handle element-specific weapons (including element 0 for null-element weapons)
	if (element !== undefined && element >= 0) {
		const variantId = elementVariantIds?.[String(element)]
		if (variantId) {
			return `${basePath}/${variantId}${extension}`
		}
		const url = `${basePath}/${id}_${element}${extension}`
		return element > 0 ? renumberedImage(url) : url
	}

	// Handle transformation suffix (transcendence)
	if (transformation) {
		return `${basePath}/${id}_${transformation}${extension}`
	}

	return `${basePath}/${id}${extension}`
}

/**
 * Get weapon fallback image URL (without element suffix)
 * Used as onerror fallback for element-changeable weapons whose _0 image doesn't exist
 */
export function getWeaponFallbackImage(
	id: string | number | null | undefined,
	variant: ImageVariant = 'main',
	transformation?: string
): string | undefined {
	if (!id) return undefined
	const directory = getImageDirectory('weapon', variant)
	const extension = getFileExtension('weapon', variant)
	const basePath = `${getBasePath()}/${directory}`
	if (transformation) {
		return `${basePath}/${id}_${transformation}${extension}`
	}
	return `${basePath}/${id}${extension}`
}

/**
 * Get weapon base image (PNG)
 * @param transformation - Optional transformation suffix ('02' / '03' for transcendence stages)
 */
export function getWeaponBaseImage(
	id: string | number | null | undefined,
	transformation?: string
): string {
	if (!id) return getPlaceholderImage('weapon', 'base')
	if (!transformation) return getImageUrl('weapon', id, 'base')
	const directory = getImageDirectory('weapon', 'base')
	const extension = getFileExtension('weapon', 'base')
	return `${getBasePath()}/${directory}/${id}_${transformation}${extension}`
}

/**
 * Get weapon gacha card art (transparent PNG shown when the weapon is drawn).
 * Not every weapon has it; most R weapons don't.
 * @param transformation - Optional variant suffix ('02' / '03' for transcendence stages,
 *   or an element number for element variants)
 */
export function getWeaponGachaImage(
	id: string | number | null | undefined,
	transformation?: string
): string {
	if (!id) return getPlaceholderImage('weapon', 'gacha')
	if (!transformation) return getImageUrl('weapon', id, 'gacha')
	const directory = getImageDirectory('weapon', 'gacha')
	const extension = getFileExtension('weapon', 'gacha')
	return `${getBasePath()}/${directory}/${id}_${transformation}${extension}`
}

/**
 * Get weapon grid image with element support
 * For element-changeable weapons (element === 0), uses instanceElement or defaults to 0 (no element image)
 */
export function getWeaponGridImage(
	id: string | number | null | undefined,
	element?: number,
	instanceElement?: number,
	elementVariantIds?: Record<string, string> | null
): string {
	// Handle element-changeable weapons (element 0 means null/changeable)
	// Use instance element if set, otherwise default to 0 (no element selected image)
	if (id && element === 0) {
		return getWeaponImage(id, 'grid', instanceElement ?? 0, undefined, elementVariantIds)
	}
	return getWeaponImage(id, 'grid')
}

/**
 * Get weapon key image URL
 */
export function getWeaponKeyImage(slug: string): string {
	return renumberedImage(`${getBasePath()}/${BUCKET.weaponKeys}/${slug}.png`)
}
