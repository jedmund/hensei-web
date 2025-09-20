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
import { DEFAULT_ADAPTER_CONFIG } from './config'

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
 * Grid operation for batch updates
 */
export interface GridOperation {
	type: 'move' | 'swap' | 'remove'
	entity: 'weapon' | 'character' | 'summon'
	id?: string
	sourceId?: string
	targetId?: string
	position?: number
	container?: string
}

/**
 * Options for grid update operation
 */
export interface GridUpdateOptions {
	maintainCharacterSequence?: boolean
	validateBeforeExecute?: boolean
}

/**
 * Response from grid update operation
 */
export interface GridUpdateResponse {
	party: Party
	operationsApplied: number
	changes: Array<{
		entity: string
		id: string
		action: string
		from?: number
		to?: number
		with?: string
	}>
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
	 * Lists all public parties (explore page)
	 */
	async list(params: { page?: number; per?: number } = {}): Promise<PaginatedResponse<Party>> {
		return this.request<PaginatedResponse<Party>>('/parties', {
			method: 'GET',
			query: params,
			cacheTTL: 30000 // Cache for 30 seconds
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
	 * Performs atomic batch grid updates
	 * Supports move, swap, and remove operations on grid items
	 */
	async gridUpdate(
		shortcode: string,
		operations: GridOperation[],
		options?: GridUpdateOptions
	): Promise<GridUpdateResponse> {
		return this.request(`/parties/${shortcode}/grid_update`, {
			method: 'POST',
			body: {
				operations,
				options
			}
		})
	}

	/**
	 * Updates the job for a party
	 */
	async updateJob(
		shortcode: string,
		jobId: string
	): Promise<Party> {
		return this.request<Party>(`/parties/${shortcode}/jobs`, {
			method: 'PUT',
			body: {
				job_id: jobId
			}
		})
	}

	/**
	 * Updates job skills for a party
	 */
	async updateJobSkills(
		shortcode: string,
		skills: Array<{ id: string; slot: number }>
	): Promise<Party> {
		return this.request<Party>(`/parties/${shortcode}/job_skills`, {
			method: 'PUT',
			body: {
				skills
			}
		})
	}

	/**
	 * Removes a job skill from a party
	 */
	async removeJobSkill(
		shortcode: string,
		skillSlot: number
	): Promise<Party> {
		return this.request<Party>(`/parties/${shortcode}/job_skills`, {
			method: 'DELETE',
			body: {
				slot: skillSlot
			}
		})
	}

	/**
	 * Gets party preview image
	 */
	async getPreview(shortcode: string): Promise<Blob> {
		return this.request<Blob>(`/parties/${shortcode}/preview`, {
			method: 'GET',
			headers: {
				'Accept': 'image/png'
			}
		})
	}

	/**
	 * Gets party preview status
	 */
	async getPreviewStatus(shortcode: string): Promise<{
		state: string
		generatedAt?: string
		readyForPreview: boolean
	}> {
		return this.request(`/parties/${shortcode}/preview_status`, {
			method: 'GET'
		})
	}

	/**
	 * Regenerates party preview
	 */
	async regeneratePreview(shortcode: string): Promise<{ status: string }> {
		return this.request(`/parties/${shortcode}/regenerate_preview`, {
			method: 'POST'
		})
	}

	/**
	 * Favorite a party
	 */
	async favorite(shortcode: string): Promise<void> {
		await this.request(`/parties/${shortcode}/favorite`, {
			method: 'POST'
		})
		// Clear cache for the party to reflect updated state
		this.clearCache(`/parties/${shortcode}`)
	}

	/**
	 * Unfavorite a party
	 */
	async unfavorite(shortcode: string): Promise<void> {
		await this.request(`/parties/${shortcode}/unfavorite`, {
			method: 'DELETE'
		})
		// Clear cache for the party to reflect updated state
		this.clearCache(`/parties/${shortcode}`)
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
export const partyAdapter = new PartyAdapter(DEFAULT_ADAPTER_CONFIG)