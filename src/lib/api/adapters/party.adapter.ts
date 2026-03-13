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
import type { PartyShare } from '$lib/types/api/partyShare'
import type { PartyVisibility } from '$lib/types/visibility'

/**
 * Parameters for creating a new party
 */
export interface CreatePartyParams {
	name?: string | undefined
	description?: string | undefined
	visibility?: PartyVisibility | undefined
	jobId?: string | undefined
	raidId?: string | null | undefined
	guidebookId?: string | undefined
	extras?: Record<string, any> | undefined
}

/**
 * Parameters for updating a party
 */
export interface UpdatePartyParams extends CreatePartyParams {
	/** Party UUID (required for API update) */
	id: string
	/** Party shortcode (for cache invalidation) */
	shortcode: string
	// Battle settings
	fullAuto?: boolean
	autoGuard?: boolean
	autoSummon?: boolean
	chargeAttack?: boolean
	// Performance metrics (null to clear)
	clearTime?: number | null
	buttonCount?: number | null
	chainCount?: number | null
	summonCount?: number | null
	// Video (null to clear)
	videoUrl?: string | null
	// Raid (null to clear)
	raidId?: string | null
}

/**
 * Parameters for listing user parties
 */
export interface ListUserPartiesParams {
	username: string
	page?: number
	per?: number
	visibility?: PartyVisibility | 'all'
	raidId?: string
	characterId?: string
	weaponId?: string
	summonId?: string
}

/**
 * Filter parameters for the explore parties list
 */
export interface ExploreFilterParams {
	element?: number[]
	raid?: string
	recency?: number
	job?: string
	fullAuto?: number
	autoGuard?: number
	chargeAttack?: number
	hasVideo?: boolean
	charactersCount?: number
	weaponsCount?: number
	summonsCount?: number
	nameQuality?: boolean
	userQuality?: boolean
	original?: boolean
	includes?: string
	excludes?: string
	collectionFilter?: boolean
}

/**
 * Parameters for listing parties by raid
 */
export interface ListRaidPartiesParams {
	raidId: string
	page?: number
	per?: number
	element?: number
	fullAuto?: boolean
	autoGuard?: boolean
	chargeAttack?: boolean
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
	async getByShortcode(shortcode: string, options?: { headers?: Record<string, string> }): Promise<Party> {
		const response = await this.request<{ party: Party }>(`/parties/${shortcode}`, options)
		return response.party
	}

	/**
	 * Updates a party
	 * Note: API expects UUID for update, not shortcode
	 */
	async update(params: UpdatePartyParams): Promise<Party> {
		const { id, shortcode, ...updateParams } = params
		const response = await this.request<{ party: Party }>(`/parties/${id}`, {
			method: 'PATCH',
			body: {
				party: updateParams
			}
		})
		return response.party
	}

