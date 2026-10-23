/**
 * Evoking Solomonis catalogue queries (route Evokers, Arcarum Blessings).
 * Both catalogues are static, so they're cached for a long time.
 *
 * @module api/queries/solomonis
 */

import { queryOptions } from '@tanstack/svelte-query'
import { solomonisAdapter } from '$lib/api/adapters/solomonis.adapter'

const CATALOGUE_STALE_TIME = 1000 * 60 * 60

export const solomonisKeys = {
	all: ['solomonis'] as const,
	routeEvokers: () => [...solomonisKeys.all, 'route_evokers'] as const,
	blessings: () => [...solomonisKeys.all, 'blessings'] as const
}

export const solomonisQueries = {
	routeEvokers: () =>
		queryOptions({
			queryKey: solomonisKeys.routeEvokers(),
			queryFn: () => solomonisAdapter.getRouteEvokers(),
			staleTime: CATALOGUE_STALE_TIME
		}),

	blessings: () =>
		queryOptions({
			queryKey: solomonisKeys.blessings(),
			queryFn: () => solomonisAdapter.getBlessings(),
			staleTime: CATALOGUE_STALE_TIME
		})
}
