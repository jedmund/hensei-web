/**
 * Role Query Options Factory
 *
 * Provides query configurations for fetching the character role catalog.
 *
 * @module api/queries/role
 */

import { queryOptions } from '@tanstack/svelte-query'
import { roleAdapter } from '$lib/api/adapters/role.adapter'

export const roleQueries = {
	all: () =>
		queryOptions({
			queryKey: ['roles', 'all'] as const,
			queryFn: () => roleAdapter.listRoles(),
			staleTime: 1000 * 60 * 5
		}),
	byId: (id: string | undefined) =>
		queryOptions({
			queryKey: ['roles', 'detail', id] as const,
			queryFn: () => roleAdapter.getRole(id as string),
			enabled: !!id,
			staleTime: 1000 * 60 * 5
		})
}

export const roleKeys = {
	all: ['roles'] as const,
	allList: ['roles', 'all'] as const,
	detail: (id: string) => ['roles', 'detail', id] as const
}
