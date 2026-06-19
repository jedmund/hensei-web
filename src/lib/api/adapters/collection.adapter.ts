/**
 * Collection Adapter
 *
 * Handles all collection-related API operations including CRUD for
 * characters, weapons, summons, and job accessories in a user's collection.
 *
 * @module adapters/collection
 */

import { BaseAdapter } from './base.adapter'
import type { AdapterOptions, ApiPaginationMeta, PaginatedResponse } from './types'
import { DEFAULT_ADAPTER_CONFIG } from './config'
import type {
	CollectionCharacter,
	CollectionWeapon,
	CollectionSummon,
	CollectionJobAccessory,
	CollectionCharacterInput,
	CollectionWeaponInput,
	CollectionSummonInput,
	CollectionJobAccessoryInput,
	CollectionFilters,
	CollectionCounts
} from '$lib/types/api/collection'
import type { Character, Weapon, Summon } from '$lib/types/api/entities'

/**
 * Parameters for listing collection items with pagination
 */
export interface CollectionListParams extends CollectionFilters {
	page?: number
	limit?: number
}

/**
 * Response structure for paginated collection list
 */
export interface CollectionCharacterListResponse {
	characters: CollectionCharacter[]
	meta: {
		count: number
		totalPages: number
		perPage: number
		currentPage: number
	}
}

/**
 * Collection adapter for managing user collections
 */
export class CollectionAdapter extends BaseAdapter {
	constructor(options?: AdapterOptions) {
		super(options)
	}

	// ============================================
	// Collection Counts
	// ============================================

	/**
	 * Gets the total counts for all collection entity types
	 */
	async getCounts(userId: string): Promise<CollectionCounts> {
		return this.request<CollectionCounts>(`/users/${userId}/collection/counts`, {
			method: 'GET'
		})
	}

	// ============================================
	// Collection Characters
	// ============================================

	/**
	 * Lists a user's collection characters with optional filters
	 * Works for any user - privacy is enforced server-side
	 */
	async listCharacters(
		userId: string,
		params: CollectionListParams = {}
	): Promise<PaginatedResponse<CollectionCharacter>> {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const response = await this.request<any>(`/users/${userId}/collection/characters`, {
			method: 'GET',
			query: params
		})

		const items = response.characters ?? []
		const results: CollectionCharacter[] = params.unowned
			? items.map((char: Character) => ({
					id: char.id,
					uncapLevel: 0,
					transcendenceStep: 0,
					perpetuity: false,
					ring1: null,
					ring2: null,
					ring3: null,
					ring4: null,
					earring: null,
					awakening: null,
					character: char,
					createdAt: '',
					updatedAt: ''
				}))
			: items

		return this.toPaginatedResponse(results, response.meta as ApiPaginationMeta, params.page || 1)
	}

	/**
	 * Gets a single collection character by ID
	 */
	async getCharacter(id: string): Promise<CollectionCharacter> {
		return this.request<CollectionCharacter>(`/collection/characters/${id}`, {
			method: 'GET'
		})
	}

	/**
	 * Adds a character to the collection
	 */
	async addCharacter(input: CollectionCharacterInput): Promise<CollectionCharacter> {
		return this.request<CollectionCharacter>('/collection/characters', {
			method: 'POST',
			body: {
				collectionCharacter: input
			}
		})
	}

	/**
	 * Adds multiple characters to the collection in a single batch request
	 */
	async addCharacters(inputs: CollectionCharacterInput[]): Promise<CollectionCharacter[]> {
		if (inputs.length === 0) return []

		const response = await this.request<{
			characters: CollectionCharacter[]
			meta: { created: number; skipped: number; errors: unknown[] }
		}>('/collection/characters/batch', {
			method: 'POST',
			body: {
				collectionCharacters: inputs
			}
		})

		return response.characters
	}

	/**
	 * Updates a collection character
	 */
	async updateCharacter(
		id: string,
		input: Partial<CollectionCharacterInput>
	): Promise<CollectionCharacter> {
		return this.request<CollectionCharacter>(`/collection/characters/${id}`, {
			method: 'PATCH',
			body: {
				collectionCharacter: input
			}
		})
	}

	/**
	 * Removes a character from the collection
	 */
	async removeCharacter(id: string): Promise<void> {
		return this.request<void>(`/collection/characters/${id}`, {
			method: 'DELETE'
		})
	}

	/**
	 * Removes multiple characters from the collection in a single batch request
	 */
	async removeCharactersBatch(ids: string[]): Promise<{ deleted: number }> {
		if (ids.length === 0) return { deleted: 0 }

		const response = await this.request<{
			meta: { deleted: number }
		}>('/collection/characters/batch_destroy', {
			method: 'DELETE',
			body: { ids }
		})

		return response.meta
	}

