/**
 * Collection Adapter
 *
 * Handles all collection-related API operations including CRUD for
 * characters, weapons, summons, and job accessories in a user's collection.
 *
 * @module adapters/collection
 */

import { BaseAdapter } from './base.adapter'
import type { AdapterOptions, PaginatedResponse } from './types'
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
	CollectionFilters
} from '$lib/types/api/collection'

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
		const response = await this.request<CollectionCharacterListResponse>(
			`/users/${userId}/collection/characters`,
			{
				method: 'GET',
				query: params
			}
		)

		return {
			results: response.characters,
			page: response.meta.currentPage,
			total: response.meta.count,
			totalPages: response.meta.totalPages,
			perPage: response.meta.perPage
		}
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
			meta: { created: number; skipped: number; errors: any[] }
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
		const response = await this.request<{
			weapons?: CollectionWeapon[]
			collectionWeapons?: CollectionWeapon[]
			meta: { count: number; totalPages: number; perPage: number; currentPage: number }
		}>(`/users/${userId}/collection/weapons`, {
			method: 'GET',
			query: params
		})

		// Handle both 'weapons' and 'collectionWeapons' response keys
		// (backend currently returns 'collectionWeapons', should return 'weapons')
		const weapons = response.weapons ?? response.collectionWeapons ?? []

		return {
			results: weapons,
			page: response.meta.currentPage,
			total: response.meta.count,
			totalPages: response.meta.totalPages,
			perPage: response.meta.perPage
		}
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
			meta: { created: number; errors: any[] }
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
		const response = await this.request<{
			summons?: CollectionSummon[]
			collectionSummons?: CollectionSummon[]
			meta: { count: number; totalPages: number; perPage: number; currentPage: number }
		}>(`/users/${userId}/collection/summons`, {
			method: 'GET',
			query: params
		})

		// Handle both 'summons' and 'collectionSummons' response keys
		// (backend currently returns 'collectionSummons', should return 'summons')
		const summons = response.summons ?? response.collectionSummons ?? []

		return {
			results: summons,
			page: response.meta.currentPage,
			total: response.meta.count,
			totalPages: response.meta.totalPages,
			perPage: response.meta.perPage
		}
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
			meta: { created: number; errors: any[] }
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
