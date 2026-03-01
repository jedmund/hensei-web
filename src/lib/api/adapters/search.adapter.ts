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
import { DEFAULT_ADAPTER_CONFIG } from './config'

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
	/** Sort by column name */
	sortBy?: string
	/** Sort order */
	sortOrder?: 'asc' | 'desc'
}

/**
 * Individual search result item from type-specific search endpoints
 * (searchWeapons, searchCharacters, searchSummons)
 * These return full entity data with camelCase field names (transformed by BaseAdapter)
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
	/** Proficiency - number for weapons, array for characters */
	proficiency?: number | number[]
	/** Series - object for weapons (WeaponSeriesRef), number array for characters */
	series?: { id: string; slug: string; name: { en: string; ja: string } } | number[]
	/** URL for entity image */
	imageUrl?: string
	/** Type of entity (lowercase for compatibility) */
	type?: 'weapon' | 'character' | 'summon'
	/** Type of entity */
	searchableType: 'Weapon' | 'Character' | 'Summon'
}

/**
 * Character series reference for unified search
 */
export interface UnifiedSearchSeriesRef {
	id: string
	slug: string
	name: { en: string; ja: string }
}

/**
 * Individual search result item from unified search endpoint (searchAll)
 * Uses PgSearch.multisearch which returns different field structure
 * Field names are camelCase after BaseAdapter transformation
 */
export interface UnifiedSearchResult {
	/** Unique entity ID (from searchable_id) */
	searchableId: string
	/** Type of entity */
	searchableType: 'Weapon' | 'Character' | 'Summon'
	/** Granblue game ID */
	granblueId: string
	/** English name */
	nameEn?: string
	/** Japanese name */
	nameJp?: string
	/** Element type (1-6 for different elements) */
	element?: number
	/** Season (characters only) */
	season?: number | null
	/** Series (characters only) */
	series?: UnifiedSearchSeriesRef[] | null
}

/**
 * Search API response structure for type-specific endpoints
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
 * Search API response structure for unified search endpoint
 */
export interface UnifiedSearchResponse {
	/** Array of search results */
	results: UnifiedSearchResult[]
}

/**
 * Random entity suggestion returned by the suggestions endpoint
 */
export interface EntitySuggestion {
	id: string
	granblueId: string
	name: { en?: string; ja?: string }
	element?: number
	type: 'character' | 'weapon' | 'summon'
}

/**
 * Response from the suggestions endpoint
 */
export interface SuggestionsResponse {
	suggestions: EntitySuggestion[]
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
			season?: boolean
			characterSeries?: boolean
			gachaAvailable?: boolean
			promotions?: boolean
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