	/**
	 * Deletes a party
	 * @param id - The party's UUID (not shortcode - API requires UUID for delete)
	 */
	async delete(id: string): Promise<void> {
		return this.request<void>(`/parties/${id}`, {
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
	async list(
		params: { page?: number; per?: number } & Partial<ExploreFilterParams> = {}
	): Promise<PaginatedResponse<Party>> {
		const query: Record<string, unknown> = {}
		for (const [key, value] of Object.entries(params)) {
			if (value !== undefined && value !== null) {
				query[key] = value
			}
		}

		const response = await this.request<{
			results: Party[]
			meta?: {
				count?: number
				totalPages?: number
				perPage?: number
			}
		}>('/parties', {
			query
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
			query: queryParams
		})
	}

	/**
	 * Lists public parties for a specific raid
	 */
	async listRaidParties(params: ListRaidPartiesParams): Promise<PaginatedResponse<Party>> {
		const { raidId, element, fullAuto, autoGuard, chargeAttack, ...rest } = params

		// Build query with raid filter and convert booleans to API format
		const query: Record<string, unknown> = {
			...rest,
			raid: raidId
		}

		if (element !== undefined && element >= 0) query.element = element
		if (fullAuto !== undefined) query.full_auto = fullAuto ? 1 : 0
		if (autoGuard !== undefined) query.auto_guard = autoGuard ? 1 : 0
		if (chargeAttack !== undefined) query.charge_attack = chargeAttack ? 1 : 0

		const response = await this.request<{
			results: Party[]
			meta?: {
				count?: number
				totalPages?: number
				perPage?: number
			}
		}>('/parties', {
			query
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
				party: {
					job_id: jobId
				}
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
		if (import.meta.env.DEV) console.log('[updateJobSkills] Input skills array:', skills)

		// Convert skills array to Rails expected format
		// Rails has skill0_id (main, locked), skill1_id, skill2_id, skill3_id
		// Only include skills that have actual IDs - don't send null values
		// as Rails will try to validate them
		const party: Record<string, string> = {}

		// Set the provided skills - slot number maps directly to skill{N}_id
		skills.forEach((skill) => {
			// Only set editable slots (1, 2, 3) and only if skill has an ID
			if (skill.slot >= 1 && skill.slot <= 3 && skill.id) {
				party[`skill${skill.slot}_id`] = skill.id
			}
		})

		const requestBody = {
			party
		}

		if (import.meta.env.DEV) console.log('[updateJobSkills] Sending to server:', {
			url: `/parties/${partyId}/job_skills`,
			body: requestBody
		})

		return this.request<Party>(`/parties/${partyId}/job_skills`, {
			method: 'PUT',
			body: requestBody
		})
	}

	/**
	 * Updates the accessory for a party
	 */
	async updateAccessory(partyId: string, accessoryId: string): Promise<Party> {
		return this.request<Party>(`/parties/${partyId}/accessory`, {
			method: 'PUT',
			body: { accessory_id: accessoryId }
		})
	}

	/**
	 * Removes a job skill from a party
	 */
	async removeJobSkill(partyId: string, skillSlot: number): Promise<Party> {
		return this.request<Party>(`/parties/${partyId}/job_skills`, {
			method: 'DELETE',
			body: {
				party: {
					skill_position: skillSlot
				}
			}
		})
	}

	/**
	 * Updates a guidebook on a party
	 * @param partyId - The party's UUID
	 * @param guidebookId - The guidebook's UUID
	 * @param position - Guidebook position (1, 2, or 3)
	 */
	async updateGuidebook(partyId: string, guidebookId: string, position: number): Promise<Party> {
		const response = await this.request<{ party: Party }>(`/parties/${partyId}`, {
			method: 'PATCH',
			body: {
				party: {
					[`guidebook${position}_id`]: guidebookId
				}
			}
		})
		return response.party
	}

	/**
	 * Removes a guidebook from a party
	 * @param partyId - The party's UUID
	 * @param position - Guidebook position (1, 2, or 3)
	 */
	async removeGuidebook(partyId: string, position: number): Promise<Party> {
		const response = await this.request<{ party: Party }>(`/parties/${partyId}`, {
			method: 'PATCH',
			body: {
				party: {
					[`guidebook${position}_id`]: null
				}
			}
		})
		return response.party
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
	 * Share a party with the current user's crew
	 * @param partyId - The party's UUID
	 */
	async shareWithCrew(partyId: string): Promise<PartyShare> {
		const response = await this.request<{ share: PartyShare }>(`/parties/${partyId}/shares`, {
			method: 'POST'
		})
		return response.share
	}

	/**
	 * Remove a party share
	 * @param partyId - The party's UUID
	 * @param shareId - The share's UUID to remove
	 */
	async removeShare(partyId: string, shareId: string): Promise<void> {
		await this.request(`/parties/${partyId}/shares/${shareId}`, {
			method: 'DELETE'
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
export const partyAdapter = new PartyAdapter(DEFAULT_ADAPTER_CONFIG)
