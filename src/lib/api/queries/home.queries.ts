/**
 * Home Query Options Factory
 *
 * @module api/queries/home
 */

import { queryOptions } from '@tanstack/svelte-query'
import { homeAdapter } from '$lib/api/adapters/home.adapter'

export const homeKeys = {
	all: ['home'] as const,
	sections: (sticker?: string) => [...homeKeys.all, sticker ?? null] as const
}

export const homeQueries = {
	sections: (sticker?: string) =>
		queryOptions({
			queryKey: homeKeys.sections(sticker),
			queryFn: () => homeAdapter.getHome(sticker ? { sticker } : {}),
			staleTime: 1000 * 60
		})
}
