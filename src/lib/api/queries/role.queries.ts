/**
 * Role Query Options Factory
 *
 * Provides query configurations for fetching roles.
 *
 * @module api/queries/role
 */

import { queryOptions } from '@tanstack/svelte-query'
import { roleAdapter } from '$lib/api/adapters/role.adapter'
import { substitutionAdapter } from '$lib/api/adapters/substitution.adapter'

export const roleQueries = {
	all: () =>
		queryOptions({
			queryKey: ['roles', 'all'] as const,
			queryFn: () => roleAdapter.listRoles(),
			staleTime: 1000 * 60 * 5
		}),
	bySlotType: (slotType: string) =>
		queryOptions({
			queryKey: ['roles', slotType] as const,
			// Kept on substitutionAdapter for backward compatibility with the
			// substitutions sidebar, which already imports it.
			queryFn: () => substitutionAdapter.fetchRoles(slotType),
			enabled: !!slotType,
			staleTime: 1000 * 60 * 30,
			gcTime: 1000 * 60 * 60
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
	bySlotType: (slotType: string) => ['roles', slotType] as const,
	detail: (id: string) => ['roles', 'detail', id] as const
}
