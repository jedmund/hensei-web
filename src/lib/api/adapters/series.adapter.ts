/**
 * Series Adapter
 *
 * Weapon, character and summon series, and weapon series variants.
 *
 * @module adapters/series
 */

import { BaseAdapter } from './base.adapter'
import { DEFAULT_ADAPTER_CONFIG } from './config'
import type {
	WeaponSeries,
	CreateWeaponSeriesPayload,
	UpdateWeaponSeriesPayload
} from '$lib/types/api/weaponSeries'
import type {
	CharacterSeries,
	CreateCharacterSeriesPayload,
	UpdateCharacterSeriesPayload
} from '$lib/types/api/characterSeries'
import type {
	SummonSeries,
	CreateSummonSeriesPayload,
	UpdateSummonSeriesPayload
} from '$lib/types/api/summonSeries'
import type {
	WeaponSeriesVariant,
	CreateWeaponSeriesVariantPayload,
	UpdateWeaponSeriesVariantPayload
} from '$lib/types/api/weaponSeriesVariant'

/**
 * Adapter for weapon, character and summon series
 */
export class SeriesAdapter extends BaseAdapter {
	/**
	 * Gets all weapon series ordered by display order
	 * Returns minimal view (id, name, slug, order)
	 */
	async getWeaponSeriesList(): Promise<WeaponSeries[]> {
		return this.request<WeaponSeries[]>('/weapon_series')
	}

	/**
	 * Gets a single weapon series by ID or slug
	 * Returns full view with boolean flags and weapon count
	 *
	 * @param idOrSlug - UUID or slug (e.g., 'dark-opus')
	 */
	async getWeaponSeries(idOrSlug: string): Promise<WeaponSeries> {
		return this.request<WeaponSeries>(`/weapon_series/${idOrSlug}`)
	}

	/**
	 * Creates a new weapon series
	 * Requires editor role (>= 7)
	 */
	async createWeaponSeries(payload: CreateWeaponSeriesPayload): Promise<WeaponSeries> {
		const result = await this.request<WeaponSeries>('/weapon_series', {
			method: 'POST',
			body: { weapon_series: payload }
		})
		// Clear weapon series cache
		this.clearCache('/weapon_series')
		return result
	}

	/**
	 * Updates an existing weapon series
	 * Requires editor role (>= 7)
	 *
	 * @param id - Weapon series UUID
	 * @param payload - Fields to update
	 */
	async updateWeaponSeries(id: string, payload: UpdateWeaponSeriesPayload): Promise<WeaponSeries> {
		const result = await this.request<WeaponSeries>(`/weapon_series/${id}`, {
			method: 'PATCH',
			body: { weapon_series: payload }
		})
		// Clear weapon series caches
		this.clearCache('/weapon_series')
		return result
	}

	/**
	 * Deletes a weapon series
	 * Requires editor role (>= 7)
	 * Will fail if series has associated weapons
	 *
	 * @param id - Weapon series UUID
	 */
	async deleteWeaponSeries(id: string): Promise<void> {
		await this.request<void>(`/weapon_series/${id}`, {
			method: 'DELETE'
		})
		// Clear weapon series cache
		this.clearCache('/weapon_series')
	}

	/**
	 * Clears weapon series cache
	 */
	clearWeaponSeriesCache() {
		this.clearCache('/weapon_series')
	}

	async createWeaponSeriesVariant(
		seriesId: string,
		payload: CreateWeaponSeriesVariantPayload
	): Promise<WeaponSeriesVariant> {
		return this.request<WeaponSeriesVariant>(`/weapon_series/${seriesId}/weapon_series_variants`, {
			method: 'POST',
			body: { weapon_series_variant: payload }
		})
	}

	async updateWeaponSeriesVariant(
		seriesId: string,
		variantId: string,
		payload: UpdateWeaponSeriesVariantPayload
	): Promise<WeaponSeriesVariant> {
		return this.request<WeaponSeriesVariant>(
			`/weapon_series/${seriesId}/weapon_series_variants/${variantId}`,
			{
				method: 'PATCH',
				body: { weapon_series_variant: payload }
			}
		)
	}

	async deleteWeaponSeriesVariant(seriesId: string, variantId: string): Promise<void> {
		await this.request(`/weapon_series/${seriesId}/weapon_series_variants/${variantId}`, {
			method: 'DELETE'
		})
	}

