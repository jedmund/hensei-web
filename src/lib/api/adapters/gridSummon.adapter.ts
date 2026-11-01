/**
 * Grid Summon Adapter
 *
 * Handles a party's grid summons: CRUD, positioning, uncap and quick summon
 * management, and duplication.
 *
 * @module adapters/gridSummon
 */

import { BaseAdapter } from './base.adapter'
import { DEFAULT_ADAPTER_CONFIG } from './config'
import type { SwapPositionsParams, UpdatePositionParams, UpdateUncapParams } from './grid.shared'
import type { GridSummon } from '$lib/types/api/party'
import { validateGridSummon } from '$lib/utils/gridValidation'

/**
 * Parameters for creating grid summons
 */
export interface CreateGridSummonParams {
	partyId: string
	summonId: string
	position: number
	main?: boolean | undefined
	friend?: boolean | undefined
	quickSummon?: boolean | undefined
	uncapLevel?: number | undefined
	transcendenceStep?: number | undefined
	/** Optional reference to source collection summon for syncing */
	collectionSummonId?: string | undefined
}

/**
 * Grid summon adapter for managing a party's summon instances
 */
export class GridSummonAdapter extends BaseAdapter {
	/**
	 * Creates a new grid summon instance
	 */
	async createSummon(
		params: CreateGridSummonParams,
		headers?: Record<string, string>
	): Promise<GridSummon> {
		const response = await this.request<{ gridSummon: GridSummon }>('/grid_summons', {
			method: 'POST',
			body: { summon: params },
			headers
		})

		// Validate and normalize response
		const validated = validateGridSummon(response.gridSummon)
		if (!validated) {
			throw new Error('API returned incomplete GridSummon data')
		}

		return validated
	}

	/**
	 * Updates a grid summon instance
	 */
	async updateSummon(
		id: string,
		params: Partial<GridSummon>,
		headers?: Record<string, string>
	): Promise<GridSummon> {
		const response = await this.request<{ gridSummon: GridSummon }>(`/grid_summons/${id}`, {
			method: 'PUT',
			body: { summon: params },
			headers
		})
		return response.gridSummon
	}

	/**
	 * Deletes a grid summon instance
	 */
	async deleteSummon(
		params: { id?: string; partyId: string; position?: number },
		headers?: Record<string, string>
	): Promise<void> {
		// If we have an ID, use it in the URL (standard Rails REST)
		if (params.id) {
			return this.request<void>(`/grid_summons/${params.id}`, {
				method: 'DELETE',
				headers
			})
		}
		// Otherwise, send params in body for position-based delete
		return this.request<void>('/grid_summons/delete_by_position', {
			method: 'DELETE',
			body: params,
			headers
		})
	}

	/**
	 * Updates summon uncap level
	 */
	async updateSummonUncap(
		params: UpdateUncapParams,
		headers?: Record<string, string>
	): Promise<GridSummon> {
		const response = await this.request<{ gridSummon: GridSummon }>('/grid_summons/update_uncap', {
			method: 'POST',
			body: {
				summon: {
					id: params.id,
					partyId: params.partyId,
					uncapLevel: params.uncapLevel,
					transcendenceStep: params.transcendenceStep
				}
			},
			headers
		})
		return response.gridSummon
	}

	/**
	 * Updates summon quick summon setting
	 */
	async updateQuickSummon(
		params: {
			id?: string
			partyId: string
			position?: number
			quickSummon: boolean
		},
		headers?: Record<string, string>
	): Promise<GridSummon> {
		return this.request<GridSummon>('/grid_summons/update_quick_summon', {
			method: 'POST',
			body: {
				summon: {
					id: params.id,
					party_id: params.partyId,
					position: params.position,
					quick_summon: params.quickSummon
				}
			},
			headers
		})
	}

	/**
	 * Updates summon position
	 */
	async updateSummonPosition(
		params: UpdatePositionParams,
		headers?: Record<string, string>
	): Promise<GridSummon> {
		const { id, position, container, partyId } = params
		const response = await this.request<{ gridSummon: GridSummon }>(
			`/parties/${partyId}/grid_summons/${id}/position`,
			{
				method: 'PUT',
				body: { position, container },
				headers
			}
		)
		return response.gridSummon
	}

	/**
	 * Swaps two summon positions
	 */
	async swapSummons(
		params: SwapPositionsParams,
		headers?: Record<string, string>
	): Promise<{
		source: GridSummon
		target: GridSummon
	}> {
		const { partyId, sourceId, targetId } = params
		return this.request(`/parties/${partyId}/grid_summons/swap`, {
			method: 'POST',
			body: { source_id: sourceId, target_id: targetId },
			headers
		})
	}

	/**
	 * Duplicates a grid summon to a new position
	 */
	async duplicateSummon(
		params: { id: string; position: number },
		headers?: Record<string, string>
	): Promise<GridSummon> {
		const response = await this.request<{ gridSummon: GridSummon }>(
			`/grid_summons/${params.id}/duplicate`,
			{
				method: 'POST',
				body: { position: params.position },
				headers
			}
		)
		return response.gridSummon
	}
}

/**
 * Default grid summon adapter instance
 */
export const gridSummonAdapter = new GridSummonAdapter(DEFAULT_ADAPTER_CONFIG)
