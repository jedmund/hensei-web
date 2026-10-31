/**
 * Home Query Options Factory
 *
 * @module api/queries/home
 */

import { queryOptions } from '@tanstack/svelte-query'
import { homeAdapter } from '$lib/api/adapters/home.adapter'
import { registerStickerCacheRoot } from '$lib/api/mutations/sticker.mutations'

export const homeKeys = {
	all: ['home'] as const,
	sections: () => [...homeKeys.all, 'sections'] as const
}

// Giving or taking back a sticker updates the teams in Home's sections too
registerStickerCacheRoot(homeKeys.all)

export const homeQueries = {
	sections: () =>
		queryOptions({
			queryKey: homeKeys.sections(),
			queryFn: () => homeAdapter.getHome(),
			staleTime: 1000 * 60
		})
}
