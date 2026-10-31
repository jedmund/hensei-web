/**
 * Admin list endpoints (`GET /admin/<resource>`), used by the database
 * DataTable's server source.
 *
 * Wire format (before BaseAdapter camelCases the response):
 *   GET /admin/weapons?q=&filter[element]=1,2&filter[release_date][gte]=…
 *     &filter[missing_images]=true&sort=-updated_at,name_en&page=1&per=50
 *     &fields=…&facets=element,rarity
 *   → { results: [...], meta: { total, page, per, total_pages },
 *       facets: { element: { "1": 312 } } }
 */

export type AdminResource = 'weapons' | 'characters' | 'summons'

export type AdminFilterValue = string[] | boolean | { gte?: string; lte?: string }

export interface AdminListParams {
	page: number
	per: number
	q?: string
	/** API sort string, e.g. `-updated_at,name_en` */
	sort?: string
	/** Keyed by API filter name (snake_case), e.g. `release_date` */
	filters?: Record<string, AdminFilterValue>
	fields?: string[]
	facets?: string[]
}

export interface AdminListMeta {
	total: number
	page: number
	per: number
	totalPages: number
}

export type AdminFacets = Record<string, Record<string, number>>

export interface AdminListResponse<T> {
	results: T[]
	meta: AdminListMeta
	facets: AdminFacets
}
