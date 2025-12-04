/**
 * Grid Adapter
 *
 * Handles all grid item operations including CRUD, positioning, and uncap management.
 * This adapter manages user instances of weapons, characters, and summons within parties.
 *
 * @module adapters/grid
 */

import { BaseAdapter } from './base.adapter'
import type { AdapterOptions } from './types'
import type { GridWeapon, GridCharacter, GridSummon } from '$lib/types/api/party'
import type { Character, Weapon } from '$lib/types/api/entities'
import { DEFAULT_ADAPTER_CONFIG } from './config'
import { validateGridWeapon, validateGridCharacter, validateGridSummon } from '$lib/utils/gridValidation'
import { isConflictResponse } from '$lib/types/api/conflict'

// GridWeapon, GridCharacter, and GridSummon types are imported from types/api/party
// Re-export for test files and consumers
export type { GridWeapon, GridCharacter, GridSummon }

/**
 * Parameters for creating grid items
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

export interface CreateGridCharacterParams {
	partyId: string
	characterId: string
	position: number
	uncapLevel?: number | undefined
	transcendenceStep?: number | undefined
	/** Optional reference to source collection character for syncing */
	collectionCharacterId?: string | undefined
}

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
 * Parameters for updating uncap levels
 */
export interface UpdateUncapParams {
	id?: string | undefined
	partyId: string
	position?: number | undefined
	uncapLevel: number
	transcendenceStep?: number | undefined
}

/**
 * Parameters for updating positions
 */
export interface UpdatePositionParams {
    partyId: string
    id: string
    position: number
    container?: string
}

/**
 * Parameters for swapping positions
 */
export interface SwapPositionsParams {
	partyId: string
	sourceId: string
	targetId: string
}

/**
 * Conflict resolution parameters
 */
export interface ResolveConflictParams {
	partyId: string
	incomingId: string
	position: number
	conflictingIds: string[]
}

/**
 * Response from syncing all party items
 */
export interface SyncAllPartyItemsResponse {
	party: import('$lib/types/api/party').Party
	synced: {
		characters: number
		weapons: number
		summons: number
		artifacts: number
	}
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
 * Weapon conflict response from API
 */
export interface WeaponConflictResponse {
	position: number
	conflicts: GridWeapon[]
	incoming: Weapon
}

/**
 * Grid adapter for managing user's grid item instances
 */
export class GridAdapter extends BaseAdapter {

	// Weapon operations

