/**
 * User Query Options Factory
 *
 * Provides type-safe, reusable query configurations for user operations
 * using TanStack Query v6 patterns.
 *
 * @module api/queries/user
 */

import { queryOptions, infiniteQueryOptions } from '@tanstack/svelte-query'
import { userAdapter, type UserInfo, type UserProfile } from '$lib/api/adapters/user.adapter'
import type { Party } from '$lib/types/api/party'

/**
 * Standard page result format for user parties infinite queries
 */
export interface UserPartiesPageResult {
	results: Party[]
	page: number
	totalPages: number
	total: number
	perPage: number
}

/**
 * Standard page result format for favorites infinite queries
 */
export interface FavoritesPageResult {
	items: Party[]
	page: number
	totalPages: number
	total: number
	perPage: number
}

/**
 * User query options factory
 *
 * Provides query configurations for all user-related operations.
 * These can be used with `createQuery`, `createInfiniteQuery`, or for prefetching.
 *
 * @example
 * ```typescript
 * import { createQuery, createInfiniteQuery } from '@tanstack/svelte-query'
 * import { userQueries } from '$lib/api/queries/user.queries'
 *
 * // Current user
 * const currentUser = createQuery(() => userQueries.me())
 *
 * // User profile with parties
 * const profile = createQuery(() => userQueries.profile(username))
 *
 * // User's parties with infinite scroll
 * const parties = createInfiniteQuery(() => userQueries.parties(username))
 * ```
 */
export const userQueries = {
	/**
	 * Current user query options
	 *
	 * @returns Query options for fetching the current authenticated user
	 */
	me: () =>
		queryOptions({
			queryKey: ['user', 'me'] as const,
			queryFn: () => userAdapter.getCurrentUser(),
			staleTime: 1000 * 60 * 5, // 5 minutes
			gcTime: 1000 * 60 * 30 // 30 minutes
		}),

	/**
	 * User info query options
	 *
	 * @param username - Username to fetch info for
	 * @returns Query options for fetching user info
	 */
	info: (username: string) =>
		queryOptions({
			queryKey: ['user', username, 'info'] as const,
			queryFn: () => userAdapter.getInfo(username),
			enabled: !!username,
			staleTime: 1000 * 60 * 5, // 5 minutes
			gcTime: 1000 * 60 * 30 // 30 minutes
		}),

	/**
	 * User profile query options (includes first page of parties)
	 *
	 * @param username - Username to fetch profile for
	 * @returns Query options for fetching user profile
	 */
	profile: (username: string) =>
		queryOptions({
			queryKey: ['user', username, 'profile'] as const,
			queryFn: () => userAdapter.getProfile(username),
			enabled: !!username,
			staleTime: 1000 * 60 * 2, // 2 minutes - profile data changes
			gcTime: 1000 * 60 * 15 // 15 minutes
		}),

	/**
	 * User parties infinite query options
	 *
	 * @param username - Username to fetch parties for
	 * @returns Infinite query options for fetching user's parties
	 */
	parties: (username: string) =>
		infiniteQueryOptions({
			queryKey: ['user', username, 'parties'] as const,
			queryFn: async ({ pageParam }): Promise<UserPartiesPageResult> => {
				const response = await userAdapter.getProfileParties(username, pageParam)
				return {
					results: response.results,
					page: response.page,
					totalPages: response.totalPages,
					total: response.total,
					perPage: response.perPage
				}
			},
			initialPageParam: 1,
			getNextPageParam: (lastPage) => {
				if (lastPage.page < lastPage.totalPages) {
					return lastPage.page + 1
				}
				return undefined
			},
			enabled: !!username,
			staleTime: 1000 * 60 * 2, // 2 minutes
			gcTime: 1000 * 60 * 15 // 15 minutes
		}),

	/**
	 * User favorites infinite query options
	 *
	 * @returns Infinite query options for fetching user's favorite parties
	 */
	favorites: () =>
		infiniteQueryOptions({
			queryKey: ['user', 'favorites'] as const,
			queryFn: async ({ pageParam }): Promise<FavoritesPageResult> => {
				const response = await userAdapter.getFavorites({ page: pageParam })
				return {
					items: response.items,
					page: response.page,
					totalPages: response.totalPages,
					total: response.total,
					perPage: response.perPage
				}
			},
			initialPageParam: 1,
			getNextPageParam: (lastPage) => {
				if (lastPage.page < lastPage.totalPages) {
					return lastPage.page + 1
				}
				return undefined
			},
			staleTime: 1000 * 60 * 2, // 2 minutes
			gcTime: 1000 * 60 * 15 // 15 minutes
		}),

	/**
	 * Username availability check query options
	 *
	 * @param username - Username to check availability for
	 * @returns Query options for checking username availability
	 */
	checkUsername: (username: string) =>
		queryOptions({
			queryKey: ['user', 'check', 'username', username] as const,
			queryFn: () => userAdapter.checkUsernameAvailability(username),
			enabled: !!username && username.length >= 3,
			staleTime: 1000 * 30, // 30 seconds - availability can change
			gcTime: 1000 * 60 * 5 // 5 minutes
		}),

	/**
	 * Email availability check query options
	 *
	 * @param email - Email to check availability for
	 * @returns Query options for checking email availability
	 */
	checkEmail: (email: string) =>
		queryOptions({
			queryKey: ['user', 'check', 'email', email] as const,
			queryFn: () => userAdapter.checkEmailAvailability(email),
			enabled: !!email && email.includes('@'),
			staleTime: 1000 * 30, // 30 seconds - availability can change
			gcTime: 1000 * 60 * 5 // 5 minutes
		})
}

/**
 * Query key helpers for cache invalidation
 *
 * @example
 * ```typescript
 * import { useQueryClient } from '@tanstack/svelte-query'
 * import { userKeys } from '$lib/api/queries/user.queries'
 *
 * const queryClient = useQueryClient()
 *
 * // Invalidate current user
 * queryClient.invalidateQueries({ queryKey: userKeys.me() })
 *
 * // Invalidate a user's profile
 * queryClient.invalidateQueries({ queryKey: userKeys.profile('username') })
 * ```
 */
export const userKeys = {
	all: ['user'] as const,
	me: () => [...userKeys.all, 'me'] as const,
	info: (username: string) => [...userKeys.all, username, 'info'] as const,
	profile: (username: string) => [...userKeys.all, username, 'profile'] as const,
	parties: (username: string) => [...userKeys.all, username, 'parties'] as const,
	favorites: () => [...userKeys.all, 'favorites'] as const,
	checkUsername: (username: string) => [...userKeys.all, 'check', 'username', username] as const,
	checkEmail: (email: string) => [...userKeys.all, 'check', 'email', email] as const
}
