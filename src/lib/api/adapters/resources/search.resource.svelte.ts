/**
 * Reactive Search Resource using Svelte 5 Runes and Runed
 *
 * Provides reactive state management for search operations with
 * automatic loading states, error handling, and debouncing.
 *
 * @module adapters/resources/search
 */

import { debounced } from 'runed'
import { SearchAdapter, searchAdapter, type SearchParams, type SearchResponse } from '../search.adapter'
import type { AdapterError } from '../types'

/**
 * Search resource configuration options
 */
export interface SearchResourceOptions {
	/** Search adapter instance to use */
	adapter?: SearchAdapter
	/** Debounce delay in milliseconds for search queries */
	debounceMs?: number
	/** Initial search parameters */
	initialParams?: SearchParams
}

/**
 * Search result state for a specific entity type
 */
interface SearchState {
	data?: SearchResponse
	loading: boolean
	error?: AdapterError
}

/**
 * Creates a reactive search resource for entity searching
 * This is a Svelte 5 universal reactive state (works in both components and modules)
 *
 * @example
 * ```svelte
 * <script>
 * import { createSearchResource } from '$lib/api/adapters/resources'
 *
 * const search = createSearchResource({
 *   debounceMs: 300,
 *   initialParams: {
 *     locale: 'en'
 *   }
 * })
 *
 * let query = $state('')
 *
 * // Reactive search on query change
 * $effect(() => {
 *   if (query) {
 *     search.searchWeapons({ query })
 *   }
 * })
 * </script>
 *
 * <input bind:value={query} placeholder="Search weapons..." />
 *
 * {#if search.weapons.loading}
 *   <p>Searching...</p>
 * {:else if search.weapons.error}
 *   <p>Error: {search.weapons.error.message}</p>
 * {:else if search.weapons.data}
 *   <ul>
 *     {#each search.weapons.data.results as result}
 *       <li>{result.name.en}</li>
 *     {/each}
 *   </ul>
 * {/if}
 * ```
 */
export class SearchResource {
	// Private adapter instance
	private adapter: SearchAdapter

	// Base parameters for all searches
	private baseParams: SearchParams

	// Debounce delay
	private debounceMs: number

	// Reactive state for each search type
	all = $state<SearchState>({ loading: false })
	weapons = $state<SearchState>({ loading: false })
	characters = $state<SearchState>({ loading: false })
	summons = $state<SearchState>({ loading: false })

	// Track active requests for cancellation
	private activeRequests = new Map<string, AbortController>()

	constructor(options: SearchResourceOptions = {}) {
		this.adapter = options.adapter || searchAdapter
		this.debounceMs = options.debounceMs || 300
		this.baseParams = options.initialParams || {}
	}

	/**
	 * Creates a debounced search function for a specific entity type
	 */
	private createDebouncedSearch(
		type: 'all' | 'weapons' | 'characters' | 'summons'
	) {
		const searchFn = async (params: SearchParams) => {
			// Cancel any existing request for this type
			this.cancelSearch(type)

			// Create new abort controller
			const controller = new AbortController()
			this.activeRequests.set(type, controller)

			// Update loading state
			this[type] = { ...this[type], loading: true, error: undefined }

			try {
				// Merge base params with provided params
				const mergedParams = { ...this.baseParams, ...params }

				// Call appropriate adapter method
				let response: SearchResponse
				switch (type) {
					case 'all':
						response = await this.adapter.searchAll(mergedParams)
						break
					case 'weapons':
						response = await this.adapter.searchWeapons(mergedParams)
						break
					case 'characters':
						response = await this.adapter.searchCharacters(mergedParams)
						break
					case 'summons':
						response = await this.adapter.searchSummons(mergedParams)
						break
				}

				// Update state with results
				this[type] = { data: response, loading: false }
			} catch (error: any) {
				// Don't update state if request was cancelled
				if (error.code !== 'CANCELLED') {
					this[type] = {
						...this[type],
						loading: false,
						error: error as AdapterError
					}
				}
			} finally {
				this.activeRequests.delete(type)
			}
		}

		// Return debounced version
		return debounced(searchFn, this.debounceMs)
	}

	// Create debounced search methods
	searchAll = this.createDebouncedSearch('all')
	searchWeapons = this.createDebouncedSearch('weapons')
	searchCharacters = this.createDebouncedSearch('characters')
	searchSummons = this.createDebouncedSearch('summons')

	/**
	 * Cancels an active search request
	 */
	cancelSearch(type: 'all' | 'weapons' | 'characters' | 'summons') {
		const controller = this.activeRequests.get(type)
		if (controller) {
			controller.abort()
			this.activeRequests.delete(type)
		}
	}

	/**
	 * Cancels all active search requests
	 */
	cancelAll() {
		this.activeRequests.forEach(controller => controller.abort())
		this.activeRequests.clear()
	}

	/**
	 * Clears results for a specific search type
	 */
	clear(type: 'all' | 'weapons' | 'characters' | 'summons') {
		this.cancelSearch(type)
		this[type] = { loading: false }
	}

	/**
	 * Clears all search results
	 */
	clearAll() {
		this.cancelAll()
		this.all = { loading: false }
		this.weapons = { loading: false }
		this.characters = { loading: false }
		this.summons = { loading: false }
	}

	/**
	 * Clears the adapter's cache
	 */
	clearCache() {
		this.adapter.clearSearchCache()
	}

	/**
	 * Updates base parameters for all searches
	 */
	updateBaseParams(params: SearchParams) {
		this.baseParams = { ...this.baseParams, ...params }
	}
}

/**
 * Factory function for creating search resources
 * Provides a more functional API if preferred over class instantiation
 */
export function createSearchResource(options?: SearchResourceOptions): SearchResource {
	return new SearchResource(options)
}