	/**
	 * Creates a new grid weapon instance
	 * Returns either a GridWeapon on success, or a WeaponConflictResponse if conflicts are detected
	 */
    async createWeapon(params: CreateGridWeaponParams, headers?: Record<string, string>): Promise<GridWeapon | WeaponConflictResponse> {
        const response = await this.request<{ gridWeapon: GridWeapon } | WeaponConflictResponse>('/grid_weapons', {
            method: 'POST',
            body: { weapon: params },
            headers
        })

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
    async updateWeapon(id: string, params: Partial<GridWeapon>, headers?: Record<string, string>): Promise<GridWeapon> {
        const response = await this.request<{ gridWeapon: GridWeapon }>(`/grid_weapons/${id}`, {
            method: 'PUT',
            body: { weapon: params },
            headers
        })
        return response.gridWeapon
    }

	/**
	 * Deletes a grid weapon instance
	 */
    async deleteWeapon(params: { id?: string; partyId: string; position?: number }, headers?: Record<string, string>): Promise<void> {
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
    async updateWeaponUncap(params: UpdateUncapParams, headers?: Record<string, string>): Promise<GridWeapon> {
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
    async resolveWeaponConflict(params: ResolveConflictParams, headers?: Record<string, string>): Promise<GridWeapon> {
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
    async updateWeaponPosition(params: UpdatePositionParams, headers?: Record<string, string>): Promise<GridWeapon> {
        const { id, position, container, partyId } = params
        const response = await this.request<{ gridWeapon: GridWeapon }>(`/parties/${partyId}/grid_weapons/${id}/position`, {
            method: 'PUT',
            body: { position, container },
            headers
        })
        return response.gridWeapon
    }

	/**
	 * Swaps two weapon positions
	 */
    async swapWeapons(params: SwapPositionsParams, headers?: Record<string, string>): Promise<{
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

	// Character operations

	/**
	 * Creates a new grid character instance
	 * Returns either a GridCharacter on success, or a CharacterConflictResponse if conflicts are detected
	 */
    async createCharacter(params: CreateGridCharacterParams, headers?: Record<string, string>): Promise<GridCharacter | CharacterConflictResponse> {
        const response = await this.request<{ gridCharacter: GridCharacter } | CharacterConflictResponse>('/grid_characters', {
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
    async updateCharacter(id: string, params: Partial<GridCharacter>, headers?: Record<string, string>): Promise<GridCharacter> {
        const response = await this.request<{ gridCharacter: GridCharacter }>(`/grid_characters/${id}`, {
            method: 'PUT',
            body: { character: params },
            headers
        })
        return response.gridCharacter
    }

	/**
	 * Deletes a grid character instance
	 */
    async deleteCharacter(params: { id?: string; partyId: string; position?: number }, headers?: Record<string, string>): Promise<void> {
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
    async updateCharacterUncap(params: UpdateUncapParams, headers?: Record<string, string>): Promise<GridCharacter> {
        const response = await this.request<{ gridCharacter: GridCharacter }>('/grid_characters/update_uncap', {
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
        })
        return response.gridCharacter
    }

	/**
	 * Resolves character conflicts
	 */
    async resolveCharacterConflict(params: ResolveConflictParams, headers?: Record<string, string>): Promise<GridCharacter> {
        const response = await this.request<{ gridCharacter: GridCharacter }>('/grid_characters/resolve', {
            method: 'POST',
            body: { resolve: params },
            headers
        })
        return response.gridCharacter
    }

	/**
	 * Updates character position
	 */
    async updateCharacterPosition(params: UpdatePositionParams, headers?: Record<string, string>): Promise<GridCharacter> {
        const { id, position, container, partyId } = params
        const response = await this.request<{ gridCharacter: GridCharacter }>(`/parties/${partyId}/grid_characters/${id}/position`, {
            method: 'PUT',
            body: { position, container },
            headers
        })
        return response.gridCharacter
    }

	/**
	 * Swaps two character positions
	 */
    async swapCharacters(params: SwapPositionsParams, headers?: Record<string, string>): Promise<{
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

	// Summon operations

	/**
	 * Creates a new grid summon instance
	 */
    async createSummon(params: CreateGridSummonParams, headers?: Record<string, string>): Promise<GridSummon> {
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
    async updateSummon(id: string, params: Partial<GridSummon>, headers?: Record<string, string>): Promise<GridSummon> {
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
    async deleteSummon(params: { id?: string; partyId: string; position?: number }, headers?: Record<string, string>): Promise<void> {
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
    async updateSummonUncap(params: UpdateUncapParams, headers?: Record<string, string>): Promise<GridSummon> {
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
	async updateQuickSummon(params: {
		id?: string
		partyId: string
		position?: number
		quickSummon: boolean
	}): Promise<GridSummon> {
		return this.request<GridSummon>('/grid_summons/update_quick_summon', {
			method: 'POST',
			body: params
		})
	}

	/**
	 * Updates summon position
	 */
    async updateSummonPosition(params: UpdatePositionParams, headers?: Record<string, string>): Promise<GridSummon> {
        const { id, position, container, partyId } = params
        const response = await this.request<{ gridSummon: GridSummon }>(`/parties/${partyId}/grid_summons/${id}/position`, {
            method: 'PUT',
            body: { position, container },
            headers
        })
        return response.gridSummon
    }

	/**
	 * Swaps two summon positions
	 */
    async swapSummons(params: SwapPositionsParams, headers?: Record<string, string>): Promise<{
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

	// Sync operations

	/**
	 * Syncs a grid character from its linked collection source
	 */
	async syncCharacter(id: string, headers?: Record<string, string>): Promise<GridCharacter> {
		const response = await this.request<{ gridCharacter: GridCharacter }>(`/grid_characters/${id}/sync`, {
			method: 'POST',
			headers
		})
		return response.gridCharacter
	}

	/**
	 * Syncs a grid weapon from its linked collection source
	 */
	async syncWeapon(id: string, headers?: Record<string, string>): Promise<GridWeapon> {
		const response = await this.request<{ gridWeapon: GridWeapon }>(`/grid_weapons/${id}/sync`, {
			method: 'POST',
			headers
		})
		return response.gridWeapon
	}

	/**
	 * Syncs a grid summon from its linked collection source
	 */
	async syncSummon(id: string, headers?: Record<string, string>): Promise<GridSummon> {
		const response = await this.request<{ gridSummon: GridSummon }>(`/grid_summons/${id}/sync`, {
			method: 'POST',
			headers
		})
		return response.gridSummon
	}

	/**
	 * Syncs all linked items in a party from their collection sources
	 */
	async syncAllPartyItems(partyId: string, headers?: Record<string, string>): Promise<SyncAllPartyItemsResponse> {
		return this.request<SyncAllPartyItemsResponse>(`/parties/${partyId}/sync_all`, {
			method: 'POST',
			headers
		})
	}

	/**
	 * Clears grid-specific cache
	 */
	clearGridCache(partyId?: string) {
		if (partyId) {
			this.clearCache(`/parties/${partyId}/grid`)
		} else {
			this.clearCache('/grid')
		}
	}
}

/**
 * Default grid adapter instance
 */
export const gridAdapter = new GridAdapter(DEFAULT_ADAPTER_CONFIG)
