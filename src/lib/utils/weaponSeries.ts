/**
 * Weapon Series Utilities
 *
 * Provides helpers for weapon series identification and conflict messaging.
 *
 * @module utils/weaponSeries
 */

export interface WeaponSeries {
	id: number
	slug: string
}

/**
 * All weapon series with their IDs and slugs.
 * The slug is used for i18n message keys.
 */
export const weaponSeries: WeaponSeries[] = [
	{ id: 0, slug: 'seraphic' },
	{ id: 1, slug: 'grand' },
	{ id: 2, slug: 'opus' },
	{ id: 3, slug: 'draconic' },
	{ id: 4, slug: 'revenant' },
	{ id: 6, slug: 'primal' },
	{ id: 7, slug: 'beast' },
	{ id: 8, slug: 'regalia' },
	{ id: 9, slug: 'omega' },
	{ id: 10, slug: 'olden_primal' },
	{ id: 11, slug: 'militis' },
	{ id: 12, slug: 'hollowsky' },
	{ id: 13, slug: 'xeno' },
	{ id: 14, slug: 'astral' },
	{ id: 15, slug: 'rose' },
	{ id: 16, slug: 'bahamut' },
	{ id: 17, slug: 'ultima' },
	{ id: 18, slug: 'epic' },
	{ id: 19, slug: 'ennead' },
	{ id: 20, slug: 'cosmic' },
	{ id: 21, slug: 'ancestral' },
	{ id: 22, slug: 'superlative' },
	{ id: 23, slug: 'vintage' },
	{ id: 24, slug: 'class_champion' },
	{ id: 25, slug: 'proving' },
	{ id: 28, slug: 'sephira' },
	{ id: 29, slug: 'new_world' },
	{ id: 30, slug: 'disaster' },
	{ id: 31, slug: 'illustrious' },
	{ id: 32, slug: 'world' },
	{ id: 34, slug: 'draconic_providence' }
]

/**
 * Series IDs that share the Opus/Draconic conflict rule.
 * Only one weapon from these series can be in a party at a time.
 */
export const OPUS_DRACONIC_SERIES = [2, 3, 34]

/**
 * Get the slug for a weapon series by ID.
 *
 * @param id - The series ID
 * @returns The series slug or undefined if not found
 */
export function getWeaponSeriesSlug(id: number): string | undefined {
	return weaponSeries.find((s) => s.id === id)?.slug
}

/**
 * Check if a series ID belongs to the Opus/Draconic conflict group.
 *
 * @param seriesId - The series ID to check
 * @returns True if the series is Opus, Draconic, or Draconic Providence
 */
export function isOpusDraconicSeries(seriesId: number): boolean {
	return OPUS_DRACONIC_SERIES.includes(seriesId)
}

/**
 * Get all weapon series as options for a select/dropdown.
 *
 * @returns Array of { value, label } options
 */
export function getWeaponSeriesOptions() {
	return weaponSeries.map((series) => ({
		value: series.id,
		label: series.slug
			.split('_')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ')
	}))
}
