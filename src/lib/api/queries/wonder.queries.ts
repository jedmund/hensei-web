/**
 * Wonder queries: the static catalogue and a user's collected Wonders.
 *
 * @module api/queries/wonder
 */

import { queryOptions } from '@tanstack/svelte-query'
import { wonderAdapter } from '$lib/api/adapters/wonder.adapter'

const CATALOGUE_STALE_TIME = 1000 * 60 * 60

export const wonderKeys = {
	all: ['wonders'] as const,
	catalogue: () => [...wonderKeys.all, 'catalogue'] as const,
	collectionBase: ['wonders', 'collection'] as const,
	collection: (userId: string) => [...wonderKeys.collectionBase, userId] as const
}

export const wonderQueries = {
	catalogue: () =>
		queryOptions({
			queryKey: wonderKeys.catalogue(),
			queryFn: () => wonderAdapter.getCatalogue(),
			staleTime: CATALOGUE_STALE_TIME
		}),

	collection: (userId: string) =>
		queryOptions({
			queryKey: wonderKeys.collection(userId),
			queryFn: () => wonderAdapter.listCollection(userId),
			enabled: !!userId
		})
}
