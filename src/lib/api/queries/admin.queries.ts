/**
 * Admin list query options, keyed by the normalized list params so the same
 * table state always hits the same cache entry.
 *
 * @module api/queries/admin
 */

import { keepPreviousData, queryOptions } from '@tanstack/svelte-query'
import { adminAdapter } from '$lib/api/adapters/admin.adapter'
import type { AdminListParams, AdminResource } from '$lib/types/api/admin'

export const adminKeys = {
	all: ['admin'] as const,
	resource: (resource: AdminResource) => [...adminKeys.all, resource] as const,
	lists: (resource: AdminResource) => [...adminKeys.resource(resource), 'list'] as const,
	list: (resource: AdminResource, params: AdminListParams) =>
		[...adminKeys.lists(resource), params] as const
}

export const adminQueries = {
	list: <T>(resource: AdminResource, params: AdminListParams) =>
		queryOptions({
			queryKey: adminKeys.list(resource, params),
			queryFn: () => adminAdapter.list<T>(resource, params),
			// Keep the current page on screen while the next one loads
			placeholderData: keepPreviousData,
			staleTime: 1000 * 30
		})
}
