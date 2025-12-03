/**
 * Weapon Series Types
 *
 * Type definitions for weapon series data from the API.
 * WeaponSeries is a database-driven classification system for weapons.
 *
 * @module types/api/weaponSeries
 */

/**
 * Embedded series reference on weapons.
 * This is the structure returned in weapon.series field.
 * Includes boolean flags for convenience to avoid extra lookups.
 */
export interface WeaponSeriesRef {
	id: string
	slug: string
	name: { en: string; ja: string }
	hasWeaponKeys: boolean
	hasAwakening: boolean
	hasAxSkills: boolean
	extra: boolean
	elementChangeable: boolean
}

/**
 * Full weapon series from /api/v1/weapon_series endpoint.
 * Flags are included in both list and show endpoints.
 * weaponCount is only included in the :full view (show endpoint).
 */
export interface WeaponSeries {
	id: string
	name: { en: string; ja: string }
	slug: string
	order: number
	extra: boolean
	elementChangeable: boolean
	hasWeaponKeys: boolean
	hasAwakening: boolean
	hasAxSkills: boolean
	// Only included in :full view (show endpoint)
	weaponCount?: number
}

/**
 * Input type for weapon series form (client-side)
 */
export interface WeaponSeriesInput {
	name_en: string
	name_jp: string
	slug: string
	order: number
	extra: boolean
	element_changeable: boolean
	has_weapon_keys: boolean
	has_awakening: boolean
	has_ax_skills: boolean
}

/**
 * Payload for creating a new weapon series (editor only)
 */
export interface CreateWeaponSeriesPayload {
	name_en: string
	name_jp: string
	slug: string
	order?: number
	extra?: boolean
	element_changeable?: boolean
	has_weapon_keys?: boolean
	has_awakening?: boolean
	has_ax_skills?: boolean
}

/**
 * Payload for updating an existing weapon series (editor only)
 */
export interface UpdateWeaponSeriesPayload {
	name_en?: string
	name_jp?: string
	slug?: string
	order?: number
	extra?: boolean
	element_changeable?: boolean
	has_weapon_keys?: boolean
	has_awakening?: boolean
	has_ax_skills?: boolean
}

/**
 * Type guard to check if a series value is the new object format vs legacy integer.
 * During migration, some weapons may still have integer series values.
 *
 * @param series - The series value to check
 * @returns True if series is a WeaponSeriesRef object
 */
export function isWeaponSeriesRef(series: unknown): series is WeaponSeriesRef {
	return (
		series !== null &&
		typeof series === 'object' &&
		'slug' in series &&
		'id' in series &&
		'name' in series
	)
}
