import type { LayoutLoad } from './$types'
import type { FilterItem } from '$lib/types/filter'
import { error } from '@sveltejs/kit'
import { userAdapter } from '$lib/api/adapters/user.adapter'
import { partyAdapter } from '$lib/api/adapters/party.adapter'
import { parseParty } from '$lib/api/schemas/party'
import {
	urlHasExploreFilters,
	urlParamsToExploreFilterParams
} from '$lib/utils/exploreFilterParams'

export const load: LayoutLoad = async ({ params, url, depends, parent, fetch, route }) => {
	const username = params.username
	const { account, isAuthenticated } = await parent()
	const isOwner = account?.username === username

	const isTeamsRoot = route.id === '/(app)/[username]/(profile)'

	// Every profile route gets `collectionAccessible` on the user payload so
	// the Collection tab can render its private/public state instantly without
	// a second round trip. Teams root additionally fetches parties for SSR via
	// `listUserParties` (run in parallel with the user fetch).
	try {
		if (isTeamsRoot) {
			depends('app:profile')
			const pageParam = url.searchParams.get('page')
			const page = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1

			const filterParse = urlHasExploreFilters(url.searchParams)
				? await urlParamsToExploreFilterParams(url.searchParams, { fetch })
				: null

			const [user, partiesResult] = await Promise.all([
				userAdapter.getInfo(username, { fetch, checkCollection: true }),
				partyAdapter.listUserParties(
					{ username, page, ...(filterParse?.apiParams ? { filters: filterParse.apiParams } : {}) },
					{ fetch }
				)
			])

			return {
				user,
				items: partiesResult.results.map((p) => parseParty(p)),
				page,
				total: partiesResult.total,
				totalPages: partiesResult.totalPages,
				perPage: partiesResult.perPage,
				isOwner,
				isAuthenticated,
				initialFilterItems: filterParse?.filterItems ?? ([] as FilterItem[])
			}
		}

		// Favorites / playlists / collection: just the user (with prefetched
		// `collectionAccessible`). Tab-specific data is loaded by each page;
		// `items`/`total`/etc. are stubbed so the layout return shape stays
		// uniform across routes (the teams page reads them, others ignore).
		const user = await userAdapter.getInfo(username, { fetch, checkCollection: true })
		return {
			user,
			items: [] as ReturnType<typeof parseParty>[],
			page: 1,
			total: 0,
			totalPages: 1,
			perPage: 20,
			isOwner,
			isAuthenticated,
			initialFilterItems: [] as FilterItem[]
		}
	} catch (e: unknown) {
		const err = e as Record<string, unknown>
		throw error(
			(typeof err?.status === 'number' ? err.status : undefined) || 502,
			(typeof err?.message === 'string' ? err.message : undefined) || 'Failed to load profile'
		)
	}
}
