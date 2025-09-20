/**
 * Party Adapter
 *
 * Handles all party-related API operations including CRUD, grids, and remixing.
 * Provides a clean interface for party management with automatic
 * request handling, caching, and error management.
 *
 * @module adapters/party
 */

import { BaseAdapter } from './base.adapter'
import type { RequestOptions, AdapterOptions, PaginatedResponse } from './types'

/**
 * Party data structure
 */
export interface Party {
	id: string
	shortcode: string
	name?: string
	description?: string
	visibility: 'public' | 'private' | 'unlisted'
	user: {
		id: string
		username: string
	}
	job?: {
		id: string
		name: Record<string, string>
		skills: Array<{
			id: string
			name: Record<string, string>
			slot: number
		}>
		accessory?: {
			id: string
			name: Record<string, string>
		}
	}
	raid?: {
		id: string
		name: Record<string, string>
		group?: {
			id: string
			name: Record<string, string>
		}
	}
	gridWeapons: GridWeapon[]
	gridSummons: GridSummon[]
	gridCharacters: GridCharacter[]
	guidebook?: {
		id: string
		title: string
	}
	extras?: Record<string, any>
	createdAt: string
	updatedAt: string
}

/**
 * Grid weapon structure
 */
export interface GridWeapon {
	id: string
	position: number
	mainhand: boolean
	uncapLevel: number
	transcendenceStage: number
	weaponKeys: Array<{
		id: string
		slot: number
	}>
	weapon: {
		id: string
		granblueId: string
		name: Record<string, string>
		element: number
		rarity: number
	}
}

/**
 * Grid summon structure
 */
export interface GridSummon {
	id: string
	position: number
	quickSummon: boolean
	transcendenceStage: number
	summon: {
		id: string
		granblueId: string
		name: Record<string, string>
		element: number
		rarity: number
	}
}

/**
 * Grid character structure
 */
export interface GridCharacter {
	id: string
	position: number
	uncapLevel: number
	transcendenceStage: number
	perpetualModifiers?: Record<string, any>
	awakenings?: Array<{
		id: string
		level: number
	}>
	character: {
		id: string
		granblueId: string
		name: Record<string, string>
		element: number
		rarity: number
	}
}

/**
 * Parameters for creating a new party
 */
export interface CreatePartyParams {
	name?: string
	description?: string
	visibility?: 'public' | 'private' | 'unlisted'
	jobId?: string
	raidId?: string
	guidebookId?: string
	extras?: Record<string, any>
}

/**
 * Parameters for updating a party
 */
export interface UpdatePartyParams extends CreatePartyParams {
	shortcode: string
}

/**
 * Parameters for listing user parties
 */
export interface ListUserPartiesParams {
	username: string
	page?: number
	per?: number
	visibility?: 'public' | 'private' | 'unlisted' | 'all'
	raidId?: string
	characterId?: string
	weaponId?: string
	summonId?: string
}

/**
 * Parameters for updating grid items
 */
export interface UpdateGridParams<T> {
	shortcode: string
	updates: T[]
}

/**
 * Grid weapon update structure
 */
export interface GridWeaponUpdate {
	id?: string
	position: number
	weaponId: string
	mainhand?: boolean
	uncapLevel?: number
	transcendenceStage?: number
	weaponKeys?: Array<{
		id: string
		slot: number
	}>
	_destroy?: boolean
}

/**
 * Grid summon update structure
 */
export interface GridSummonUpdate {
	id?: string
	position: number
	summonId: string
	quickSummon?: boolean
	transcendenceStage?: number
	_destroy?: boolean
}

/**
 * Grid character update structure
 */
export interface GridCharacterUpdate {
	id?: string
	position: number
	characterId: string
	uncapLevel?: number
	transcendenceStage?: number
	perpetualModifiers?: Record<string, any>
	awakenings?: Array<{
		id: string
		level: number
	}>
	_destroy?: boolean
}

/**
 * Conflict resolution result
 */
export interface ConflictResolution {
	conflicts: Array<{
		type: 'weapon' | 'summon' | 'character'
		position: number
		existing: any
		new: any
	}>
	resolved: boolean
}

