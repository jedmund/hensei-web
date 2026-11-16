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
import { authStore } from '$lib/stores/auth.store.svelte'
import { stickerQueries } from '$lib/api/queries/sticker.queries'
import { stickerAdapter } from '$lib/api/adapters/sticker.adapter'

export const load: LayoutLoad = async ({ data, fetch }) => {
	// Initialize auth store from server data BEFORE creating QueryClient
	// Defensive check: data might be null/undefined during error scenarios
	if (browser && data?.auth) {
		authStore.initFromServer(data.auth.accessToken, data.auth.user, data.auth.expiresAt)
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

	// Sticker labels show on team cards and the team page; with the catalogue
	// already cached they render in SSR instead of after hydration. SvelteKit's
	// fetch replays the server response during hydration, so the browser
	// doesn't request it again. A failure only means stickers load after
	// hydration as before. Neither the query nor the adapter retries it: when
	// the server's request fails, hydration makes it again, and the page's
	// links do full page loads until hydration finishes.
	await queryClient.prefetchQuery({
		...stickerQueries.active(),
		queryFn: () => stickerAdapter.listStickers({}, { fetch, retries: 0 }),
		retry: false
	})

	return {
		...data,
		queryClient
	}
}
