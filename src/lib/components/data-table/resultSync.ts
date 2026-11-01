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

/** Row id for catalogue items: the granblueId (weapons, summons, jobs, characters) */
export function catalogueRowId(row: { granblueId: string }): string {
	return row.granblueId
}

/**
 * Characters: style-swap variants share their base character's granblueId,
 * so they get their own id (the record panel's convention; `recordPath`
 * turns it into the style page's URL).
 */
export function characterRowId(row: { granblueId: string; styleSwap?: boolean | null }): string {
	return row.styleSwap ? `${row.granblueId}-style` : row.granblueId
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
				const loaded = await loadPage(page)
				// Update synchronously before resolving: ResultSet.next/prev read items right after
				resultSet.items = toResultItems(loaded.rows, accessors)
				resultSet.page = loaded.page
				resultSet.totalPages = loaded.totalPages
			}
		: null
}
