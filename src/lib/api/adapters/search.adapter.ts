/**
 * Search Adapter for Entity Search Operations
 *
 * Handles all search-related API calls for weapons, characters, and summons.
 * Provides unified interface with automatic transformation and error handling.
 *
 * @module adapters/search
 */

import { BaseAdapter } from './base.adapter'
import type { AdapterOptions, SearchFilters } from './types'

/**
 * Search parameters for entity queries
 * Used across all search methods
 */
export interface SearchParams {
	/** Search query string */
	query?: string
	/** Locale for search results */
	locale?: 'en' | 'ja'
	/** Entity IDs to exclude from results */
	exclude?: string[]
	/** Page number for pagination */
	page?: number
	/** Number of results per page */
	per?: number
	/** Search filters */
	filters?: SearchFilters
}

/**
 * Individual search result item
 * Represents a weapon, character, or summon
 */
export interface SearchResult {
	/** Unique entity ID */
	id: string
	/** Granblue game ID */
	granblueId: string
	/** Localized names */
	name: {
		en?: string
		ja?: string
	}
	/** Element type (1-6 for different elements) */
	element?: number
	/** Rarity level */
	rarity?: number
	/** Weapon/Character proficiency */
	proficiency?: number
	/** Series ID for categorization */
	series?: number
	/** URL for entity image */
	imageUrl?: string
	/** Type of entity */
	searchableType: 'Weapon' | 'Character' | 'Summon'
}

/**
 * Search API response structure
 * Contains results and pagination metadata
 */
export interface SearchResponse {
	/** Array of search results */
	results: SearchResult[]
	/** Total number of results */
	total?: number
	/** Current page number */
	page?: number
	/** Total number of pages */
	totalPages?: number
	/** Pagination metadata */
	meta?: {
		count: number
		page: number
		perPage: number
		totalPages: number
	}
}

/**
 * Adapter for search-related API operations
 * Handles entity search with filtering, pagination, and caching
 *
 * @example
 * ```typescript
 * const searchAdapter = new SearchAdapter()
 *
 * // Search for fire weapons
 * const weapons = await searchAdapter.searchWeapons({
 *   query: 'sword',
 *   filters: { element: [1] }
 * })
 *
 * // Search across all entity types
 * const results = await searchAdapter.searchAll({
 *   query: 'bahamut',
 *   page: 1
 * })
 * ```
 */
export class SearchAdapter extends BaseAdapter {
	/**
	 * Creates a new SearchAdapter instance
	 *
	 * @param options - Adapter configuration options
	 */
	constructor(options?: AdapterOptions) {
		super({
			...options,
			// Search endpoints don't use credentials to avoid CORS issues
			// This is handled per-request instead
		})
	}

	/**
	 * Builds search request body from parameters
	 * Handles filtering logic and defaults
	 *
	 * @param params - Search parameters
	 * @param includeFilters - Which filters to include
	 * @returns Request body object
	 */
	private buildSearchBody(
		params: SearchParams,
		includeFilters: {
			element?: boolean
			rarity?: boolean
			proficiency1?: boolean
			proficiency2?: boolean
			series?: boolean
			extra?: boolean
			subaura?: boolean
		} = {}
	): any {
		const body: any = {
			locale: params.locale || 'en',
			page: params.page || 1
		}

		// Only include per if specified
		if (params.per) {
			body.per = params.per
		}

		// Only include query if provided and not empty
		if (params.query) {
			body.query = params.query
		}

		// Only include exclude if provided
		if (params.exclude?.length) {
			body.exclude = params.exclude
		}

		// Build filters based on what's allowed for this search type
		if (params.filters) {
			const filters: any = {}

			if (includeFilters.element && params.filters.element?.length) {
				filters.element = params.filters.element
			}
			if (includeFilters.rarity && params.filters.rarity?.length) {
				filters.rarity = params.filters.rarity
			}
			if (includeFilters.proficiency1 && params.filters.proficiency1?.length) {
				filters.proficiency1 = params.filters.proficiency1
			}
			if (includeFilters.proficiency2 && params.filters.proficiency2?.length) {
				filters.proficiency2 = params.filters.proficiency2
			}
			if (includeFilters.series && params.filters.series?.length) {
				filters.series = params.filters.series
			}
			if (includeFilters.extra && params.filters.extra !== undefined) {
				filters.extra = params.filters.extra
			}
			if (includeFilters.subaura && params.filters.subaura !== undefined) {
				filters.subaura = params.filters.subaura
			}

			if (Object.keys(filters).length > 0) {
				body.filters = filters
			}
		}

		return body
	}

	/**
	 * Searches across all entity types (weapons, characters, summons)
	 *
	 * @param params - Search parameters
	 * @returns Promise resolving to search results
	 */
	async searchAll(params: SearchParams = {}): Promise<SearchResponse> {
		const body = this.buildSearchBody(params, {
			element: true,
			rarity: true,
			proficiency1: true,
			proficiency2: true,
			series: true,
			extra: true,
			subaura: true
		})

		// Search endpoints don't use credentials to avoid CORS
		return this.request<SearchResponse>('/search/all', {
			method: 'POST',
			body: JSON.stringify(body),
			credentials: 'omit',
			// Cache search results for 5 minutes by default
			cache: params.query ? 300000 : 0 // Don't cache empty searches
		})
	}

	/**
	 * Searches for weapons with specific filters
	 *
	 * @param params - Search parameters
	 * @returns Promise resolving to weapon search results
	 */
	async searchWeapons(params: SearchParams = {}): Promise<SearchResponse> {
		const body = this.buildSearchBody(params, {
			element: true,
			rarity: true,
			proficiency1: true,
			extra: true
		})

		return this.request<SearchResponse>('/search/weapons', {
			method: 'POST',
			body: JSON.stringify(body),
			credentials: 'omit',
			cache: params.query ? 300000 : 0
		})
	}

	/**
	 * Searches for characters with specific filters
	 *
	 * @param params - Search parameters
	 * @returns Promise resolving to character search results
	 */
	async searchCharacters(params: SearchParams = {}): Promise<SearchResponse> {
		const body = this.buildSearchBody(params, {
			element: true,
			rarity: true,
			proficiency1: true,
			proficiency2: true
		})

		return this.request<SearchResponse>('/search/characters', {
			method: 'POST',
			body: JSON.stringify(body),
			credentials: 'omit',
			cache: params.query ? 300000 : 0
		})
	}

	/**
	 * Searches for summons with specific filters
	 *
	 * @param params - Search parameters
	 * @returns Promise resolving to summon search results
	 */
	async searchSummons(params: SearchParams = {}): Promise<SearchResponse> {
		const body = this.buildSearchBody(params, {
			element: true,
			rarity: true,
			subaura: true
		})

		return this.request<SearchResponse>('/search/summons', {
			method: 'POST',
			body: JSON.stringify(body),
			credentials: 'omit',
			cache: params.query ? 300000 : 0
		})
	}

	/**
	 * Clears all cached search results
	 * Useful when entity data has been updated
	 */
	clearSearchCache(): void {
		this.clearCache('search')
	}
}

/**
 * Default singleton instance for search operations
 * Use this for most search needs unless you need custom configuration
 */
export const searchAdapter = new SearchAdapter()