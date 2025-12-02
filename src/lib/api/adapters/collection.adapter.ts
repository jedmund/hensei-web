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
	CollectionFilters,
	CollectionResponse
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
	 * Lists the current user's collection characters with optional filters
	 */
	async listCharacters(
		params: CollectionListParams = {}
	): Promise<PaginatedResponse<CollectionCharacter>> {
		const response = await this.request<CollectionCharacterListResponse>('/collection/characters', {
			method: 'GET',
			query: params
		})

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
	 * Adds multiple characters to the collection
	 * Makes parallel requests for each character
	 */
	async addCharacters(inputs: CollectionCharacterInput[]): Promise<CollectionCharacter[]> {
		const results = await Promise.all(inputs.map((input) => this.addCharacter(input)))
		return results
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
	 * Gets the IDs of all characters in the current user's collection
	 * Useful for filtering out already-owned characters in the add modal
	 */
	async getCollectedCharacterIds(): Promise<string[]> {
		// Fetch all pages to get complete list
		const allIds: string[] = []
		let page = 1
		let hasMore = true

		while (hasMore) {
			const response = await this.listCharacters({ page, limit: 100 })
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
	 * Lists the current user's collection weapons with optional filters
	 */
	async listWeapons(params: CollectionListParams = {}): Promise<PaginatedResponse<CollectionWeapon>> {
		const response = await this.request<{
			weapons: CollectionWeapon[]
			meta: { count: number; totalPages: number; perPage: number; currentPage: number }
		}>('/collection/weapons', {
			method: 'GET',
			query: params
		})

		return {
			results: response.weapons,
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

	// ============================================
	// Collection Summons
	// ============================================

	/**
	 * Lists the current user's collection summons with optional filters
	 */
	async listSummons(params: CollectionListParams = {}): Promise<PaginatedResponse<CollectionSummon>> {
		const response = await this.request<{
			summons: CollectionSummon[]
			meta: { count: number; totalPages: number; perPage: number; currentPage: number }
		}>('/collection/summons', {
			method: 'GET',
			query: params
		})

		return {
			results: response.summons,
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
	// Public Collection (viewing other users)
	// ============================================

	/**
	 * Gets a user's public collection (respects privacy settings)
	 * @param userId - The user's ID
	 * @param type - Optional type filter: 'characters', 'weapons', 'summons', 'job_accessories'
	 */
	async getPublicCollection(
		userId: string,
		type?: 'characters' | 'weapons' | 'summons' | 'job_accessories'
	): Promise<CollectionResponse> {
		return this.request<CollectionResponse>(`/users/${userId}/collection`, {
			method: 'GET',
			query: type ? { type } : undefined
		})
	}

	/**
	 * Gets a user's public character collection
	 */
	async getPublicCharacters(userId: string): Promise<CollectionCharacter[]> {
		const response = await this.getPublicCollection(userId, 'characters')
		return response.characters || []
	}

	/**
	 * Gets a user's public weapon collection
	 */
	async getPublicWeapons(userId: string): Promise<CollectionWeapon[]> {
		const response = await this.getPublicCollection(userId, 'weapons')
		return response.weapons || []
	}

	/**
	 * Gets a user's public summon collection
	 */
	async getPublicSummons(userId: string): Promise<CollectionSummon[]> {
		const response = await this.getPublicCollection(userId, 'summons')
		return response.summons || []
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
