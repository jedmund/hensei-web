/**
 * Keeps the shared ResultSet (see features/database/resultSet.svelte.ts) in
 * step with what a DataTable is showing, so the record panel can step
 * through the same rows in the same order.
 */
import type { ResultItem, ResultSet } from '$lib/features/database/resultSet.svelte'
import type { DataTableSource } from './types'

export interface RowAccessors<T> {
	rowId: (row: T) => string
	/** Unlocalized full-page URL */
	rowHref: (row: T) => string
	rowTitle?: ((row: T) => string | null | undefined) | undefined
}

export function toResultItems<T>(rows: T[], accessors: RowAccessors<T>): ResultItem[] {
	return rows.map((row) => ({
		id: accessors.rowId(row),
		href: accessors.rowHref(row),
		title: accessors.rowTitle?.(row) || undefined
	}))
}

export function syncResultSet<T>(
	resultSet: ResultSet,
	source: Pick<DataTableSource<T>, 'rows' | 'page' | 'totalPages' | 'loadPage'>,
	accessors: RowAccessors<T>
): void {
	resultSet.items = toResultItems(source.rows, accessors)
	resultSet.page = source.page
	resultSet.totalPages = source.totalPages

	const loadPage = source.loadPage
	resultSet.loadPage = loadPage
		? async (page: number) => {
				const rows = await loadPage(page)
				// Update before resolving: ResultSet.next/prev read items right after
				resultSet.items = toResultItems(rows, accessors)
				resultSet.page = page
			}
		: null
}
