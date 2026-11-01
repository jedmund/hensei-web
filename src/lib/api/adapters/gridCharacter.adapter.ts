/**
 * Grid Character Adapter
 *
 * Handles a party's grid characters: CRUD, conflict resolution, positioning,
 * uncap management and style switching.
 *
 * @module adapters/gridCharacter
 */

import { BaseAdapter } from './base.adapter'
import { DEFAULT_ADAPTER_CONFIG } from './config'
import type {
	ResolveConflictParams,
	SwapPositionsParams,
	UpdatePositionParams,
	UpdateUncapParams
} from './grid.shared'
import type { GridCharacter } from '$lib/types/api/party'
import type { Character } from '$lib/types/api/entities'
import { validateGridCharacter } from '$lib/utils/gridValidation'
import { isConflictResponse } from '$lib/types/api/conflict'

/**
 * Parameters for creating grid characters
 */
export interface CreateGridCharacterParams {
	partyId: string
	characterId: string
	position: number
	uncapLevel?: number | undefined
	transcendenceStep?: number | undefined
	/** Optional reference to source collection character for syncing */
	collectionCharacterId?: string | undefined
}

/**
 * Character conflict response from API
 */
export interface CharacterConflictResponse {
	position: number
	conflicts: GridCharacter[]
	incoming: Character
}

/**
 * Grid character adapter for managing a party's character instances
 */
export class GridCharacterAdapter extends BaseAdapter {
	/**
	 * Creates a new grid character instance
	 * Returns either a GridCharacter on success, or a CharacterConflictResponse if conflicts are detected
	 */
	async createCharacter(
		params: CreateGridCharacterParams,
		headers?: Record<string, string>
	): Promise<GridCharacter | CharacterConflictResponse> {
		const response = await this.request<
			{ gridCharacter: GridCharacter } | CharacterConflictResponse
		>('/grid_characters', {
			method: 'POST',
			body: { character: params },
			headers
		})

		// Check if this is a conflict response
		if (isConflictResponse(response)) {
			return response as CharacterConflictResponse
		}

		// Normal success response - validate and normalize
		const gridCharacterResponse = response as { gridCharacter: GridCharacter }
		const validated = validateGridCharacter(gridCharacterResponse.gridCharacter)
		if (!validated) {
			throw new Error('API returned incomplete GridCharacter data')
		}

		return validated
	}

	/**
	 * Updates a grid character instance
	 */
	async updateCharacter(
		id: string,
		params: Partial<GridCharacter>,
		headers?: Record<string, string>
	): Promise<GridCharacter> {
		// The character controller permits `awakening: { id, level }` nested
		// only — top-level awakening_id/awakening_level get stripped by strong
		// params. Forward the nested shape directly. Null is sent as { id: null,
		// level: null } so transform_character_params doesn't try to dereference
		// a nil hash.
		const { awakening, ...rest } = params as Partial<GridCharacter> & {
			awakening?: { id: string; level: number } | null
		}
		const body: Record<string, unknown> = { ...rest }
		if (awakening !== undefined) {
			body.awakening =
				awakening === null
					? { id: null, level: null }
					: { id: awakening.id, level: awakening.level }
		}

		const response = await this.request<{ gridCharacter: GridCharacter }>(
			`/grid_characters/${id}`,
			{
				method: 'PUT',
				body: { character: body },
				headers
			}
		)
		return response.gridCharacter
	}

	/**
	 * Deletes a grid character instance
	 */
	async deleteCharacter(
		params: { id?: string; partyId: string; position?: number },
		headers?: Record<string, string>
	): Promise<void> {
		// If we have an ID, use it in the URL (standard Rails REST)
		if (params.id) {
			return this.request<void>(`/grid_characters/${params.id}`, {
				method: 'DELETE',
				headers
			})
		}
		// Otherwise, send params in body for position-based delete
		return this.request<void>('/grid_characters/delete_by_position', {
			method: 'DELETE',
			body: params,
			headers
		})
	}

	/**
	 * Updates character uncap level
	 */
	async updateCharacterUncap(
		params: UpdateUncapParams,
		headers?: Record<string, string>
	): Promise<GridCharacter> {
		const response = await this.request<{ gridCharacter: GridCharacter }>(
			'/grid_characters/update_uncap',
			{
				method: 'POST',
				body: {
					character: {
						id: params.id,
						partyId: params.partyId,
						uncapLevel: params.uncapLevel,
						transcendenceStep: params.transcendenceStep
					}
				},
				headers
			}
		)
		return response.gridCharacter
	}

	/**
	 * Resolves character conflicts
	 */
	async resolveCharacterConflict(
		params: ResolveConflictParams,
		headers?: Record<string, string>
	): Promise<GridCharacter> {
		const response = await this.request<{ gridCharacter: GridCharacter }>(
			'/grid_characters/resolve',
			{
				method: 'POST',
				body: { resolve: params },
				headers
			}
		)
		return response.gridCharacter
	}

	/**
	 * Updates character position
	 */
	async updateCharacterPosition(
		params: UpdatePositionParams,
		headers?: Record<string, string>
	): Promise<GridCharacter> {
		const { id, position, container, partyId } = params
		const response = await this.request<{ gridCharacter: GridCharacter }>(
			`/parties/${partyId}/grid_characters/${id}/position`,
			{
				method: 'PUT',
				body: { position, container },
				headers
			}
		)
		return response.gridCharacter
	}

	/**
	 * Swaps two character positions
	 */
	async swapCharacters(
		params: SwapPositionsParams,
		headers?: Record<string, string>
	): Promise<{
		source: GridCharacter
		target: GridCharacter
	}> {
		const { partyId, sourceId, targetId } = params
		return this.request(`/parties/${partyId}/grid_characters/swap`, {
			method: 'POST',
			body: { source_id: sourceId, target_id: targetId },
			headers
		})
	}

	// Style swap operations

	/**
	 * Switches a grid character between its base and style swap variant
	 */
	async switchCharacterStyle(id: string, headers?: Record<string, string>): Promise<GridCharacter> {
		const response = await this.request<{ gridCharacter: GridCharacter }>(
			`/grid_characters/${id}/switch_style`,
			{
				method: 'POST',
				headers
			}
		)
		return response.gridCharacter
	}
}

/**
 * Default grid character adapter instance
 */
export const gridCharacterAdapter = new GridCharacterAdapter(DEFAULT_ADAPTER_CONFIG)
