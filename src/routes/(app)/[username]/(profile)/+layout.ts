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

export const load: LayoutLoad = async ({ params, url, depends, parent, fetch }) => {
	depends('app:profile')
	const username = params.username
	const pageParam = url.searchParams.get('page')
	const page = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1
	const { account, isAuthenticated } = await parent()
	const isOwner = account?.username === username

	try {
		if (urlHasExploreFilters(url.searchParams)) {
			const { filterItems, apiParams } = await urlParamsToExploreFilterParams(url.searchParams, {
				fetch
			})

			const [profileResult, filteredResult] = await Promise.all([
				userAdapter.getProfile(username, page, { fetch }),
				partyAdapter.listUserParties({ username, page, filters: apiParams }, { fetch })
			])

			const parties = filteredResult.results.map((p) => parseParty(p))
			return {
				user: profileResult.user,
				items: parties,
				page,
				total: filteredResult.total,
				totalPages: filteredResult.totalPages,
				perPage: filteredResult.perPage,
				isOwner,
				isAuthenticated,
				initialFilterItems: filterItems
			}
		}

		const { user, items, total, totalPages, perPage } = await userAdapter.getProfile(
			username,
			page,
			{ fetch }
		)
		const parties = items.map((p) => parseParty(p))
		return {
			user,
			items: parties,
			page,
			total,
			totalPages,
			perPage,
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
