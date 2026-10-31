/**
 * User Raid Element Query Options Factory
 *
 * @module api/queries/userRaidElement
 */

import { queryOptions } from '@tanstack/svelte-query'
import { userRaidElementAdapter } from '$lib/api/adapters/userRaidElement.adapter'

export const userRaidElementQueries = {
	/** A user's elements by username (yourself or a crewmate) */
	forUser: (username: string) =>
		queryOptions({
			queryKey: userRaidElementKeys.forUser(username),
			queryFn: () => userRaidElementAdapter.getForUser(username),
			enabled: !!username,
			staleTime: 1000 * 60 * 5 // 5 minutes
		})
}

/**
 * Query key helpers for cache invalidation
 */
export const userRaidElementKeys = {
	all: ['userRaidElements'] as const,
	forUser: (username: string) =>
		[...userRaidElementKeys.all, 'user', username.toLowerCase()] as const
}
