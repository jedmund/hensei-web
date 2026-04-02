import { queryOptions } from '@tanstack/svelte-query'
import { userRaidElementAdapter } from '$lib/api/adapters/userRaidElement.adapter'

export const userRaidElementQueries = {
	mine: () =>
		queryOptions({
			queryKey: ['userRaidElements', 'mine'] as const,
			queryFn: () => userRaidElementAdapter.getMyRaidElements()
		}),

	forUser: (username: string) =>
		queryOptions({
			queryKey: ['userRaidElements', 'user', username] as const,
			queryFn: () => userRaidElementAdapter.getUserRaidElements(username),
			enabled: !!username
		})
}
