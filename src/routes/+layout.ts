/**
 * Root Layout Load Function
 *
 * Creates a QueryClient instance for SSR support with TanStack Query v6.
 * The QueryClient is created here so it can be used for prefetching in
 * child page load functions.
 *
 * @module routes/+layout
 */

import type { LayoutLoad } from './$types'
import { browser } from '$app/environment'
import { QueryClient } from '@tanstack/svelte-query'

export const load: LayoutLoad = async () => {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				// Disable queries on server - they will be prefetched explicitly
				enabled: browser,
				// Cache data for 5 minutes before considering it stale
				staleTime: 1000 * 60 * 5,
				// Keep unused data in cache for 30 minutes
				gcTime: 1000 * 60 * 30,
				// Retry failed requests twice
				retry: 2,
				// Don't refetch on window focus by default
				refetchOnWindowFocus: false
			}
		}
	})

	return { queryClient }
}
