/**
 * URL ⇄ table state codec for DataTable.
 *
 * The URL is the source of truth for page, page size, sort, search and
 * filters. This module is pure: it parses a URLSearchParams into a
 * TableUrlState and writes a state back into a copy of the current params.
 * Params it doesn't own (`view`, `open`, anything else) are left alone.
 *
 * URL format:
 *   ?q=dark&sort=-updated_at,name_en&page=2&per=100
 *   &element=1,2              (multi filter)
 *   &missing_name_jp=true      (boolean filter)
 *   &release_date=2024-01-01..2024-12-31   (range filter; either side optional)
 *
 * Defaults (page 1, the default page size, the default sort, empty search,
 * empty filters) are omitted so a fresh table has a clean URL.
 */

export interface SortSpec {
	id: string
	desc: boolean
}

export interface RangeValue {
	gte?: string
	lte?: string
}

export type FilterValue = string[] | boolean | RangeValue

export type FilterKind = 'multi' | 'boolean' | 'range'

export interface FilterSpec {
	/** URL key, and the key sent to the API as `filter[key]` */
	key: string
	kind: FilterKind
}

export interface TableUrlState {
	page: number
	per: number
	sort: SortSpec[]
	q: string
	filters: Record<string, FilterValue>
}

export interface TableUrlConfig {
	filters?: FilterSpec[]
	defaultPer?: number
	/** Allowed page sizes; anything else in the URL falls back to the default */
	perOptions?: number[]
	defaultSort?: SortSpec[]
}

export const DEFAULT_PER = 50
export const DEFAULT_PER_OPTIONS = [20, 50, 100, 200]

/** Params this codec reads and writes, besides the declared filter keys */
export const TABLE_PARAM_KEYS = ['q', 'sort', 'page', 'per'] as const

/** Params owned by other features; filter keys must not collide with them */
const RESERVED_KEYS = new Set<string>([...TABLE_PARAM_KEYS, 'view', 'open'])

const RANGE_SEPARATOR = '..'

export function encodeSort(sort: SortSpec[]): string {
	return sort.map((s) => (s.desc ? `-${s.id}` : s.id)).join(',')
}

export function decodeSort(raw: string | null): SortSpec[] {
	if (!raw) return []
	const seen = new Set<string>()
	const result: SortSpec[] = []
	for (const part of raw.split(',')) {
		const token = part.trim()
		if (!token) continue
		const desc = token.startsWith('-')
		const id = desc ? token.slice(1) : token
		if (!id || seen.has(id)) continue
		seen.add(id)
		result.push({ id, desc })
	}
	return result
}

function sameSort(a: SortSpec[], b: SortSpec[]): boolean {
	return encodeSort(a) === encodeSort(b)
}

function parsePositiveInt(raw: string | null): number | null {
	if (!raw || !/^\d+$/.test(raw)) return null
	const value = Number(raw)
	return value >= 1 ? value : null
}

function encodeFilter(kind: FilterKind, value: FilterValue | undefined): string | null {
	if (value === undefined) return null
	switch (kind) {
		case 'multi':
			return Array.isArray(value) && value.length > 0 ? value.join(',') : null
		case 'boolean':
			return typeof value === 'boolean' ? String(value) : null
		case 'range': {
			if (typeof value !== 'object' || Array.isArray(value)) return null
			const gte = value.gte ?? ''
			const lte = value.lte ?? ''
			return gte || lte ? `${gte}${RANGE_SEPARATOR}${lte}` : null
		}
	}
}

