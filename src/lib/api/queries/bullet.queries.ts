/**
 * Bullet Query Options Factory
 *
 * Provides type-safe, reusable query configurations for bullet operations.
 *
 * @module api/queries/bullet
 */

import { queryOptions } from '@tanstack/svelte-query'
import { bulletAdapter } from '$lib/api/adapters/bullet.adapter'

/** Query key factory for bullets */
export const bulletKeys = {
	all: ['bullets'] as const,
	byId: (id: string) => ['bullets', id] as const
}

export const bulletQueries = {
	/** Single bullet by Granblue ID (or uuid); rejects with a 404 when there's none */
	byId: (id: string) =>
		queryOptions({
			queryKey: bulletKeys.byId(id),
			queryFn: () => bulletAdapter.getBulletById(id),
			enabled: !!id,
			staleTime: 1000 * 60 * 60,
			gcTime: 1000 * 60 * 60 * 24
		})
}
