import type { PageLoad } from './$types'
import type { FilterItem } from '$lib/types/filter'
import { error } from '@sveltejs/kit'
import { partyAdapter } from '$lib/api/adapters/party.adapter'
import {
	urlHasExploreFilters,
	urlParamsToExploreFilterParams
} from '$lib/utils/exploreFilterParams'

export const load: PageLoad = async ({ url, depends, fetch }) => {
	depends('app:parties:list')

	const pageParam = url.searchParams.get('page')
	const page = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1

	let initialFilterItems: FilterItem[] = []
	let initialCollectionFilter = false
	const listParams: Record<string, unknown> = { page }

	if (urlHasExploreFilters(url.searchParams)) {
		const { filterItems, apiParams, collectionFilter } = await urlParamsToExploreFilterParams(
			url.searchParams,
			{ fetch }
		)
		initialFilterItems = filterItems
		initialCollectionFilter = collectionFilter
		Object.assign(listParams, apiParams)
		if (collectionFilter) listParams.collectionFilter = true
	}

	try {
		const response = await partyAdapter.list(listParams, { fetch })

		return {
			items: response.results,
			page,
			total: response.total,
			totalPages: response.totalPages,
			perPage: response.perPage || 20,
			initialFilterItems,
			initialCollectionFilter
		}
	} catch (e: unknown) {
		const err = e as Record<string, unknown>
		const status = typeof err?.status === 'number' ? err.status : undefined
		const message = typeof err?.message === 'string' ? err.message : undefined
		console.error('[explore/+page.ts] Failed to load teams:', {
			error: e,
			message,
			status,
			stack: err?.stack,
			details: err?.details
		})
		const errorMessage = `Failed to load teams: ${message || 'Unknown error'}. Status: ${status || 'unknown'}`
		throw error(status || 502, errorMessage)
	}
}
