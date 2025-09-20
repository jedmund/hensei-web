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
	constructor(options?: AdapterOptions) {
		super({
			...options,
			baseURL: options?.baseURL || '/api/v1'
		})
	}

	// Weapon operations

	/**
	 * Creates a new grid weapon instance
	 */
	async createWeapon(params: CreateGridWeaponParams): Promise<GridWeapon> {
		return this.request<GridWeapon>('/grid_weapons', {
			method: 'POST',
			body: params
		})
	}

	/**
	 * Updates a grid weapon instance
	 */
	async updateWeapon(id: string, params: Partial<GridWeapon>): Promise<GridWeapon> {
		return this.request<GridWeapon>(`/grid_weapons/${id}`, {
			method: 'PUT',
			body: params
		})
	}

	/**
	 * Deletes a grid weapon instance
	 */
	async deleteWeapon(params: { id?: string; partyId: string; position?: number }): Promise<void> {
		return this.request<void>('/grid_weapons', {
			method: 'DELETE',
			body: params
		})
	}

	/**
	 * Updates weapon uncap level
	 */
	async updateWeaponUncap(params: UpdateUncapParams): Promise<GridWeapon> {
		return this.request<GridWeapon>('/grid_weapons/update_uncap', {
			method: 'POST',
			body: params
		})
	}

	/**
	 * Resolves weapon conflicts
	 */
	async resolveWeaponConflict(params: ResolveConflictParams): Promise<GridWeapon> {
		return this.request<GridWeapon>('/grid_weapons/resolve', {
			method: 'POST',
			body: params
		})
	}

	/**
	 * Updates weapon position
	 */
	async updateWeaponPosition(params: UpdatePositionParams): Promise<GridWeapon> {
		const { partyId, id, ...positionData } = params
		return this.request<GridWeapon>(`/parties/${partyId}/grid_weapons/${id}/position`, {
			method: 'PUT',
			body: positionData
		})
	}

	/**
	 * Swaps two weapon positions
	 */
	async swapWeapons(params: SwapPositionsParams): Promise<{
		source: GridWeapon
		target: GridWeapon
	}> {
		const { partyId, ...swapData } = params
		return this.request(`/parties/${partyId}/grid_weapons/swap`, {
			method: 'POST',
			body: swapData
		})
	}

	// Character operations

	/**
	 * Creates a new grid character instance
	 */
	async createCharacter(params: CreateGridCharacterParams): Promise<GridCharacter> {
		return this.request<GridCharacter>('/grid_characters', {
			method: 'POST',
			body: params
		})
	}

	/**
	 * Updates a grid character instance
	 */
	async updateCharacter(id: string, params: Partial<GridCharacter>): Promise<GridCharacter> {
		return this.request<GridCharacter>(`/grid_characters/${id}`, {
			method: 'PUT',
			body: params
		})
	}

	/**
	 * Deletes a grid character instance
	 */
	async deleteCharacter(params: { id?: string; partyId: string; position?: number }): Promise<void> {
		return this.request<void>('/grid_characters', {
			method: 'DELETE',
			body: params
		})
	}

	/**
	 * Updates character uncap level
	 */
	async updateCharacterUncap(params: UpdateUncapParams): Promise<GridCharacter> {
		return this.request<GridCharacter>('/grid_characters/update_uncap', {
			method: 'POST',
			body: params
		})
	}

	/**
	 * Resolves character conflicts
	 */
	async resolveCharacterConflict(params: ResolveConflictParams): Promise<GridCharacter> {
		return this.request<GridCharacter>('/grid_characters/resolve', {
			method: 'POST',
			body: params
		})
	}

	/**
	 * Updates character position
	 */
	async updateCharacterPosition(params: UpdatePositionParams): Promise<GridCharacter> {
		const { partyId, id, ...positionData } = params
		return this.request<GridCharacter>(`/parties/${partyId}/grid_characters/${id}/position`, {
			method: 'PUT',
			body: positionData
		})
	}

	/**
	 * Swaps two character positions
	 */
	async swapCharacters(params: SwapPositionsParams): Promise<{
		source: GridCharacter
		target: GridCharacter
	}> {
		const { partyId, ...swapData } = params
		return this.request(`/parties/${partyId}/grid_characters/swap`, {
			method: 'POST',
			body: swapData
		})
	}

	// Summon operations

	/**
	 * Creates a new grid summon instance
	 */
	async createSummon(params: CreateGridSummonParams): Promise<GridSummon> {
		return this.request<GridSummon>('/grid_summons', {
			method: 'POST',
			body: params
		})
	}

	/**
	 * Updates a grid summon instance
	 */
	async updateSummon(id: string, params: Partial<GridSummon>): Promise<GridSummon> {
		return this.request<GridSummon>(`/grid_summons/${id}`, {
			method: 'PUT',
			body: params
		})
	}

	/**
	 * Deletes a grid summon instance
	 */
	async deleteSummon(params: { id?: string; partyId: string; position?: number }): Promise<void> {
		return this.request<void>('/grid_summons', {
			method: 'DELETE',
			body: params
		})
	}

	/**
	 * Updates summon uncap level
	 */
	async updateSummonUncap(params: UpdateUncapParams): Promise<GridSummon> {
		return this.request<GridSummon>('/grid_summons/update_uncap', {
			method: 'POST',
			body: params
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
	async updateSummonPosition(params: UpdatePositionParams): Promise<GridSummon> {
		const { partyId, id, ...positionData } = params
		return this.request<GridSummon>(`/parties/${partyId}/grid_summons/${id}/position`, {
			method: 'PUT',
			body: positionData
		})
	}

	/**
	 * Swaps two summon positions
	 */
	async swapSummons(params: SwapPositionsParams): Promise<{
		source: GridSummon
		target: GridSummon
	}> {
		const { partyId, ...swapData } = params
		return this.request(`/parties/${partyId}/grid_summons/swap`, {
			method: 'POST',
			body: swapData
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
export const gridAdapter = new GridAdapter()