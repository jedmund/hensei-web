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

	const routeId = route.id ?? ''
	const isCollection = routeId.startsWith('/(app)/[username]/(profile)/collection')
	const isTeamsRoot = routeId === '/(app)/[username]/(profile)'

	// Collection routes: light user fetch with checkCollection so the response
	// includes `collectionAccessible`. The (profile) layout still loads cleanly
	// regardless — the collection sub-route reads the flag and renders an
	// inline "this collection is private" message when false, so the user
	// can keep navigating other tabs from the header.
	if (isCollection) {
		try {
			const user = await userAdapter.getInfo(username, { fetch, checkCollection: true })
			return { user, isOwner, isAuthenticated }
		} catch (e: unknown) {
			const err = e as Record<string, unknown>
			throw error(
				(typeof err?.status === 'number' ? err.status : undefined) || 502,
				(typeof err?.message === 'string' ? err.message : undefined) || 'Failed to load profile'
			)
		}
	}

	// Teams root needs user + parties (SSR seed) + optional filter handling.
	if (isTeamsRoot) {
		depends('app:profile')
		const pageParam = url.searchParams.get('page')
		const page = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1

		try {
			if (urlHasExploreFilters(url.searchParams)) {
				const { filterItems, apiParams } = await urlParamsToExploreFilterParams(url.searchParams, {
					fetch
				})

				const [profileResult, filteredResult] = await Promise.all([
					userAdapter.getProfile(username, page, { fetch }),
					partyAdapter.listUserParties({ username, page, filters: apiParams }, { fetch })
				])

				return {
					user: profileResult.user,
					items: filteredResult.results.map((p) => parseParty(p)),
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
			return {
				user,
				items: items.map((p) => parseParty(p)),
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

	// Favorites + playlists: light user fetch, no parties. `getInfo` without
	// `checkCollection` skips the collection privacy gate so these tabs remain
	// viewable for users whose collection is private.
	try {
		const user = await userAdapter.getInfo(username, { fetch })
		return { user, isOwner, isAuthenticated }
	} catch (e: unknown) {
		const err = e as Record<string, unknown>
		throw error(
			(typeof err?.status === 'number' ? err.status : undefined) || 502,
			(typeof err?.message === 'string' ? err.message : undefined) || 'Failed to load profile'
		)
	}
}
