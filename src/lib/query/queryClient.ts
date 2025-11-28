import { QueryClient } from '@tanstack/svelte-query'
import { browser } from '$app/environment'

export function createQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				enabled: browser,
				staleTime: 1000 * 60 * 5, // 5 minutes
				gcTime: 1000 * 60 * 30, // 30 minutes
				retry: 2,
				refetchOnWindowFocus: false
			}
		}
	})
}