	/**
	 * Gets all character series, sorted by order
	 * Returns list view with basic info (no character count)
	 */
	async getCharacterSeriesList(): Promise<CharacterSeries[]> {
		return this.request<CharacterSeries[]>('/character_series')
	}

	/**
	 * Gets a single character series by ID or slug
	 * Returns full view with character count
	 *
	 * @param idOrSlug - UUID or slug (e.g., 'grand')
	 */
	async getCharacterSeries(idOrSlug: string): Promise<CharacterSeries> {
		return this.request<CharacterSeries>(`/character_series/${idOrSlug}`)
	}

	/**
	 * Creates a new character series
	 * Requires editor role (>= 7)
	 */
	async createCharacterSeries(payload: CreateCharacterSeriesPayload): Promise<CharacterSeries> {
		const result = await this.request<CharacterSeries>('/character_series', {
			method: 'POST',
			body: { character_series: payload }
		})
		// Clear character series cache
		this.clearCache('/character_series')
		return result
	}

	/**
	 * Updates an existing character series
	 * Requires editor role (>= 7)
	 *
	 * @param id - Character series UUID
	 * @param payload - Fields to update
	 */
	async updateCharacterSeries(
		id: string,
		payload: UpdateCharacterSeriesPayload
	): Promise<CharacterSeries> {
		const result = await this.request<CharacterSeries>(`/character_series/${id}`, {
			method: 'PATCH',
			body: { character_series: payload }
		})
		// Clear character series cache
		this.clearCache('/character_series')
		return result
	}

	/**
	 * Deletes a character series
	 * Requires editor role (>= 7)
	 * Will fail if series has associated characters
	 *
	 * @param id - Character series UUID
	 */
	async deleteCharacterSeries(id: string): Promise<void> {
		await this.request<void>(`/character_series/${id}`, {
			method: 'DELETE'
		})
		// Clear character series cache
		this.clearCache('/character_series')
	}

	/**
	 * Clears character series cache
	 */
	clearCharacterSeriesCache() {
		this.clearCache('/character_series')
	}

	/**
	 * Gets all summon series, sorted by order
	 * Returns list view with basic info (no summon count)
	 */
	async getSummonSeriesList(): Promise<SummonSeries[]> {
		return this.request<SummonSeries[]>('/summon_series')
	}

	/**
	 * Gets a single summon series by ID or slug
	 * Returns full view with summon count
	 *
	 * @param idOrSlug - UUID or slug (e.g., 'magna')
	 */
	async getSummonSeries(idOrSlug: string): Promise<SummonSeries> {
		return this.request<SummonSeries>(`/summon_series/${idOrSlug}`)
	}

	/**
	 * Creates a new summon series
	 * Requires editor role (>= 7)
	 */
	async createSummonSeries(payload: CreateSummonSeriesPayload): Promise<SummonSeries> {
		const result = await this.request<SummonSeries>('/summon_series', {
			method: 'POST',
			body: { summon_series: payload }
		})
		// Clear summon series cache
		this.clearCache('/summon_series')
		return result
	}

	/**
	 * Updates an existing summon series
	 * Requires editor role (>= 7)
	 *
	 * @param id - Summon series UUID
	 * @param payload - Fields to update
	 */
	async updateSummonSeries(id: string, payload: UpdateSummonSeriesPayload): Promise<SummonSeries> {
		const result = await this.request<SummonSeries>(`/summon_series/${id}`, {
			method: 'PATCH',
			body: { summon_series: payload }
		})
		// Clear summon series cache
		this.clearCache('/summon_series')
		return result
	}

	/**
	 * Deletes a summon series
	 * Requires editor role (>= 7)
	 * Will fail if series has associated summons
	 *
	 * @param id - Summon series UUID
	 */
	async deleteSummonSeries(id: string): Promise<void> {
		await this.request<void>(`/summon_series/${id}`, {
			method: 'DELETE'
		})
		// Clear summon series cache
		this.clearCache('/summon_series')
	}

	/**
	 * Clears summon series cache
	 */
	clearSummonSeriesCache() {
		this.clearCache('/summon_series')
	}
}

export const seriesAdapter = new SeriesAdapter(DEFAULT_ADAPTER_CONFIG)
