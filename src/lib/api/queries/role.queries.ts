/**
 * Role Query Options Factory
 *
 * Provides query configurations for fetching roles by slot type.
 *
 * @module api/queries/role
 */

import { queryOptions } from '@tanstack/svelte-query'
import { substitutionAdapter } from '$lib/api/adapters/substitution.adapter'

export const roleQueries = {
	bySlotType: (slotType: string) =>
		queryOptions({
			queryKey: ['roles', slotType] as const,
			queryFn: () => substitutionAdapter.fetchRoles(slotType),
			enabled: !!slotType,
			staleTime: 1000 * 60 * 30, // 30 minutes - roles rarely change
			gcTime: 1000 * 60 * 60
		})
}

export const roleKeys = {
	all: ['roles'] as const,
	bySlotType: (slotType: string) => ['roles', slotType] as const
}