		// Include sort parameters if provided
		if (params.sortBy) {
			body.sort = params.sortBy
		}
		if (params.sortOrder) {
			body.order = params.sortOrder
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
			if (includeFilters.season && params.filters.season?.length) {
				filters.season = params.filters.season
			}
			if (includeFilters.characterSeries && params.filters.characterSeries?.length) {
				// API expects 'series' field for character series filter
				filters.series = params.filters.characterSeries
			}
			if (includeFilters.gachaAvailable && params.filters.gachaAvailable !== undefined) {
				filters.gachaAvailable = params.filters.gachaAvailable
			}
			if (includeFilters.promotions && params.filters.promotions?.length) {
				filters.promotions = params.filters.promotions
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
	 * Uses PgSearch.multisearch which returns a different response structure
	 *
	 * @param params - Search parameters
	 * @returns Promise resolving to unified search results
	 */
	async searchAll(params: SearchParams = {}): Promise<UnifiedSearchResponse> {
		const body = this.buildSearchBody(params, {
			element: true,
			rarity: true,
			proficiency1: true,
			proficiency2: true,
			series: true,
			season: true,
			characterSeries: true,
			gachaAvailable: true,
			promotions: true,
			extra: true,
			subaura: true
		})

		// Search endpoints don't use credentials to avoid CORS
		// Rails expects params nested under 'search' key
		// Per-page is sent via X-Per-Page header
		return this.request<UnifiedSearchResponse>('/search', {
			method: 'POST',
			body: { search: body },
			credentials: 'omit',
			// Cache search results for 5 minutes by default
			cacheTTL: params.query ? 300000 : 0, // Don't cache empty searches
			headers: params.per ? { 'X-Per-Page': String(params.per) } : undefined
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
			series: true,
			promotions: true,
			extra: true
		})

		// Rails expects params nested under 'search' key
		// Per-page is sent via X-Per-Page header
		return this.request<SearchResponse>('/search/weapons', {
			method: 'POST',
			body: { search: body },
			credentials: 'omit',
			cacheTTL: params.query ? 300000 : 0,
			headers: params.per ? { 'X-Per-Page': String(params.per) } : undefined
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
			proficiency2: true,
			season: true,
			characterSeries: true,
			gachaAvailable: true
		})

		// Rails expects params nested under 'search' key
		// Per-page is sent via X-Per-Page header
		return this.request<SearchResponse>('/search/characters', {
			method: 'POST',
			body: { search: body },
			credentials: 'omit',
			cacheTTL: params.query ? 300000 : 0,
			headers: params.per ? { 'X-Per-Page': String(params.per) } : undefined
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
			promotions: true,
			subaura: true
		})

		// Rails expects params nested under 'search' key
		// Per-page is sent via X-Per-Page header
		return this.request<SearchResponse>('/search/summons', {
			method: 'POST',
			body: { search: body },
			credentials: 'omit',
			cacheTTL: params.query ? 300000 : 0,
			headers: params.per ? { 'X-Per-Page': String(params.per) } : undefined
		})
	}

	/**
	 * Searches for jobs with specific filters
	 *
	 * @param params - Search parameters with job-specific filters
	 * @returns Promise resolving to job search results
	 */
	async searchJobs(params: SearchParams = {}): Promise<SearchResponse> {
		const body: any = {
			locale: params.locale || 'en',
			page: params.page || 1
		}

		if (params.per) {
			body.per = params.per
		}

		if (params.query) {
			body.query = params.query
		}

		if (params.sortBy) {
			body.sort = params.sortBy
		}
		if (params.sortOrder) {
			body.order = params.sortOrder
		}

		// Build job-specific filters
		if (params.filters) {
			const filters: any = {}

			if (params.filters.row?.length) {
				filters.row = params.filters.row
			}
			if (params.filters.proficiency?.length) {
				filters.proficiency = params.filters.proficiency
			}
			if (params.filters.masterLevel !== undefined) {
				filters.masterLevel = params.filters.masterLevel
			}
			if (params.filters.ultimateMastery !== undefined) {
				filters.ultimateMastery = params.filters.ultimateMastery
			}
			if (params.filters.accessory !== undefined) {
				filters.accessory = params.filters.accessory
			}

			if (Object.keys(filters).length > 0) {
				body.filters = filters
			}
		}

		return this.request<SearchResponse>('/search/jobs', {
			method: 'POST',
			body: { search: body },
			credentials: 'omit',
			cacheTTL: params.query ? 300000 : 0,
			headers: params.per ? { 'X-Per-Page': String(params.per) } : undefined
		})
	}

	/**
	 * Fetches random entity suggestions (mix of characters, weapons, summons)
	 * Used for placeholder suggestions in the explore filter dropdown
	 *
	 * @param count - Number of random entities to return (default 12, max 30)
	 */
	async getRandomSuggestions(count: number = 12): Promise<SuggestionsResponse> {
		return this.request<SuggestionsResponse>(`/search/suggestions?count=${count}`, {
			method: 'GET',
			credentials: 'omit',
			cacheTTL: 60000
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
export const searchAdapter = new SearchAdapter(DEFAULT_ADAPTER_CONFIG)
