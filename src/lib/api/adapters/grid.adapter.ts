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
import { DEFAULT_ADAPTER_CONFIG } from './config'

/**
 * Common grid item structure
 */
interface BaseGridItem {
	id: string
	partyId: string
	position: number
	uncapLevel?: number
	transcendenceStage?: number
}

/**
 * Grid weapon specific fields
 */
export interface GridWeapon extends BaseGridItem {
	weaponId: string
	mainhand?: boolean
	element?: number
	weaponKeys?: Array<{
		id: string
		slot: number
	}>
	axModifier1?: string
	axModifier2?: string
	axStrength1?: number
	axStrength2?: number
	awakeningId?: string
	awakeningLevel?: number
}

/**
 * Grid character specific fields
 */
export interface GridCharacter extends BaseGridItem {
	characterId: string
	perpetualModifiers?: Record<string, any>
	awakeningId?: string
	awakeningLevel?: number
	rings?: Array<{
		modifier: string
		strength: number
	}>
	earring?: {
		modifier: string
		strength: number
	}
}

/**
 * Grid summon specific fields
 */
export interface GridSummon extends BaseGridItem {
	summonId: string
	main?: boolean
	friend?: boolean
	quickSummon?: boolean
}

/**
 * Parameters for creating grid items
 */
export interface CreateGridWeaponParams {
	partyId: string
	weaponId: string
	position: number
	mainhand?: boolean
	uncapLevel?: number
	transcendenceStage?: number
}

export interface CreateGridCharacterParams {
	partyId: string
	characterId: string
	position: number
	uncapLevel?: number
	transcendenceStage?: number
}

export interface CreateGridSummonParams {
	partyId: string
	summonId: string
	position: number
	main?: boolean
	friend?: boolean
	quickSummon?: boolean
	uncapLevel?: number
	transcendenceStage?: number
}

/**
 * Parameters for updating uncap levels
 */
export interface UpdateUncapParams {
	id?: string
	partyId: string
	position?: number
	uncapLevel: number
	transcendenceStep?: number
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
 * Grid adapter for managing user's grid item instances
 */
export class GridAdapter extends BaseAdapter {

	// Weapon operations

	/**
	 * Creates a new grid weapon instance
	 */
    async createWeapon(params: CreateGridWeaponParams, headers?: Record<string, string>): Promise<GridWeapon> {
        return this.request<GridWeapon>('/grid_weapons', {
            method: 'POST',
            body: { weapon: params },
            headers
        })
    }

	/**
	 * Updates a grid weapon instance
	 */
    async updateWeapon(id: string, params: Partial<GridWeapon>, headers?: Record<string, string>): Promise<GridWeapon> {
        return this.request<GridWeapon>(`/grid_weapons/${id}`, {
            method: 'PUT',
            body: { weapon: params },
            headers
        })
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
        return this.request<GridWeapon>('/grid_weapons/update_uncap', {
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
    }

	/**
	 * Resolves weapon conflicts
	 */
    async resolveWeaponConflict(params: ResolveConflictParams, headers?: Record<string, string>): Promise<GridWeapon> {
        return this.request<GridWeapon>('/grid_weapons/resolve', {
            method: 'POST',
            body: { resolve: params },
            headers
        })
    }

	/**
	 * Updates weapon position
	 */
    async updateWeaponPosition(params: UpdatePositionParams, headers?: Record<string, string>): Promise<GridWeapon> {
        const { id, position, container, partyId } = params
        return this.request<GridWeapon>(`/parties/${partyId}/grid_weapons/${id}/position`, {
            method: 'PUT',
            body: { position, container },
            headers
        })
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
	 */
    async createCharacter(params: CreateGridCharacterParams, headers?: Record<string, string>): Promise<GridCharacter> {
        return this.request<GridCharacter>('/grid_characters', {
            method: 'POST',
            body: { character: params },
            headers
        })
    }

	/**
	 * Updates a grid character instance
	 */
    async updateCharacter(id: string, params: Partial<GridCharacter>, headers?: Record<string, string>): Promise<GridCharacter> {
        return this.request<GridCharacter>(`/grid_characters/${id}`, {
            method: 'PUT',
            body: { character: params },
            headers
        })
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
        return this.request<GridCharacter>('/grid_characters/update_uncap', {
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
    }

	/**
	 * Resolves character conflicts
	 */
    async resolveCharacterConflict(params: ResolveConflictParams, headers?: Record<string, string>): Promise<GridCharacter> {
        return this.request<GridCharacter>('/grid_characters/resolve', {
            method: 'POST',
            body: { resolve: params },
            headers
        })
    }

	/**
	 * Updates character position
	 */
    async updateCharacterPosition(params: UpdatePositionParams, headers?: Record<string, string>): Promise<GridCharacter> {
        const { id, position, container, partyId } = params
        return this.request<GridCharacter>(`/parties/${partyId}/grid_characters/${id}/position`, {
            method: 'PUT',
            body: { position, container },
            headers
        })
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
        return this.request<GridSummon>('/grid_summons', {
            method: 'POST',
            body: { summon: params },
            headers
        })
    }

	/**
	 * Updates a grid summon instance
	 */
    async updateSummon(id: string, params: Partial<GridSummon>, headers?: Record<string, string>): Promise<GridSummon> {
        return this.request<GridSummon>(`/grid_summons/${id}`, {
            method: 'PUT',
            body: { summon: params },
            headers
        })
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
        return this.request<GridSummon>('/grid_summons/update_uncap', {
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
        return this.request<GridSummon>(`/parties/${partyId}/grid_summons/${id}/position`, {
            method: 'PUT',
            body: { position, container },
            headers
        })
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
