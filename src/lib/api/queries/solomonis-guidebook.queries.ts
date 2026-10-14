/**
 * Solomonis Guidebook Query Options
 *
 * The guide effect catalogue is static (about a hundred rows), so it's fetched
 * once and filtered on the client.
 *
 * @module api/queries/solomonis-guidebook
 */

import { queryOptions } from '@tanstack/svelte-query'
import { solomonisGuidebookAdapter } from '$lib/api/adapters/solomonis-guidebook.adapter'

export const solomonisGuidebookKeys = {
	all: ['solomonis', 'guide_effects'] as const
}

export const solomonisGuidebookQueries = {
	guideEffects: () =>
		queryOptions({
			queryKey: solomonisGuidebookKeys.all,
			queryFn: () => solomonisGuidebookAdapter.listGuideEffects(),
			staleTime: 1000 * 60 * 60,
			gcTime: 1000 * 60 * 60 * 24
		})
}
