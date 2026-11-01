/**
 * Party equipment images: accessories, artifacts, bullets and guidebooks
 */

import { BUCKET, getBasePath, getGenericPlaceholder } from '$lib/utils/images/core'

/**
 * Get accessory image URL
 * @param variant - 'square' for thumbnails/icons, 'grid' for grid-sized display
 */
export function getAccessoryImage(
	granblueId: string | undefined,
	variant: 'square' | 'grid' = 'square'
): string {
	if (!granblueId) return getGenericPlaceholder()
	return `${getBasePath()}/${BUCKET.accessories}/${variant}/${granblueId}.jpg`
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
	return `${getBasePath()}/${BUCKET.artifacts}/${variant}/${granblueId}.jpg`
}

// ===== Bullet Images =====

/**
 * Get bullet image URL
 */
export function getBulletImage(granblueId: string | number | null | undefined): string {
	if (!granblueId) return getGenericPlaceholder()
	return `${getBasePath()}/${BUCKET.bullets}/square/${granblueId}.jpg`
}

// ===== Other Game Images =====

/**
 * Get guidebook image URL
 */
export function getGuidebookImage(granblueId: string | number | undefined): string {
	if (!granblueId) return getGenericPlaceholder()
	return `${getBasePath()}/guidebooks/book_${granblueId}.png`
}
