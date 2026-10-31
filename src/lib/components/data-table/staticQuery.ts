/**
 * Client-side search, filter and sort for static DataTable sources.
 * Pure functions, so they're testable without Svelte.
 */
import { localizedName } from '$lib/utils/locale'
import type { DataTableColumn, SortPrimitive } from './types'
import type { FilterValue, SortSpec, TableUrlState } from './urlState'

export type StaticFilterFn<T> = (row: T, value: FilterValue) => boolean

export interface StaticQueryOptions<T> {
	columns: DataTableColumn<T>[]
	/** Predicates for the declared URL filters, keyed by filter key */
	filters?: Record<string, StaticFilterFn<T>> | undefined
}

function toSortPrimitive(value: unknown): SortPrimitive {
	if (value === null || value === undefined) return value
	if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
		return value
	}
	if (value instanceof Date) return value.getTime()
	return String(value)
}

export function sortValueOf<T>(column: DataTableColumn<T>, row: T): SortPrimitive {
	if (column.sortValue) return column.sortValue(row)
	if (column.type === 'name') {
		const name = column.name(row)
		return name ? localizedName(name) : null
	}
	const raw = column.value?.(row)
	if (column.type === 'date' && typeof raw === 'string') {
		const time = Date.parse(raw)
		return Number.isNaN(time) ? null : time
	}
	return toSortPrimitive(raw)
}

export function isSortable<T>(column: DataTableColumn<T>): boolean {
	if (column.sortable !== undefined) return column.sortable
	return column.type === 'name' || !!column.value || !!column.sortValue
}

function isSearchable<T>(column: DataTableColumn<T>): boolean {
	if (column.searchable !== undefined) return column.searchable
	return column.type === 'name' || column.type === 'text'
}

function searchTextOf<T>(column: DataTableColumn<T>, row: T): string {
	if (column.searchValue) return column.searchValue(row) ?? ''
	if (column.type === 'name') {
		const name = column.name(row)
		return name ? `${name.en ?? ''} ${name.ja ?? ''}` : ''
	}
	const raw = column.value?.(row)
	return raw === null || raw === undefined ? '' : String(raw)
}

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })

/** Ascending comparison. Empty values sort last in both directions. */
export function compareSortValues(a: SortPrimitive, b: SortPrimitive): number {
	if (typeof a === 'number' && typeof b === 'number') return a - b
	if (typeof a === 'boolean' && typeof b === 'boolean') return Number(a) - Number(b)
	return collator.compare(String(a), String(b))
}

function isEmpty(value: SortPrimitive): boolean {
	return value === null || value === undefined || value === ''
}

export function sortRows<T>(rows: T[], sort: SortSpec[], columns: DataTableColumn<T>[]): T[] {
	const active = sort
		.map((spec) => ({ spec, column: columns.find((c) => c.id === spec.id) }))
		.filter(
			(entry): entry is { spec: SortSpec; column: DataTableColumn<T> } =>
				!!entry.column && isSortable(entry.column)
		)
	if (active.length === 0) return rows

	// Precompute keys once per row; Array.prototype.sort is stable
	const keyed = rows.map((row) => ({
		row,
		keys: active.map(({ column }) => sortValueOf(column, row))
	}))
	keyed.sort((a, b) => {
		for (let i = 0; i < active.length; i++) {
			const left = a.keys[i]
			const right = b.keys[i]
			const leftEmpty = isEmpty(left)
			const rightEmpty = isEmpty(right)
			if (leftEmpty || rightEmpty) {
				if (leftEmpty && rightEmpty) continue
				return leftEmpty ? 1 : -1
			}
			const result = compareSortValues(left, right)
			if (result !== 0) return active[i]!.spec.desc ? -result : result
		}
		return 0
	})
	return keyed.map((entry) => entry.row)
}

export function searchRows<T>(rows: T[], q: string, columns: DataTableColumn<T>[]): T[] {
	const terms = q.toLocaleLowerCase().split(/\s+/).filter(Boolean)
	if (terms.length === 0) return rows
	const searchable = columns.filter(isSearchable)
	if (searchable.length === 0) return rows
	return rows.filter((row) => {
		const haystack = searchable
			.map((column) => searchTextOf(column, row))
			.join(' ')
			.toLocaleLowerCase()
		return terms.every((term) => haystack.includes(term))
	})
}

export function filterRows<T>(
	rows: T[],
	filters: Record<string, FilterValue>,
	predicates: Record<string, StaticFilterFn<T>> = {}
): T[] {
	const active = Object.entries(filters).filter(([key]) => predicates[key])
	if (active.length === 0) return rows
	return rows.filter((row) => active.every(([key, value]) => predicates[key]!(row, value)))
}

/** Search, then filter, then sort. Returns the input array when nothing applies. */
export function applyStaticQuery<T>(
	rows: T[],
	state: Pick<TableUrlState, 'q' | 'filters' | 'sort'>,
	options: StaticQueryOptions<T>
): T[] {
	const searched = searchRows(rows, state.q, options.columns)
	const filtered = filterRows(searched, state.filters, options.filters)
	return sortRows(filtered, state.sort, options.columns)
}

/** Ready-made predicates for common filter shapes */
export const staticFilters = {
	/** Multi filter matching a scalar field, compared as strings */
	oneOf:
		<T>(get: (row: T) => unknown): StaticFilterFn<T> =>
		(row, value) =>
			Array.isArray(value) && value.includes(String(get(row))),
	/** Boolean filter matching a boolean field */
	is:
		<T>(get: (row: T) => boolean | null | undefined): StaticFilterFn<T> =>
		(row, value) =>
			typeof value === 'boolean' && !!get(row) === value,
	/** Range filter on a comparable field (ISO dates or numbers as strings) */
	between:
		<T>(get: (row: T) => string | number | null | undefined): StaticFilterFn<T> =>
		(row, value) => {
			if (typeof value !== 'object' || Array.isArray(value)) return true
			const field = get(row)
			if (field === null || field === undefined || field === '') return false
			const compare = (bound: string) => compareSortValues(field, coerce(field, bound))
			if (value.gte !== undefined && compare(value.gte) < 0) return false
			if (value.lte !== undefined && compare(value.lte) > 0) return false
			return true
		}
}

function coerce(field: string | number, bound: string): string | number {
	return typeof field === 'number' ? Number(bound) : bound
}
