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
import type { AdapterOptions, PaginatedResponse } from './types'
import { DEFAULT_ADAPTER_CONFIG } from './config'
import type { Party, GridWeapon, GridCharacter, GridSummon } from '$lib/types/api/party'

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
		super(options)
		// Temporarily disable cache until cache invalidation is fixed
		this.disableCache = true
	}

	/**
	 * Creates a new party
	 */
	async create(params: CreatePartyParams): Promise<Party> {
		const response = await this.request<{ party: Party }>('/parties', {
			method: 'POST',
			body: {
				party: params
			}
		})
		return response.party
	}

	/**
	 * Gets a party by shortcode
	 */
	async getByShortcode(shortcode: string): Promise<Party> {
		const response = await this.request<{ party: Party }>(`/parties/${shortcode}`, {
			cacheTTL: 60000 // Cache for 1 minute
		})
		return response.party
	}

	/**
	 * Updates a party
	 */
	async update(params: UpdatePartyParams): Promise<Party> {
		const { shortcode, ...updateParams } = params
		const response = await this.request<{ party: Party }>(`/parties/${shortcode}`, {
			method: 'PATCH',
			body: {
				party: updateParams
			}
		})
		return response.party
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
		const response = await this.request<{ party: Party }>(`/parties/${shortcode}/remix`, {
			method: 'POST'
		})
		return response.party
	}

	/**
	 * Lists all public parties (explore page)
	 */
	async list(params: { page?: number; per?: number } = {}): Promise<PaginatedResponse<Party>> {
		const response = await this.request<{
			results: Party[]
			meta?: {
				count?: number
				totalPages?: number
				perPage?: number
			}
		}>('/parties', {
			method: 'GET',
			query: params,
			cacheTTL: 30000 // Cache for 30 seconds
		})

		return {
			results: response.results,
			page: params.page || 1,
			total: response.meta?.count || 0,
			totalPages: response.meta?.totalPages || 1,
			perPage: response.meta?.perPage || 20
		}
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
	async updateJob(shortcode: string, jobId: string): Promise<Party> {
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
		partyId: string,
		skills: Array<{ id: string; slot: number }>
	): Promise<Party> {
		console.log('[updateJobSkills] Input skills array:', skills)

		// Convert skills array to Rails expected format
		const party: Record<string, string | null> = {}

		// Initialize all slots with null
		for (let i = 1; i <= 4; i++) {
			party[`skill${i}_id`] = null
		}

		// Set the provided skills
		skills.forEach(skill => {
			// Rails expects skill1_id, skill2_id, skill3_id, skill4_id
			party[`skill${skill.slot + 1}_id`] = skill.id
		})

		const requestBody = {
			party
		}

		console.log('[updateJobSkills] Sending to server:', {
			url: `/parties/${partyId}/job_skills`,
			body: requestBody
		})

		return this.request<Party>(`/parties/${partyId}/job_skills`, {
			method: 'PUT',
			body: requestBody
		})
	}

	/**
	 * Removes a job skill from a party
	 */
	async removeJobSkill(partyId: string, skillSlot: number): Promise<Party> {
		return this.request<Party>(`/parties/${partyId}/job_skills`, {
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
				Accept: 'image/png'
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
