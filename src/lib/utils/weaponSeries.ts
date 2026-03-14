/**
 * Weapon Series Utilities
 *
 * Provides helpers for weapon series identification and conflict messaging.
 * Works with the API-driven WeaponSeriesRef type.
 *
 * @module utils/weaponSeries
 */

import type { WeaponSeriesRef } from '$lib/types/api/weaponSeries'
import { isWeaponSeriesRef } from '$lib/types/api/weaponSeries'
import { localizedName } from '$lib/utils/locale'

/**
 * Slugs for series that share the Opus/Draconic conflict rule.
 * Only one weapon from these series can be in a party at a time.
 */
export const OPUS_DRACONIC_SLUGS = ['dark-opus', 'draconic', 'draconic-providence']

/**
 * Check if a series belongs to the Opus/Draconic conflict group.
 *
 * @param series - The series to check (WeaponSeriesRef or null)
 * @returns True if the series is Opus, Draconic, or Draconic Providence
 */
export function isOpusDraconicSeries(series: WeaponSeriesRef | null | undefined): boolean {
	if (!isWeaponSeriesRef(series)) {
		return false
	}
	return OPUS_DRACONIC_SLUGS.includes(series.slug)
}

/**
 * Get the display name for a weapon series.
 *
 * @param series - The weapon series reference
 * @param locale - The locale to use ('en' or 'ja')
 * @returns The localized series name, or 'Unknown' if not available
 */
export function getSeriesDisplayName(
	series: WeaponSeriesRef | null | undefined
): string {
	if (!isWeaponSeriesRef(series)) {
		return 'Unknown'
	}
	const name = localizedName(series.name)
	return name === '—' ? 'Unknown' : name
}

/**
 * Get the slug for a weapon series.
 *
 * @param series - The weapon series
 * @returns The series slug or undefined
 */
export function getSeriesSlug(series: WeaponSeriesRef | null | undefined): string | undefined {
	if (!isWeaponSeriesRef(series)) {
		return undefined
	}
	return series.slug
}

/**
 * Check if a weapon series supports weapon keys.
 *
 * @param series - The weapon series
 * @returns True if the series supports weapon keys
 */
export function seriesHasWeaponKeys(series: WeaponSeriesRef | null | undefined): boolean {
	if (!isWeaponSeriesRef(series)) {
		return false
	}
	return series.hasWeaponKeys
}

/**
 * Check if a weapon series supports awakening.
 *
 * @param series - The weapon series
 * @returns True if the series supports awakening
 */
export function seriesHasAwakening(series: WeaponSeriesRef | null | undefined): boolean {
	if (!isWeaponSeriesRef(series)) {
		return false
	}
	return series.hasAwakening
}

/**
 * Check if a weapon series allows element changes.
 *
 * @param series - The weapon series
 * @returns True if weapons in this series can have their element changed
 */
export function seriesIsElementChangeable(series: WeaponSeriesRef | null | undefined): boolean {
	if (!isWeaponSeriesRef(series)) {
		return false
	}
	return series.elementChangeable
}

/**
 * Check if a weapon series can be placed in extra grid slots.
 *
 * @param series - The weapon series
 * @returns True if weapons in this series can be in extra slots
 */
export function seriesIsExtra(series: WeaponSeriesRef | null | undefined): boolean {
	if (!isWeaponSeriesRef(series)) {
		return false
	}
	return series.extra
}

// Re-export the type guard for convenience
export { isWeaponSeriesRef } from '$lib/types/api/weaponSeries'
