/**
 * Root Layout Load Function
 *
 * Creates a QueryClient instance for SSR support with TanStack Query v6.
 * The QueryClient is created here so it can be used for prefetching in
 * child page load functions.
 */

import type { LayoutLoad } from './$types'
import { browser } from '$app/environment'
import { QueryClient } from '@tanstack/svelte-query'
import { authStore } from '$lib/stores/auth.store'

export const load: LayoutLoad = async ({ data }) => {
	// Initialize auth store from server data BEFORE creating QueryClient
	if (browser && data.auth) {
		authStore.initFromServer(
			data.auth.accessToken,
			data.auth.user,
			data.auth.expiresAt
		)
	}

	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				enabled: browser,
				staleTime: 1000 * 60 * 5,
				gcTime: 1000 * 60 * 30,
				retry: 2,
				refetchOnWindowFocus: false
			}
		}
	})

	return {
		...data,
		queryClient
	}
}
