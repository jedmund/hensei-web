import type { LayoutLoad } from './$types'
import type { FilterItem } from '$lib/types/filter'
import type { SupportSummon } from '$lib/types/api/supportSummon'
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

	// Every profile route gets `collectionAccessible` + `supportSummonsAccessible`
	// on the user payload so child tabs / the expandable drawer can render their
	// private/public state instantly without a second round trip. The support
	// summons themselves are fetched in parallel; we swallow a 403 there so the
	// header stays mounted when the user has them set to private.
	try {
		const userPromise = userAdapter.getInfo(username, {
			fetch,
			checkCollection: true,
			checkSupportSummons: true
		})
		const supportSummonsPromise = fetchSupportSummons(username, { fetch })

		if (isTeamsRoot) {
			depends('app:profile')
			const pageParam = url.searchParams.get('page')
			const page = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1

			const filterParse = urlHasExploreFilters(url.searchParams)
				? await urlParamsToExploreFilterParams(url.searchParams, { fetch })
				: null

			const [user, supportSummons, partiesResult] = await Promise.all([
				userPromise,
				supportSummonsPromise,
				partyAdapter.listUserParties(
					{ username, page, ...(filterParse?.apiParams ? { filters: filterParse.apiParams } : {}) },
					{ fetch }
				)
			])

			return {
				user,
				supportSummons,
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

		// Favorites / playlists / collection: just the user + support summons.
		// `items`/`total`/etc. are stubbed so the layout return shape stays
		// uniform across routes (the teams page reads them, others ignore).
		const [user, supportSummons] = await Promise.all([userPromise, supportSummonsPromise])
		return {
			user,
			supportSummons,
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

// Private support-summon profiles return 403 — the header still renders, the
// drawer just won't have any cells. Treat any failure as "no summons" so a
// flaky summons fetch can't take the whole profile down.
async function fetchSupportSummons(
	username: string,
	options: { fetch: typeof fetch }
): Promise<SupportSummon[]> {
	try {
		return await userAdapter.getSupportSummons(username, options)
	} catch {
		return []
	}
}
