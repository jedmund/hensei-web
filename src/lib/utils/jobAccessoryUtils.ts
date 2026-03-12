/**
 * Job Accessory Utilities
 *
 * Helper functions for working with job accessories (Shields and Manatura).
 */

/**
 * Accessory type constants
 */
export const ACCESSORY_TYPES = {
	SHIELD: 1,
	MANATURA: 2
} as const

export type AccessoryType = (typeof ACCESSORY_TYPES)[keyof typeof ACCESSORY_TYPES]

/**
 * Gets the display name for an accessory type
 */
export function getAccessoryTypeName(type: number): string {
	switch (type) {
		case ACCESSORY_TYPES.SHIELD:
			return 'Shield'
		case ACCESSORY_TYPES.MANATURA:
			return 'Manatura'
		default:
			return 'Unknown'
	}
}

/**
 * Gets options for accessory type filter/select
 */
export function getAccessoryTypeOptions(): Array<{ value: number; label: string }> {
	return [
		{ value: ACCESSORY_TYPES.SHIELD, label: 'Shield' },
		{ value: ACCESSORY_TYPES.MANATURA, label: 'Manatura' }
	]
}

/**
 * Gets the image URL for a job accessory
 * @param granblueId The accessory's granblue_id
 * @param size The image size variant ('square' or 'grid')
 */
export function getJobAccessoryImageUrl(
	granblueId: string,
	size: 'square' | 'grid' = 'square'
): string {
	return `/images/accessory-${size}/${granblueId}.jpg`
}