function decodeFilter(kind: FilterKind, raw: string | null): FilterValue | null {
	if (raw === null || raw === '') return null
	switch (kind) {
		case 'multi': {
			const values = raw
				.split(',')
				.map((v) => v.trim())
				.filter(Boolean)
			return values.length > 0 ? values : null
		}
		case 'boolean':
			if (raw === 'true' || raw === '1') return true
			if (raw === 'false' || raw === '0') return false
			return null
		case 'range': {
			const index = raw.indexOf(RANGE_SEPARATOR)
			// A bare value is treated as a lower bound
			const gte = index === -1 ? raw : raw.slice(0, index)
			const lte = index === -1 ? '' : raw.slice(index + RANGE_SEPARATOR.length)
			if (!gte && !lte) return null
			const range: RangeValue = {}
			if (gte) range.gte = gte
			if (lte) range.lte = lte
			return range
		}
	}
}

function filterSpecs(config: TableUrlConfig): FilterSpec[] {
	const specs = config.filters ?? []
	for (const spec of specs) {
		if (RESERVED_KEYS.has(spec.key)) {
			throw new Error(`DataTable filter key "${spec.key}" collides with a reserved URL param`)
		}
	}
	return specs
}

export function defaultTableState(config: TableUrlConfig = {}): TableUrlState {
	return {
		page: 1,
		per: config.defaultPer ?? DEFAULT_PER,
		sort: config.defaultSort ?? [],
		q: '',
		filters: {}
	}
}

export function parseTableUrl(params: URLSearchParams, config: TableUrlConfig = {}): TableUrlState {
	const defaults = defaultTableState(config)
	const perOptions = config.perOptions ?? DEFAULT_PER_OPTIONS

	const per = parsePositiveInt(params.get('per'))
	const sort = decodeSort(params.get('sort'))

	const filters: Record<string, FilterValue> = {}
	for (const spec of filterSpecs(config)) {
		const value = decodeFilter(spec.kind, params.get(spec.key))
		if (value !== null) filters[spec.key] = value
	}

	return {
		page: parsePositiveInt(params.get('page')) ?? defaults.page,
		per: per !== null && perOptions.includes(per) ? per : defaults.per,
		// `sort=` (present but empty) means the user cleared the default sort
		sort: params.has('sort') ? sort : defaults.sort,
		q: (params.get('q') ?? '').trim(),
		filters
	}
}

/**
 * Returns a copy of `current` with the table's params replaced by `state`.
 * Params the table doesn't own are preserved in their original order.
 */
export function writeTableUrl(
	state: TableUrlState,
	current: URLSearchParams,
	config: TableUrlConfig = {}
): URLSearchParams {
	const defaults = defaultTableState(config)
	const specs = filterSpecs(config)
	const next = new URLSearchParams(current)

	for (const key of TABLE_PARAM_KEYS) next.delete(key)
	for (const spec of specs) next.delete(spec.key)

	const q = state.q.trim()
	if (q) next.set('q', q)
	if (state.sort.length > 0 && !sameSort(state.sort, defaults.sort)) {
		next.set('sort', encodeSort(state.sort))
	} else if (state.sort.length === 0 && defaults.sort.length > 0) {
		// An explicitly cleared sort must not fall back to the default on reload
		next.set('sort', '')
	}
	for (const spec of specs) {
		const encoded = encodeFilter(spec.kind, state.filters[spec.key])
		if (encoded !== null) next.set(spec.key, encoded)
	}
	if (state.page > 1) next.set('page', String(state.page))
	if (state.per !== defaults.per) next.set('per', String(state.per))

	return next
}

/**
 * Applies a partial change. Changing search, sort, filters or page size
 * returns to the first page, since the old page index no longer means
 * anything.
 */
export function updateTableState(
	state: TableUrlState,
	patch: Partial<TableUrlState>
): TableUrlState {
	const next: TableUrlState = { ...state, ...patch }
	const resetsPage =
		(patch.q !== undefined && patch.q !== state.q) ||
		(patch.sort !== undefined && !sameSort(patch.sort, state.sort)) ||
		(patch.per !== undefined && patch.per !== state.per) ||
		patch.filters !== undefined
	if (resetsPage && patch.page === undefined) next.page = 1
	return next
}

export function countActiveFilters(state: TableUrlState): number {
	return Object.keys(state.filters).length
}
