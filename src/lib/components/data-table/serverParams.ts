/**
 * Table URL state → admin list params, for the server source.
 * Normalized so that equal state always yields an equal query key.
 */
import type { QueryClient } from '@tanstack/svelte-query'
import { adminQueries } from '$lib/api/queries/admin.queries'
import type {
	AdminFilterValue,
	AdminListParams,
	AdminListResponse,
	AdminResource
} from '$lib/types/api/admin'
import { isSortable } from './staticQuery'
import type { DataTableColumn } from './types'
import { encodeSort, type FilterValue, type TableUrlState } from './urlState'

export interface ServerParamsOptions<T> {
	columns: DataTableColumn<T>[]
	/**
	 * Sparse fieldset to request (`fields=`). The API replaces its default
	 * list with these, so name every field the rows need.
	 */
	fields?: string[] | undefined
	/**
	 * Visible column ids. Columns that declare `fields` add theirs only while
	 * visible; null or undefined means all columns.
	 */
	visibleColumnIds?: string[] | null | undefined
	/** Facet counts to request (`facets=`) */
	facets?: string[] | undefined
}

function normalizeFilter(value: FilterValue): AdminFilterValue | null {
	if (Array.isArray(value)) {
		const values = [...new Set(value)].sort()
		return values.length > 0 ? values : null
	}
	if (typeof value === 'boolean') return value
	const range: { gte?: string; lte?: string } = {}
	if (value.gte) range.gte = value.gte
	if (value.lte) range.lte = value.lte
	return range.gte || range.lte ? range : null
}

/** Base fields plus those of the visible columns, de-duplicated and sorted for a stable key */
export function requestedFields<T>(options: ServerParamsOptions<T>): string[] {
	const fields = new Set(options.fields ?? [])
	const visible = options.visibleColumnIds ? new Set(options.visibleColumnIds) : null
	for (const column of options.columns) {
		if (!column.fields || (visible && !visible.has(column.id))) continue
		for (const field of column.fields) fields.add(field)
	}
	return [...fields].sort()
}

export function buildListParams<T>(
	state: TableUrlState,
	options: ServerParamsOptions<T>
): AdminListParams {
	const params: AdminListParams = { page: state.page, per: state.per }

	const q = state.q.trim()
	if (q) params.q = q

	const sort = state.sort.flatMap((spec) => {
		const column = options.columns.find((c) => c.id === spec.id)
		if (!column || !isSortable(column)) return []
		return [{ id: column.sortField ?? column.id, desc: spec.desc }]
	})
	if (sort.length > 0) params.sort = encodeSort(sort)

	const filters: Record<string, AdminFilterValue> = {}
	for (const key of Object.keys(state.filters).sort()) {
		const normalized = normalizeFilter(state.filters[key]!)
		if (normalized !== null) filters[key] = normalized
	}
	if (Object.keys(filters).length > 0) params.filters = filters

	const fields = requestedFields(options)
	if (fields.length > 0) params.fields = fields
	if (options.facets && options.facets.length > 0) params.facets = [...options.facets]

	return params
}

/** Fetches (or reads from cache) one page with the same params as the table */
export function fetchListPage<T>(
	queryClient: QueryClient,
	resource: AdminResource,
	params: AdminListParams,
	page: number
): Promise<AdminListResponse<T>> {
	return queryClient.fetchQuery(adminQueries.list<T>(resource, { ...params, page }))
}
