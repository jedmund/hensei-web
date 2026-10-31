import type { Snippet } from 'svelte'
import type { TableUrl } from './tableUrl.svelte'

/** Catalogue thumbnails, resolved from the row's `granblueId` */
export type ImageKind = 'character' | 'weapon' | 'summon'

export interface ImageSource {
	src: string
	/** Used when `src` fails to load */
	fallback?: string | undefined
	alt?: string | undefined
}

export interface NameValue {
	en?: string | null | undefined
	ja?: string | null | undefined
}

/** Badge colours, from the `--badge-*` theme tokens */
export type FlagTone = 'extra' | 'element' | 'keys' | 'awaken' | 'ax' | 'neutral'

export interface FlagValue {
	label: string
	tone?: FlagTone
}

export type SortPrimitive = string | number | boolean | null | undefined

export type RowHeight = 'compact' | 'default' | 'image'

export const ROW_HEIGHTS: Record<RowHeight, number> = {
	compact: 36,
	default: 48,
	image: 72
}

interface ColumnBase<T> {
	/** Stable id. Also the URL sort key and, by default, the API sort field */
	id: string
	/** Header text. Pass a Paraglide message function so it follows the locale */
	header: string | (() => string)
	/**
	 * The column's value: rendered by the built-in cell, and used for client
	 * sorting and search unless `sortValue` / `searchValue` say otherwise.
	 */
	value?: (row: T) => unknown
	/** Defaults to true when the column has a value (or is a name column) */
	sortable?: boolean
	/** Client sort key. Defaults to `value` (or the localized name) */
	sortValue?: (row: T) => SortPrimitive
	/** Server sort field (`sort=` param). Defaults to `id` */
	sortField?: string
	/** Include in client search. Defaults to true for text and name columns */
	searchable?: boolean
	/** Client search text. Defaults to `value` (both names for name columns) */
	searchValue?: (row: T) => string | null | undefined
	/** CSS width, e.g. '80px' or '20%' */
	width?: string
	minWidth?: string
	align?: 'start' | 'center' | 'end'
	/** Whether the columns menu can hide it. Defaults to true; primary columns can't be hidden */
	hideable?: boolean
	/** Hidden until the user turns it on */
	defaultHidden?: boolean
	/** The row link lives in this cell. Defaults to the first visible column */
	primary?: boolean
}

export type BuiltInCellType =
	'text' | 'number' | 'date' | 'boolean' | 'element' | 'proficiency' | 'code'

export type DataTableColumn<T> =
	| (ColumnBase<T> & { type: BuiltInCellType })
	| (ColumnBase<T> & {
			type: 'image'
			/** A catalogue kind (uses `row.granblueId`) or a resolver */
			image: ImageKind | ((row: T) => ImageSource | null | undefined)
	  })
	| (ColumnBase<T> & {
			type: 'name'
			/** Primary line in the current locale, the other locale beneath it */
			name: (row: T) => NameValue | null | undefined
	  })
	| (ColumnBase<T> & {
			type: 'flags'
			flags: (row: T) => FlagValue[]
	  })
	| (ColumnBase<T> & {
			type: 'custom'
			cell: Snippet<[T]>
	  })

export type Facets = Record<string, Record<string, number>>

/**
 * What DataTable renders. Static and server sources both deliver rows that
 * are already filtered, sorted and paged, in display order.
 */
export interface DataTableSource<T> {
	readonly kind: 'static' | 'server'
	readonly url: TableUrl
	readonly rows: T[]
	/** Rows matching the current search and filters, across all pages */
	readonly total: number
	readonly page: number
	readonly per: number
	readonly totalPages: number
	/** Static sources show every row (virtualised), server sources page */
	readonly paginated: boolean
	/** True until the first data arrives */
	readonly isPending: boolean
	/** True while any request is in flight, including background refetches */
	readonly isFetching: boolean
	readonly error: unknown
	/** Facet counts from the server, keyed by filter then value */
	readonly facets: Facets | undefined
	/**
	 * Fetch a page with the current search, filters and sort, move the URL to
	 * it, and resolve with its rows. Null when there's only ever one page.
	 */
	readonly loadPage: ((page: number) => Promise<T[]>) | null
	refetch(): void
}

export function columnHeader<T>(column: DataTableColumn<T>): string {
	return typeof column.header === 'function' ? column.header() : column.header
}