	/**
	 * Gets the IDs of all characters in a user's collection
	 * Useful for filtering out already-owned characters in the add modal
	 */
	async getCollectedCharacterIds(userId: string): Promise<string[]> {
		// Fetch all pages to get complete list
		const allIds: string[] = []
		let page = 1
		let hasMore = true

		while (hasMore) {
			const response = await this.listCharacters(userId, { page, limit: 100 })
			allIds.push(...response.results.map((c) => c.character.id))
			hasMore = page < response.totalPages
			page++
		}

		return allIds
	}

	// ============================================
	// Collection Weapons
	// ============================================

	/**
	 * Lists a user's collection weapons with optional filters
	 * Works for any user - privacy is enforced server-side
	 */
	async listWeapons(
		userId: string,
		params: CollectionListParams = {}
	): Promise<PaginatedResponse<CollectionWeapon>> {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const response = await this.request<any>(`/users/${userId}/collection/weapons`, {
			method: 'GET',
			query: params
		})

		// Handle both 'weapons' and 'collectionWeapons' response keys
		const rawWeapons = response.weapons ?? response.collectionWeapons ?? []

		const results: CollectionWeapon[] = params.unowned
			? rawWeapons.map((wpn: Weapon) => ({
					id: wpn.id,
					uncapLevel: 0,
					transcendenceStep: 0,
					awakening: null,
					weapon: wpn,
					createdAt: '',
					updatedAt: ''
				}))
			: rawWeapons

		return this.toPaginatedResponse(results, response.meta as ApiPaginationMeta, params.page || 1)
	}

	/**
	 * Adds a weapon to the collection
	 */
	async addWeapon(input: CollectionWeaponInput): Promise<CollectionWeapon> {
		return this.request<CollectionWeapon>('/collection/weapons', {
			method: 'POST',
			body: {
				collectionWeapon: input
			}
		})
	}

	/**
	 * Adds multiple weapons to the collection in a single batch request
	 * Handles quantity expansion - each quantity > 1 creates multiple entries
	 */
	async addWeapons(
		inputs: Array<CollectionWeaponInput & { quantity?: number }>
	): Promise<CollectionWeapon[]> {
		// Expand inputs based on quantity
		const expanded = inputs.flatMap((input) => {
			const count = input.quantity ?? 1
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { quantity, ...rest } = input
			return Array.from({ length: count }, () => ({ ...rest })) as CollectionWeaponInput[]
		})

		if (expanded.length === 0) return []

		const response = await this.request<{
			weapons: CollectionWeapon[]
			meta: { created: number; errors: unknown[] }
		}>('/collection/weapons/batch', {
			method: 'POST',
			body: {
				collectionWeapons: expanded
			}
		})

		return response.weapons
	}

	/**
	 * Updates a collection weapon
	 */
	async updateWeapon(id: string, input: Partial<CollectionWeaponInput>): Promise<CollectionWeapon> {
		return this.request<CollectionWeapon>(`/collection/weapons/${id}`, {
			method: 'PATCH',
			body: {
				collectionWeapon: input
			}
		})
	}

	/**
	 * Removes a weapon from the collection
	 */
	async removeWeapon(id: string): Promise<void> {
		return this.request<void>(`/collection/weapons/${id}`, {
			method: 'DELETE'
		})
	}

	/**
	 * Gets the IDs of all weapons in a user's collection
	 */
	async getCollectedWeaponIds(userId: string): Promise<string[]> {
		const allIds: string[] = []
		let page = 1
		let hasMore = true

		while (hasMore) {
			const response = await this.listWeapons(userId, { page, limit: 100 })
			allIds.push(...response.results.map((w) => w.weapon.id))
			hasMore = page < response.totalPages
			page++
		}

		return allIds
	}

	/**
	 * Removes multiple weapons from the collection in a single batch request
	 */
	async removeWeaponsBatch(ids: string[]): Promise<{ deleted: number }> {
		if (ids.length === 0) return { deleted: 0 }

		const response = await this.request<{
			meta: { deleted: number }
		}>('/collection/weapons/batch_destroy', {
			method: 'DELETE',
			body: { ids }
		})

		return response.meta
	}

	// ============================================
	// Collection Summons
	// ============================================

