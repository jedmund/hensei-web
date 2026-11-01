/**
 * Shared contract between a database list (DataTable, GBF-139) and the
 * record side panel (GBF-140).
 *
 * The list owns a ResultSet and keeps `items`, `page` and `totalPages` in
 * sync with what it is showing (current filters and sort applied). The
 * panel reads it to step to the next/previous record with j/k, crossing
 * page boundaries through `loadPage`.
 *
 * Provide it with `setResultSet()` in the list's page/layout component and
 * read it with `getResultSet()` in the panel.
 */
import { getContext, setContext } from 'svelte'

export interface ResultItem {
	/** Stable identifier used in `?open=` (granblueId for catalogue items) */
	id: string
	/** Full-page URL for the record (unlocalized; callers localize) */
	href: string
	/** Display name, for the panel header before the record loads */
	title?: string | undefined
}

export class ResultSet {
	items = $state<ResultItem[]>([])
	page = $state(1)
	totalPages = $state(1)

	/**
	 * Set by the list. Loads `page` with the current filters/sort and updates
	 * `items` and `page` before resolving. Null for single-page (static) lists.
	 */
	loadPage: ((page: number) => Promise<void>) | null = null

	indexOf(id: string): number {
		return this.items.findIndex((item) => item.id === id)
	}

	/** The record after `id`, loading the next page if needed. Null at the end. */
	async next(id: string): Promise<ResultItem | null> {
		const index = this.indexOf(id)
		if (index === -1) return null
		const following = this.items[index + 1]
		if (following) return following
		if (this.loadPage && this.page < this.totalPages) {
			await this.loadPage(this.page + 1)
			return this.items[0] ?? null
		}
		return null
	}

	/** The record before `id`, loading the previous page if needed. Null at the start. */
	async prev(id: string): Promise<ResultItem | null> {
		const index = this.indexOf(id)
		if (index === -1) return null
		const preceding = this.items[index - 1]
		if (preceding) return preceding
		if (this.loadPage && this.page > 1) {
			await this.loadPage(this.page - 1)
			return this.items.at(-1) ?? null
		}
		return null
	}
}

const KEY = Symbol('database-result-set')

export function setResultSet(resultSet: ResultSet): ResultSet {
	return setContext(KEY, resultSet)
}

export function getResultSet(): ResultSet | undefined {
	return getContext<ResultSet | undefined>(KEY)
}
