/**
 * j/k stepping and position for the record panel, against the list's
 * ResultSet. Kept free of Svelte so it can be unit tested.
 */
import type { ResultItem, ResultSet } from '../resultSet.svelte'

export type StepDirection = 'next' | 'prev'

export interface PanelPosition {
	/** 1-based index within the loaded page, or null when the record isn't in it */
	index: number | null
	count: number
	page: number
	totalPages: number
	hasPrev: boolean
	hasNext: boolean
}

type ResultSetLike = Pick<
	ResultSet,
	'items' | 'page' | 'totalPages' | 'loadPage' | 'indexOf' | 'next' | 'prev'
>

export function panelPosition(resultSet: ResultSetLike, id: string): PanelPosition {
	const index = resultSet.indexOf(id)
	const count = resultSet.items.length
	const canLoad = resultSet.loadPage !== null
	const found = index !== -1
	return {
		index: found ? index + 1 : null,
		count,
		page: resultSet.page,
		totalPages: resultSet.totalPages,
		// A record outside the loaded page steps into it (to its first or last item)
		hasPrev: found ? index > 0 || (canLoad && resultSet.page > 1) : count > 0,
		hasNext: found
			? index < count - 1 || (canLoad && resultSet.page < resultSet.totalPages)
			: count > 0
	}
}

/**
 * The record after/before `id`, loading the neighbouring page at the edges.
 * Null at the ends of the results, or when a page load didn't move the list.
 */
export async function stepRecord(
	resultSet: ResultSetLike,
	id: string,
	direction: StepDirection
): Promise<ResultItem | null> {
	const index = resultSet.indexOf(id)
	if (index === -1) {
		// Not on the loaded page (list paged or filtered underneath): enter it
		return (direction === 'next' ? resultSet.items[0] : resultSet.items.at(-1)) ?? null
	}

	const atEdge = direction === 'next' ? index === resultSet.items.length - 1 : index === 0
	const pageBefore = resultSet.page
	const item = direction === 'next' ? await resultSet.next(id) : await resultSet.prev(id)
	if (!item) return null

	// At an edge next()/prev() load a page and return its first/last item. If
	// the load failed the list is still on the same page: that's no neighbour.
	if (atEdge && resultSet.page === pageBefore) return null
	return item
}