	/**
	 * Lists a user's collection summons with optional filters
	 * Works for any user - privacy is enforced server-side
	 */
	async listSummons(
		userId: string,
		params: CollectionListParams = {}
	): Promise<PaginatedResponse<CollectionSummon>> {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const response = await this.request<any>(`/users/${userId}/collection/summons`, {
			method: 'GET',
			query: params
		})

		// Handle both 'summons' and 'collectionSummons' response keys
		const rawSummons = response.summons ?? response.collectionSummons ?? []

		const results: CollectionSummon[] = params.unowned
			? rawSummons.map((smn: Summon) => ({
					id: smn.id,
					uncapLevel: 0,
					transcendenceStep: 0,
					summon: smn,
					createdAt: '',
					updatedAt: ''
				}))
			: rawSummons

		return this.toPaginatedResponse(results, response.meta as ApiPaginationMeta, params.page || 1)
	}

	/**
	 * Adds a summon to the collection
	 */
	async addSummon(input: CollectionSummonInput): Promise<CollectionSummon> {
		return this.request<CollectionSummon>('/collection/summons', {
			method: 'POST',
			body: {
				collectionSummon: input
			}
		})
	}

	/**
	 * Adds multiple summons to the collection in a single batch request
	 * Handles quantity expansion - each quantity > 1 creates multiple entries
	 */
	async addSummons(
		inputs: Array<CollectionSummonInput & { quantity?: number }>
	): Promise<CollectionSummon[]> {
		// Expand inputs based on quantity
		const expanded = inputs.flatMap((input) => {
			const count = input.quantity ?? 1
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { quantity, ...rest } = input
			return Array.from({ length: count }, () => ({ ...rest })) as CollectionSummonInput[]
		})

		if (expanded.length === 0) return []

		const response = await this.request<{
			summons: CollectionSummon[]
			meta: { created: number; errors: unknown[] }
		}>('/collection/summons/batch', {
			method: 'POST',
			body: {
				collectionSummons: expanded
			}
		})

		return response.summons
	}

	/**
	 * Updates a collection summon
	 */
	async updateSummon(id: string, input: Partial<CollectionSummonInput>): Promise<CollectionSummon> {
		return this.request<CollectionSummon>(`/collection/summons/${id}`, {
			method: 'PATCH',
			body: {
				collectionSummon: input
			}
		})
	}

	/**
	 * Removes a summon from the collection
	 */
	async removeSummon(id: string): Promise<void> {
		return this.request<void>(`/collection/summons/${id}`, {
			method: 'DELETE'
		})
	}

	/**
	 * Gets the IDs of all summons in a user's collection
	 */
	async getCollectedSummonIds(userId: string): Promise<string[]> {
		const allIds: string[] = []
		let page = 1
		let hasMore = true

		while (hasMore) {
			const response = await this.listSummons(userId, { page, limit: 100 })
			allIds.push(...response.results.map((s) => s.summon.id))
			hasMore = page < response.totalPages
			page++
		}

		return allIds
	}

	/**
	 * Removes multiple summons from the collection in a single batch request
	 */
	async removeSummonsBatch(ids: string[]): Promise<{ deleted: number }> {
		if (ids.length === 0) return { deleted: 0 }

		const response = await this.request<{
			meta: { deleted: number }
		}>('/collection/summons/batch_destroy', {
			method: 'DELETE',
			body: { ids }
		})

		return response.meta
	}

	// ============================================
	// Collection Job Accessories
	// ============================================

	/**
	 * Lists the current user's collection job accessories
	 */
	async listJobAccessories(): Promise<CollectionJobAccessory[]> {
		const response = await this.request<{ jobAccessories: CollectionJobAccessory[] }>(
			'/collection/job_accessories',
			{
				method: 'GET'
			}
		)
		return response.jobAccessories
	}

	/**
	 * Adds a job accessory to the collection
	 */
	async addJobAccessory(input: CollectionJobAccessoryInput): Promise<CollectionJobAccessory> {
		return this.request<CollectionJobAccessory>('/collection/job_accessories', {
			method: 'POST',
			body: {
				collectionJobAccessory: input
			}
		})
	}

	/**
	 * Removes a job accessory from the collection
	 */
	async removeJobAccessory(id: string): Promise<void> {
		return this.request<void>(`/collection/job_accessories/${id}`, {
			method: 'DELETE'
		})
	}

	// ============================================
	// Cache Management
	// ============================================

	/**
	 * Clears collection-related cache
	 */
	clearCollectionCache() {
		this.clearCache('/collection')
		this.clearCache('/users')
	}
}

/**
 * Default collection adapter instance
 */
export const collectionAdapter = new CollectionAdapter(DEFAULT_ADAPTER_CONFIG)
