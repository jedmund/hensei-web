/**
 * Grid Weapon Adapter
 *
 * Handles a party's grid weapons: CRUD, conflict resolution, positioning,
 * uncap management and duplication.
 *
 * @module adapters/gridWeapon
 */

import { BaseAdapter } from './base.adapter'
import { DEFAULT_ADAPTER_CONFIG } from './config'
import type {
	ResolveConflictParams,
	SwapPositionsParams,
	UpdatePositionParams,
	UpdateUncapParams
} from './grid.shared'
import type { GridWeapon } from '$lib/types/api/party'
import type { Weapon } from '$lib/types/api/entities'
import { validateGridWeapon } from '$lib/utils/gridValidation'
import { isConflictResponse } from '$lib/types/api/conflict'

/**
 * Parameters for creating grid weapons
 */
export interface CreateGridWeaponParams {
	partyId: string
	weaponId: string
	position: number
	mainhand?: boolean | undefined
	uncapLevel?: number | undefined
	transcendenceStep?: number | undefined
	/** Optional reference to source collection weapon for syncing */
	collectionWeaponId?: string | undefined
}

/**
 * Weapon conflict response from API
 */
export interface WeaponConflictResponse {
	position: number
	conflicts: GridWeapon[]
	incoming: Weapon
}

/**
 * Grid weapon adapter for managing a party's weapon instances
 */
export class GridWeaponAdapter extends BaseAdapter {
	/**
	 * Creates a new grid weapon instance
	 * Returns either a GridWeapon on success, or a WeaponConflictResponse if conflicts are detected
	 */
	async createWeapon(
		params: CreateGridWeaponParams,
		headers?: Record<string, string>
	): Promise<GridWeapon | WeaponConflictResponse> {
		const response = await this.request<{ gridWeapon: GridWeapon } | WeaponConflictResponse>(
			'/grid_weapons',
			{
				method: 'POST',
				body: { weapon: params },
				headers
			}
		)

		// Check if this is a conflict response
		if (isConflictResponse(response)) {
			return response as WeaponConflictResponse
		}

		// Normal success response - validate and normalize
		const gridWeaponResponse = response as { gridWeapon: GridWeapon }
		const validated = validateGridWeapon(gridWeaponResponse.gridWeapon)
		if (!validated) {
			throw new Error('API returned incomplete GridWeapon data')
		}

		return validated
	}

	/**
	 * Updates a grid weapon instance
	 */
	async updateWeapon(
		id: string,
		params: Partial<GridWeapon>,
		headers?: Record<string, string>
	): Promise<GridWeapon> {
		// Flatten nested awakening object into awakening_id/awakening_level
		// since the Rails API expects flat params, not nested attributes
		const { awakening, bullets, ...rest } = params as Partial<GridWeapon> & {
			awakening?: { id: string; level: number } | null
		}
		const body: Record<string, unknown> = { ...rest }
		if (awakening !== undefined) {
			if (awakening === null) {
				// awakening_level is NOT NULL (default 1); the level is meaningless without an awakening
				body.awakeningId = null
				body.awakeningLevel = 1
			} else {
				body.awakeningId = awakening.id
				body.awakeningLevel = awakening.level
			}
		}

		// Flatten bullet loadout into array of { position, bullet_id }
		if (bullets !== undefined) {
			body.bullets =
				bullets?.map((b) => ({
					position: b.position,
					bulletId: b.bullet.id
				})) ?? []
		}

		const response = await this.request<{ gridWeapon: GridWeapon }>(`/grid_weapons/${id}`, {
			method: 'PUT',
			body: { weapon: body },
			headers
		})
		return response.gridWeapon
	}

	/**
	 * Deletes a grid weapon instance
	 */
	async deleteWeapon(
		params: { id?: string; partyId: string; position?: number },
		headers?: Record<string, string>
	): Promise<void> {
		// If we have an ID, use it in the URL (standard Rails REST)
		if (params.id) {
			return this.request<void>(`/grid_weapons/${params.id}`, {
				method: 'DELETE',
				headers
			})
		}
		// Otherwise, send params in body for position-based delete
		return this.request<void>('/grid_weapons/delete_by_position', {
			method: 'DELETE',
			body: params,
			headers
		})
	}

	/**
	 * Updates weapon uncap level
	 */
	async updateWeaponUncap(
		params: UpdateUncapParams,
		headers?: Record<string, string>
	): Promise<GridWeapon> {
		const response = await this.request<{ gridWeapon: GridWeapon }>('/grid_weapons/update_uncap', {
			method: 'POST',
			body: {
				weapon: {
					id: params.id,
					partyId: params.partyId,
					uncapLevel: params.uncapLevel,
					transcendenceStep: params.transcendenceStep
				}
			},
			headers
		})
		return response.gridWeapon
	}

	/**
	 * Resolves weapon conflicts
	 */
	async resolveWeaponConflict(
		params: ResolveConflictParams,
		headers?: Record<string, string>
	): Promise<GridWeapon> {
		const response = await this.request<{ gridWeapon: GridWeapon }>('/grid_weapons/resolve', {
			method: 'POST',
			body: { resolve: params },
			headers
		})
		return response.gridWeapon
	}

	/**
	 * Updates weapon position
	 */
	async updateWeaponPosition(
		params: UpdatePositionParams,
		headers?: Record<string, string>
	): Promise<GridWeapon> {
		const { id, position, container, partyId } = params
		const response = await this.request<{ gridWeapon: GridWeapon }>(
			`/parties/${partyId}/grid_weapons/${id}/position`,
			{
				method: 'PUT',
				body: { position, container },
				headers
			}
		)
		return response.gridWeapon
	}

	/**
	 * Swaps two weapon positions
	 */
	async swapWeapons(
		params: SwapPositionsParams,
		headers?: Record<string, string>
	): Promise<{
		source: GridWeapon
		target: GridWeapon
	}> {
		const { partyId, sourceId, targetId } = params
		return this.request(`/parties/${partyId}/grid_weapons/swap`, {
			method: 'POST',
			body: { source_id: sourceId, target_id: targetId },
			headers
		})
	}

	/**
	 * Duplicates a grid weapon to a new position
	 */
	async duplicateWeapon(
		params: { id: string; position: number },
		headers?: Record<string, string>
	): Promise<GridWeapon> {
		const response = await this.request<{ gridWeapon: GridWeapon }>(
			`/grid_weapons/${params.id}/duplicate`,
			{
				method: 'POST',
				body: { position: params.position },
				headers
			}
		)
		return response.gridWeapon
	}
}

/**
 * Default grid weapon adapter instance
 */
export const gridWeaponAdapter = new GridWeaponAdapter(DEFAULT_ADAPTER_CONFIG)
