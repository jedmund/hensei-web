/**
 * Core of the image utility system for all game assets: the bucket layout,
 * base path resolution, placeholders and the generic entity URL builder.
 *
 * Supports both local images (development) and remote AWS S3/CDN images (production)
 * Configure via PUBLIC_SIERO_IMG_URL environment variable
 */

import { getImageBaseUrl } from '$lib/api/adapters/config'

export type ResourceType = 'character' | 'weapon' | 'summon'
export type ImageVariant =
	'main' | 'tall' | 'grid' | 'square' | 'detail' | 'base' | 'wide' | 'gacha'

/**
 * Single source of truth for non-entity bucket prefixes. Entity art (character/
 * weapon/summon) is built by {@link getImageDirectory}. See the migration runbook
 * at hensei-api/docs/follow-ups/image-bucket-reorg.md — these MUST match the bucket.
 * Game-CDN URLs and `previews/`/`profile/`/`guidebooks/`/`labels/` are
 * intentionally not listed (unchanged / external).
 */
export const BUCKET = {
	placeholders: 'app/placeholders',
	marketing: 'app/marketing',
	external: 'app/external',
	abilities: 'icons/abilities',
	jobSkills: 'icons/job-skills',
	elements: 'icons/elements',
	proficiencies: 'icons/proficiencies',
	rarity: 'icons/rarity',
	awakening: 'icons/awakening',
	weaponSkills: 'icons/weapon-skills',
	weaponKeys: 'weapons/keys',
	skillLabels: 'icons/skill-labels',
	mastery: 'icons/mastery',
	axSkills: 'icons/ax-skills',
	guideEffects: 'icons/guide-effects',
	blessings: 'blessings',
	solomonisSpaces: 'icons/solomonis-spaces',
	accessories: 'accessories',
	artifacts: 'artifacts',
	bullets: 'bullets',
	raids: 'raids',
	stickers: 'icons/stickers',
	events: 'events'
} as const

/**
 * Maps resource type and variant to the correct directory name.
 * Entity art is grouped per entity: characters/weapons/summons + variant subdir.
 */
export function getImageDirectory(type: ResourceType, variant: ImageVariant): string {
	return `${type}s/${variant}`
}

/**
 * Determines the file extension for a given resource type and variant
 */
export function getFileExtension(type: ResourceType, variant: ImageVariant): string {
	// PNG variants: character-detail, weapon-base, summon-detail, weapon/summon-gacha
	if (type === 'character' && variant === 'detail') return '.png'
	if (type === 'weapon' && variant === 'base') return '.png'
	if (type === 'summon' && variant === 'detail') return '.png'
	if (variant === 'gacha' && (type === 'weapon' || type === 'summon')) return '.png'

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
	return `${getBasePath()}/${BUCKET.placeholders}/placeholder-${type}-${variant}.png`
}

/**
 * Resolves a host-relative image path from the API (e.g. sticker and event
 * `image_url`, `icons/stickers/cleared.png?v=…`) against the image host.
 * Absolute URLs and root paths pass through unchanged.
 */
export function getHostedImageUrl(path: string | null | undefined): string | null {
	if (!path) return null
	if (/^(https?:)?\/\//.test(path) || path.startsWith('/') || path.startsWith('blob:')) return path
	return `${getBasePath()}/${path}`
}

/**
 * Gets a generic placeholder image (weapon-grid variant)
 * Used as fallback for misc image types that don't have specific placeholders
 */
export function getGenericPlaceholder(): string {
	return `${getBasePath()}/${BUCKET.placeholders}/placeholder-weapon-grid.png`
}

/**
 * Images whose file names carry an element or proficiency number swapped names when those
 * numbers became the game's (October 2026). The query string keeps a browser from showing
 * a copy it cached under the old numbering.
 */
export function renumberedImage(url: string): string {
	return `${url}?ids=game`
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
		const url = `${basePath}/${id}_${pose}${extension}`
		return /_0[1-6](_|$)/.test(pose) ? renumberedImage(url) : url
	}

	// Handle weapon element variants (including element 0 for null-element weapons)
	if (
		type === 'weapon' &&
		(variant === 'grid' || variant === 'main' || variant === 'square') &&
		options?.element !== undefined &&
		options.element >= 0
	) {
		const url = `${basePath}/${id}_${options.element}${extension}`
		return options.element > 0 ? renumberedImage(url) : url
	}

	// Standard format for weapons and summons
	return `${basePath}/${id}${extension}`
}

/**
 * Swap an image's src to a fallback URL on error, preventing infinite loops
 */
export function handleImageFallback(event: Event, fallbackUrl?: string): void {
	const img = event.currentTarget as HTMLImageElement
	if (fallbackUrl && img.src !== fallbackUrl) {
		img.src = fallbackUrl
	}
}

export interface TransformationStage {
	id: string
	label: string
	suffix: string | undefined
}
