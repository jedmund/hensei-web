/**
 * Search Query Options Factory
 *
 * Provides type-safe, reusable query configurations for search operations
 * using TanStack Query v6 patterns.
 *
 * @module api/queries/search
 */

import { infiniteQueryOptions } from '@tanstack/svelte-query'
import {
	searchAdapter,
	type SearchParams
} from '$lib/api/adapters/search.adapter'

/**
 * Filter configuration for search queries
 */
export interface SearchFilters {
	element?: number[]
	rarity?: number[]
	proficiency?: number[]
	proficiency2?: number[]
	subaura?: boolean
	extra?: boolean
}

/**
 * Standard page result format for infinite queries
 */
export interface SearchPageResult {
	results: Array<{
		id: string
		granblueId: string
		name: { en?: string; ja?: string }
		element?: number
		rarity?: number
		proficiency?: number
		series?: number
		imageUrl?: string
		searchableType: 'Weapon' | 'Character' | 'Summon'
	}>
	page: number
	totalPages: number
}

/**
 * Builds search parameters from query string and filters
 */
function buildSearchParams(
	query: string,
	filters: SearchFilters | undefined,
	page: number,
	locale: 'en' | 'ja' = 'en'
): SearchParams {
	const params: SearchParams = {
		page,
		locale
	}

	// Only include query if not empty
	if (query && query.trim().length > 0) {
		params.query = query.trim()
	}

	// Build filters object with only defined values
	if (filters) {
		const apiFilters: NonNullable<SearchParams['filters']> = {}

		if (filters.element && filters.element.length > 0) {
			apiFilters.element = filters.element
		}
		if (filters.rarity && filters.rarity.length > 0) {
			apiFilters.rarity = filters.rarity
		}
		if (filters.proficiency && filters.proficiency.length > 0) {
			apiFilters.proficiency1 = filters.proficiency
		}
		if (filters.proficiency2 && filters.proficiency2.length > 0) {
			apiFilters.proficiency2 = filters.proficiency2
		}
		if (filters.subaura !== undefined) {
			apiFilters.subaura = filters.subaura
		}
		if (filters.extra !== undefined) {
			apiFilters.extra = filters.extra
		}

		// Only include filters if any were set
		if (Object.keys(apiFilters).length > 0) {
			params.filters = apiFilters
		}
	}

	return params
}

/**
 * Search query options factory
 *
 * Provides infinite query configurations for all search types.
 * These can be used with `createInfiniteQuery` or for prefetching.
 *
 * @example
 * ```typescript
 * import { createInfiniteQuery } from '@tanstack/svelte-query'
 * import { searchQueries } from '$lib/api/queries/search.queries'
 *
 * // In a component
 * let query = $state('')
 * let filters = $state({ element: [1, 2] })
 *
 * const weaponSearch = createInfiniteQuery(() =>
 *   searchQueries.weapons(query, filters)
 * )
 * ```
 */
export const searchQueries = {
	/**
	 * Weapon search infinite query options
	 *
	 * @param query - Search query string
	 * @param filters - Optional filter configuration
	 * @param locale - Locale for results (default: 'en')
	 * @returns Infinite query options for weapon search
	 */
	weapons: (query: string = '', filters?: SearchFilters, locale: 'en' | 'ja' = 'en') =>
		infiniteQueryOptions({
			queryKey: ['search', 'weapons', query, filters, locale] as const,
			queryFn: async ({ pageParam }): Promise<SearchPageResult> => {
				const params = buildSearchParams(query, filters, pageParam, locale)
				const response = await searchAdapter.searchWeapons(params)

				return {
					results: response.results,
					page: response.meta?.page ?? response.page ?? pageParam,
					totalPages: response.meta?.totalPages ?? response.totalPages ?? 1
				}
			},
			initialPageParam: 1,
			getNextPageParam: (lastPage) => {
				if (lastPage.page < lastPage.totalPages) {
					return lastPage.page + 1
				}
				return undefined
			},
			staleTime: 1000 * 60 * 5, // 5 minutes
			gcTime: 1000 * 60 * 30, // 30 minutes
		}),

	/**
	 * Character search infinite query options
	 *
	 * @param query - Search query string
	 * @param filters - Optional filter configuration
	 * @param locale - Locale for results (default: 'en')
	 * @returns Infinite query options for character search
	 */
	characters: (query: string = '', filters?: SearchFilters, locale: 'en' | 'ja' = 'en') =>
		infiniteQueryOptions({
			queryKey: ['search', 'characters', query, filters, locale] as const,
			queryFn: async ({ pageParam }): Promise<SearchPageResult> => {
				const params = buildSearchParams(query, filters, pageParam, locale)
				const response = await searchAdapter.searchCharacters(params)

				return {
					results: response.results,
					page: response.meta?.page ?? response.page ?? pageParam,
					totalPages: response.meta?.totalPages ?? response.totalPages ?? 1
				}
			},
			initialPageParam: 1,
			getNextPageParam: (lastPage) => {
				if (lastPage.page < lastPage.totalPages) {
					return lastPage.page + 1
				}
				return undefined
			},
			staleTime: 1000 * 60 * 5, // 5 minutes
			gcTime: 1000 * 60 * 30, // 30 minutes
		}),

	/**
	 * Summon search infinite query options
	 *
	 * @param query - Search query string
	 * @param filters - Optional filter configuration
	 * @param locale - Locale for results (default: 'en')
	 * @returns Infinite query options for summon search
	 */
	summons: (query: string = '', filters?: SearchFilters, locale: 'en' | 'ja' = 'en') =>
		infiniteQueryOptions({
			queryKey: ['search', 'summons', query, filters, locale] as const,
			queryFn: async ({ pageParam }): Promise<SearchPageResult> => {
				const params = buildSearchParams(query, filters, pageParam, locale)
				const response = await searchAdapter.searchSummons(params)

				return {
					results: response.results,
					page: response.meta?.page ?? response.page ?? pageParam,
					totalPages: response.meta?.totalPages ?? response.totalPages ?? 1
				}
			},
			initialPageParam: 1,
			getNextPageParam: (lastPage) => {
				if (lastPage.page < lastPage.totalPages) {
					return lastPage.page + 1
				}
				return undefined
			},
			staleTime: 1000 * 60 * 5, // 5 minutes
			gcTime: 1000 * 60 * 30, // 30 minutes
		})
}