/**
 * Party adapter for managing parties and their grids
 */
export class PartyAdapter extends BaseAdapter {
	constructor(options?: AdapterOptions) {
		super({
			...options,
			baseURL: options?.baseURL || '/api/v1'
		})
	}

	/**
	 * Creates a new party
	 */
	async create(params: CreatePartyParams): Promise<Party> {
		return this.request<Party>('/parties', {
			method: 'POST',
			body: {
				party: params
			}
		})
	}

	/**
	 * Gets a party by shortcode
	 */
	async getByShortcode(shortcode: string): Promise<Party> {
		return this.request<Party>(`/parties/${shortcode}`, {
			cacheTTL: 60000 // Cache for 1 minute
		})
	}

	/**
	 * Updates a party
	 */
	async update(params: UpdatePartyParams): Promise<Party> {
		const { shortcode, ...updateParams } = params
		return this.request<Party>(`/parties/${shortcode}`, {
			method: 'PATCH',
			body: {
				party: updateParams
			}
		})
	}

	/**
	 * Deletes a party
	 */
	async delete(shortcode: string): Promise<void> {
		return this.request<void>(`/parties/${shortcode}`, {
			method: 'DELETE'
		})
	}

	/**
	 * Creates a remix (copy) of an existing party
	 */
	async remix(shortcode: string): Promise<Party> {
		return this.request<Party>(`/parties/${shortcode}/remix`, {
			method: 'POST'
		})
	}

	/**
	 * Lists parties for a specific user
	 */
	async listUserParties(params: ListUserPartiesParams): Promise<PaginatedResponse<Party>> {
		const { username, ...queryParams } = params
		return this.request<PaginatedResponse<Party>>(`/users/${username}/parties`, {
			method: 'GET',
			query: queryParams,
			cacheTTL: 30000 // Cache for 30 seconds
		})
	}

	/**
	 * Updates grid weapons for a party
	 */
	async updateGridWeapons(
		params: UpdateGridParams<GridWeaponUpdate>
	): Promise<{ gridWeapons: GridWeapon[]; conflicts?: ConflictResolution }> {
		const { shortcode, updates } = params
		return this.request(`/parties/${shortcode}/grid_weapons`, {
			method: 'PATCH',
			body: {
				grid_weapons: updates
			}
		})
	}

	/**
	 * Updates grid summons for a party
	 */
	async updateGridSummons(
		params: UpdateGridParams<GridSummonUpdate>
	): Promise<{ gridSummons: GridSummon[]; conflicts?: ConflictResolution }> {
		const { shortcode, updates } = params
		return this.request(`/parties/${shortcode}/grid_summons`, {
			method: 'PATCH',
			body: {
				grid_summons: updates
			}
		})
	}

	/**
	 * Updates grid characters for a party
	 */
	async updateGridCharacters(
		params: UpdateGridParams<GridCharacterUpdate>
	): Promise<{ gridCharacters: GridCharacter[]; conflicts?: ConflictResolution }> {
		const { shortcode, updates } = params
		return this.request(`/parties/${shortcode}/grid_characters`, {
			method: 'PATCH',
			body: {
				grid_characters: updates
			}
		})
	}

	/**
	 * Updates the job for a party
	 */
	async updateJob(
		shortcode: string,
		jobId: string,
		skills?: Array<{ id: string; slot: number }>,
		accessoryId?: string
	): Promise<Party> {
		return this.request<Party>(`/parties/${shortcode}`, {
			method: 'PATCH',
			body: {
				party: {
					job_id: jobId,
					...(skills && { job_skills_attributes: skills }),
					...(accessoryId && { job_accessory_id: accessoryId })
				}
			}
		})
	}

	/**
	 * Clears the cache for party-related data
	 */
	clearPartyCache(shortcode?: string) {
		if (shortcode) {
			// Clear specific party cache
			this.clearCache(`/parties/${shortcode}`)
		} else {
			// Clear all party and user caches
			this.clearCache('/parties')
			this.clearCache('/users')
		}
	}
}

/**
 * Default party adapter instance
 */
export const partyAdapter = new PartyAdapter()