/**
 * SSR Utilities for TanStack Query
 *
 * Provides utilities for integrating server-side data fetching with TanStack Query.
 * These utilities support the initialData pattern for pages that use +page.server.ts
 * load functions.
 *
 * @module query/ssr
 */

import type { QueryClient } from '@tanstack/svelte-query'

/**
 * Options for creating a query with initial data from SSR
 */
export interface InitialDataOptions<TData> {
	/**
	 * The data fetched on the server to use as initial data.
	 * TanStack Query accepts TData | undefined but NOT null.
	 */
	initialData?: TData

	/**
	 * Optional timestamp when the data was fetched on the server.
	 * Defaults to Date.now(), which tells TanStack Query the data is fresh
	 * and prevents an immediate background refetch.
	 */
	initialDataUpdatedAt?: number
}

/**
 * Creates query options with initial data from server-side rendering.
 *
 * Use this helper when you have data fetched in a +page.server.ts load function
 * and want to use it as initial data for a TanStack Query.
 *
 * Note: This helper strips `null` from the input since TanStack Query's
 * initialData only accepts `TData | undefined`, not `null`.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { createQuery } from '@tanstack/svelte-query'
 *   import { partyQueries } from '$lib/api/queries/party.queries'
 *   import { withInitialData } from '$lib/query/ssr'
 *   import type { PageData } from './$types'
 *
 *   let { data } = $props<{ data: PageData }>()
 *
 *   // Use server-fetched party as initial data
 *   const party = createQuery(() => ({
 *     ...partyQueries.byShortcode(data.party?.shortcode ?? ''),
 *     ...withInitialData(data.party)
 *   }))
 * </script>
 * ```
 *
 * @param initialData - The data fetched on the server (null is converted to undefined)
 * @param updatedAt - Optional timestamp when data was fetched (defaults to Date.now())
 * @returns Query options object with initialData and initialDataUpdatedAt
 */
export function withInitialData<TData>(
	initialData: TData | undefined | null,
	updatedAt?: number
): InitialDataOptions<NonNullable<TData>> {
	return {
		initialData: (initialData ?? undefined) as NonNullable<TData> | undefined,
		initialDataUpdatedAt: updatedAt ?? Date.now()
	}
}

/**
 * Prefetches a query on the server and returns the data.
 *
 * Use this in +page.ts load functions when you want to prefetch data
 * into the QueryClient cache. This is the recommended approach for
 * pages that don't use +page.server.ts.
 *
 * Note: This will NOT work with +page.server.ts load functions.
 * Use withInitialData() instead for server-only load functions.
 *
 * @example
 * ```typescript
 * // +page.ts
 * import type { PageLoad } from './$types'
 * import { prefetchQuery } from '$lib/query/ssr'
 * import { partyQueries } from '$lib/api/queries/party.queries'
 *
 * export const load: PageLoad = async ({ parent, params }) => {
 *   const { queryClient } = await parent()
 *
 *   await prefetchQuery(queryClient, partyQueries.byShortcode(params.id))
 *
 *   // No need to return data - it's in the cache
 * }
 * ```
 *
 * @param queryClient - The QueryClient instance from parent layout
 * @param options - Query options from a query factory
 */
export async function prefetchQuery<TData>(
	queryClient: QueryClient,
	options: {
		queryKey: readonly unknown[]
		queryFn: () => Promise<TData>
		staleTime?: number
		gcTime?: number
	}
): Promise<void> {
	await queryClient.prefetchQuery({
		queryKey: options.queryKey,
		queryFn: options.queryFn,
		staleTime: options.staleTime,
		gcTime: options.gcTime
	})
}

/**
 * Prefetches an infinite query on the server.
 *
 * Use this in +page.ts load functions when you want to prefetch
 * paginated data into the QueryClient cache.
 *
 * @example
 * ```typescript
 * // +page.ts
 * import type { PageLoad } from './$types'
 * import { prefetchInfiniteQuery } from '$lib/query/ssr'
 * import { partyQueries } from '$lib/api/queries/party.queries'
 *
 * export const load: PageLoad = async ({ parent }) => {
 *   const { queryClient } = await parent()
 *
 *   await prefetchInfiniteQuery(queryClient, partyQueries.list())
 * }
 * ```
 *
 * @param queryClient - The QueryClient instance from parent layout
 * @param options - Infinite query options from a query factory
 */
export async function prefetchInfiniteQuery<TData>(
	queryClient: QueryClient,
	options: {
		queryKey: readonly unknown[]
		queryFn: (context: { pageParam: number }) => Promise<TData>
		initialPageParam: number
		staleTime?: number
		gcTime?: number
	}
): Promise<void> {
	await queryClient.prefetchInfiniteQuery({
		queryKey: options.queryKey,
		queryFn: options.queryFn,
		initialPageParam: options.initialPageParam,
		staleTime: options.staleTime,
		gcTime: options.gcTime
	})
}

/**
 * Sets query data directly in the cache.
 *
 * Use this when you have data from a server load function and want
 * to populate the QueryClient cache directly. This is useful when
 * migrating from server-only load functions to TanStack Query.
 *
 * @example
 * ```typescript
 * // In a component or effect
 * import { useQueryClient } from '@tanstack/svelte-query'
 * import { setQueryData } from '$lib/query/ssr'
 * import { partyKeys } from '$lib/api/queries/party.queries'
 *
 * const queryClient = useQueryClient()
 *
 * // Populate cache with server data
 * setQueryData(queryClient, partyKeys.detail(shortcode), serverParty)
 * ```
 *
 * @param queryClient - The QueryClient instance
 * @param queryKey - The query key to set data for
 * @param data - The data to set in the cache
 */
export function setQueryData<TData>(
	queryClient: QueryClient,
	queryKey: readonly unknown[],
	data: TData
): void {
	queryClient.setQueryData(queryKey, data)
}
