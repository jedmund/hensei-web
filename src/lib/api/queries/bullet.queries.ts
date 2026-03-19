/**
 * Bullet Query Options Factory
 *
 * Provides type-safe, reusable query configurations for bullet operations.
 *
 * @module api/queries/bullet
 */

import { queryOptions } from '@tanstack/svelte-query'
import { entityAdapter } from '$lib/api/adapters/entity.adapter'
import type { Bullet } from '$lib/types/api/entities'

/** Query key factory for bullets */
export const bulletKeys = {
	all: ['bullets'] as const,
	byType: (type: number) => ['bullets', 'type', type] as const,
	byId: (id: string) => ['bullets', id] as const
}

export const bulletQueries = {
	/** All bullets list */
	list: (bulletType?: number) =>
		queryOptions({
			queryKey: bulletType !== undefined ? bulletKeys.byType(bulletType) : bulletKeys.all,
			queryFn: () => entityAdapter.getBullets(bulletType),
			staleTime: 1000 * 60 * 60,
			gcTime: 1000 * 60 * 60 * 24
		}),

	/** Single bullet by ID */
	byId: (id: string) =>
		queryOptions({
			queryKey: bulletKeys.byId(id),
			queryFn: async () => {
				const bullets = await entityAdapter.getBullets()
				return bullets.find((b: Bullet) => b.id === id || b.granblueId === id) ?? null
			},
			enabled: !!id,
			staleTime: 1000 * 60 * 60,
			gcTime: 1000 * 60 * 60 * 24
		})
}
