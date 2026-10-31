/**
 * Reactive wrapper around the URL codec: reads table state from the current
 * page URL and writes changes back with `goto`, leaving other params (`view`,
 * `open`, …) untouched.
 */
import { goto } from '$app/navigation'
import { page } from '$app/state'
import {
	countActiveFilters,
	parseTableUrl,
	updateTableState,
	writeTableUrl,
	type FilterValue,
	type SortSpec,
	type TableUrlConfig,
	type TableUrlState
} from './urlState'

export interface TableUrlUpdateOptions {
	/** Replace the history entry instead of pushing one (default true) */
	replace?: boolean
}

export class TableUrl {
	readonly config: TableUrlConfig

	readonly state: TableUrlState = $derived.by(() =>
		parseTableUrl(page.url.searchParams, this.config)
	)

	readonly activeFilterCount = $derived(countActiveFilters(this.state))

	constructor(config: TableUrlConfig = {}) {
		this.config = config
	}

	update(patch: Partial<TableUrlState>, options: TableUrlUpdateOptions = {}): Promise<void> {
		const next = updateTableState(this.state, patch)
		const params = writeTableUrl(next, page.url.searchParams, this.config)
		const current = page.url.searchParams.toString()
		const search = params.toString()
		if (search === current) return Promise.resolve()
		const href = `${page.url.pathname}${search ? `?${search}` : ''}${page.url.hash}`
		return goto(href, {
			replaceState: options.replace ?? true,
			keepFocus: true,
			noScroll: true
		})
	}

	setPage(pageNumber: number): Promise<void> {
		// Page changes get their own history entry so Back returns to the last page
		return this.update({ page: pageNumber }, { replace: false })
	}

	setPer(per: number): Promise<void> {
		return this.update({ per })
	}

	setSort(sort: SortSpec[]): Promise<void> {
		return this.update({ sort })
	}

	setSearch(q: string): Promise<void> {
		return this.update({ q })
	}

	setFilter(key: string, value: FilterValue | null): Promise<void> {
		const filters = { ...this.state.filters }
		if (value === null) delete filters[key]
		else filters[key] = value
		return this.update({ filters })
	}

	clearFilters(): Promise<void> {
		return this.update({ filters: {}, q: '' })
	}
}

/** Create in a component's script so it reads the page state of that component */
export function createTableUrl(config: TableUrlConfig = {}): TableUrl {
	return new TableUrl(config)
}
