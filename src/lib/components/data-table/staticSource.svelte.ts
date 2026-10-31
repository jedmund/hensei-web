/**
 * Static DataTable source: a full array (usually from an existing TanStack
 * Query) searched, filtered and sorted on the client from URL state. Every
 * matching row is shown on one virtualised page.
 */
import { applyStaticQuery, type StaticFilterFn } from './staticQuery'
import type { TableUrl } from './tableUrl.svelte'
import type { DataTableColumn, DataTableSource } from './types'

export interface StaticSourceOptions<T> {
	url: TableUrl
	columns: DataTableColumn<T>[]
	/** Getter so the source follows reactive data, e.g. `() => query.data` */
	data: () => T[] | null | undefined
	isPending?: () => boolean
	isFetching?: () => boolean
	error?: () => unknown
	refetch?: () => void
	/** Predicates for the URL filters declared on `url` */
	filters?: Record<string, StaticFilterFn<T>>
}

const EMPTY: never[] = []

export class StaticSource<T> implements DataTableSource<T> {
	readonly kind = 'static' as const
	readonly paginated = false
	readonly page = 1
	readonly totalPages = 1
	readonly facets = undefined
	readonly loadPage = null
	readonly url: TableUrl

	#options: StaticSourceOptions<T>

	readonly rows: T[] = $derived.by(() => {
		const data = this.#options.data() ?? EMPTY
		const { q, filters, sort } = this.url.state
		return applyStaticQuery(data, { q, filters, sort }, this.#options)
	})

	readonly total = $derived(this.rows.length)
	readonly per = $derived(Math.max(this.rows.length, 1))

	constructor(options: StaticSourceOptions<T>) {
		this.#options = options
		this.url = options.url
	}

	get isPending(): boolean {
		return this.#options.isPending?.() ?? false
	}

	get isFetching(): boolean {
		return this.#options.isFetching?.() ?? false
	}

	get error(): unknown {
		return this.#options.error?.() ?? null
	}

	refetch(): void {
		this.#options.refetch?.()
	}
}

export function createStaticSource<T>(options: StaticSourceOptions<T>): StaticSource<T> {
	return new StaticSource(options)
}
