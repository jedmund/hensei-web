/**
 * Job Accessory Utilities
 *
 * Helper functions for working with job accessories (Shields and Manatura).
 */

import * as m from '$lib/paraglide/messages'

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
			return m.accessory_type_shield()
		case ACCESSORY_TYPES.MANATURA:
			return m.accessory_type_manatura()
		default:
			return m.accessory_type_unknown()
	}
}

/**
 * Gets options for accessory type filter/select
 */
export function getAccessoryTypeOptions(): Array<{ value: number; label: string }> {
	return [
		{ value: ACCESSORY_TYPES.SHIELD, label: m.accessory_type_shield() },
		{ value: ACCESSORY_TYPES.MANATURA, label: m.accessory_type_manatura() }
	]
}

