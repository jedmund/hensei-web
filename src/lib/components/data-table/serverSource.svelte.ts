/**
 * Server DataTable source: one page at a time from an admin list endpoint,
 * through a TanStack Query keyed by the URL state. Create it during
 * component initialisation (it needs the QueryClient context).
 */
import { createQuery, useQueryClient, type QueryClient } from '@tanstack/svelte-query'
import { adminQueries } from '$lib/api/queries/admin.queries'
import type { AdminListParams, AdminListResponse, AdminResource } from '$lib/types/api/admin'
import { buildListParams, fetchListPage } from './serverParams'
import type { TableUrl } from './tableUrl.svelte'
import type { DataTableColumn, DataTableSource, Facets, LoadedPage } from './types'

export interface ServerSourceOptions<T> {
	url: TableUrl
	resource: AdminResource
	columns: DataTableColumn<T>[]
	fields?: string[]
	facets?: string[]
}

const EMPTY: never[] = []

export class ServerSource<T> implements DataTableSource<T> {
	readonly kind = 'server' as const
	readonly paginated = true
	readonly url: TableUrl
	readonly resource: AdminResource

	#options: ServerSourceOptions<T>
	#queryClient: QueryClient

	readonly params: AdminListParams = $derived.by(() =>
		buildListParams(this.url.state, this.#options)
	)

	#query: ReturnType<typeof createQuery<AdminListResponse<T>>>

	// Closures, not plain expressions: the fields they read are assigned in the constructor
	readonly rows: T[] = $derived.by(() => this.#query.data?.results ?? EMPTY)
	readonly total = $derived.by(() => this.#query.data?.meta.total ?? 0)
	/** The page the current rows belong to (lags the URL while the next page loads) */
	readonly page = $derived.by(() => this.#query.data?.meta.page ?? this.url.state.page)
	readonly per = $derived.by(() => this.url.state.per)
	readonly totalPages = $derived.by(() => this.#query.data?.meta.totalPages ?? 1)
	readonly facets: Facets | undefined = $derived.by(() => this.#query.data?.facets)

	constructor(options: ServerSourceOptions<T>) {
		this.#options = options
		this.url = options.url
		this.resource = options.resource
		this.#queryClient = useQueryClient()
		// Created after the fields above are assigned: the options getter runs immediately
		this.#query = createQuery(() => adminQueries.list<T>(this.resource, this.params))
	}

	get isPending(): boolean {
		return this.#query.isPending
	}

	get isFetching(): boolean {
		return this.#query.isFetching
	}

	get error(): unknown {
		return this.#query.error
	}

	readonly loadPage = async (page: number): Promise<LoadedPage<T>> => {
		const response = await fetchListPage<T>(this.#queryClient, this.resource, this.params, page)
		await this.url.setPage(response.meta.page)
		return {
			rows: response.results,
			page: response.meta.page,
			totalPages: response.meta.totalPages
		}
	}

	refetch(): void {
		void this.#query.refetch()
	}
}

export function createServerSource<T>(options: ServerSourceOptions<T>): ServerSource<T> {
	return new ServerSource(options)
}
