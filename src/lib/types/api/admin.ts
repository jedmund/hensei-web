/**
 * Admin list endpoints (`GET /admin/<resource>`, editors only), used by the
 * database DataTable's server source. Contract from GBF-138.
 *
 * Wire format (before BaseAdapter camelCases the response):
 *   GET /admin/weapons?q=&filter[element]=1,2&filter[updated_at][gte]=…
 *     &filter[no_skills]=true&sort=-updated_at,name_en&page=1&per=50
 *     &fields=…&facets=element,rarity
 *   → { results: [...], meta: { total, page, per, total_pages },
 *       facets: { element: { "1": 312 } } }   (facets only when requested)
 *
 * Weapons:
 * - `q`: case-insensitive substring over name_en, name_jp, granblue_id.
 * - List or range filters: element, rarity, proficiency (integers), release_date.
 *   List only: series (slug, UUID or `none`), granblue_id.
 *   Range only: created_at, updated_at (a bare value is a 422; send [gte]/[lte]).
 *   `none` in a list matches NULL.
 * - Boolean filters: flb, ulb, transcendence, extra, limit, and the data-quality
 *   flags missing_name_jp, no_skills.
 * - Sort fields: name_en, name_jp, granblue_id, rarity, element, proficiency,
 *   release_date, flb_date, ulb_date, transcendence_date, latest_date, updated_at,
 *   created_at. NULLS LAST. Default -latest_date,name_en.
 * - page/per: per defaults to 50, max 200; out-of-range values are clamped.
 *   total_pages is 0 when total is 0.
 * - Facets: element, rarity, proficiency, series (keyed by series UUID). Each
 *   ignores its own filter; NULLs count under "none".
 * - Unknown filter, sort, field or facet → 422 { error }.
 */

import type { AugmentType } from './weaponStatModifier'
import type { ResourceName } from '$lib/features/database/schema/names'

/**
 * Route segments: the registered resources.
 * The API path is the segment in snake_case (`raid-groups` → `/admin/raid_groups`)
 */
export type AdminResource = ResourceName

export type AdminFilterValue = string[] | boolean | { gte?: string; lte?: string }

export interface AdminListParams {
	page: number
	per: number
	q?: string
	/** API sort string, e.g. `-updated_at,name_en` */
	sort?: string
	/** Keyed by API filter name (snake_case), e.g. `release_date` */
	filters?: Record<string, AdminFilterValue>
	/** Replaces the default field list (name every field you need); `id` is always included */
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

/** Default `fields` of an admin weapon row, camelCased. Rows are flat. */
export interface AdminWeaponRow {
	id: string
	granblueId: string
	nameEn: string | null
	nameJp: string | null
	element: number | null
	rarity: number | null
	proficiency: number | null
	seriesId: string | null
	seriesSlug: string | null
	releaseDate: string | null
	updatedAt: string
	// Not in the default list: request via `fields`
	seriesNameEn?: string | null
	seriesNameJp?: string | null
	skillCount?: number
	flb?: boolean
	ulb?: boolean
	transcendence?: boolean
	flbDate?: string | null
	ulbDate?: string | null
	transcendenceDate?: string | null
	/** Newest of the release and uncap dates */
	latestDate?: string | null
	extra?: boolean
	limit?: boolean
	createdAt?: string
}

/** A character series as the admin character list sends it */
export interface AdminCharacterSeriesRef {
	id: string
	slug: string
	nameEn: string | null
	nameJp: string | null
}

/**
 * Default `fields` of an admin character row, camelCased. Rows are flat; a
 * style shift shares its base character's granblueId.
 */
export interface AdminCharacterRow {
	id: string
	granblueId: string
	nameEn: string | null
	nameJp: string | null
	element: number | null
	rarity: number | null
	proficiency1: number | null
	proficiency2: number | null
	styleSwap: boolean
	releaseDate: string | null
	/** Newest of the release and uncap dates */
	latestDate: string | null
	updatedAt: string
	// Not in the default list: request via `fields`
	gender?: number | null
	race1?: number | null
	race2?: number | null
	season?: number | null
	special?: boolean
	flb?: boolean
	ulb?: boolean
	transcendence?: boolean
	maxTranscendenceStage?: number
	flbDate?: string | null
	ulbDate?: string | null
	transcendenceDate?: string | null
	/** In series order */
	series?: AdminCharacterSeriesRef[]
	skillCount?: number
	createdAt?: string
}

/** Default `fields` of an admin summon row, camelCased. Rows are flat. */
export interface AdminSummonRow {
	id: string
	granblueId: string
	nameEn: string | null
	nameJp: string | null
	element: number | null
	rarity: number | null
	seriesId: string | null
	seriesSlug: string | null
	releaseDate: string | null
	/** Newest of the release and uncap dates */
	latestDate: string | null
	updatedAt: string
	// Not in the default list: request via `fields`
	seriesNameEn?: string | null
	seriesNameJp?: string | null
	flb?: boolean
	ulb?: boolean
	transcendence?: boolean
	subaura?: boolean
	limit?: boolean
	maxLevel?: number
	flbDate?: string | null
	ulbDate?: string | null
	transcendenceDate?: string | null
	auraCount?: number
	createdAt?: string
}

/** A raid's group, as `GET /admin/raids` returns it in `group` */
export interface AdminRaidGroupRef {
	id: string
	nameEn: string | null
	nameJp: string | null
	section: number
	order: number
}

/**
 * Raid row from `GET /admin/raids`. The default order is the raid's group
 * (section, then order), then element, then level.
 */
export interface AdminRaidRow {
	id: string
	slug: string
	nameEn: string | null
	nameJp: string | null
	level: number | null
	element: number | null
	playerCount: number
	group: AdminRaidGroupRef | null
	updatedAt: string
	// Not in the default list: request via `fields`
	extra?: boolean | null
	enemyId?: number | null
	summonId?: number | null
	questId?: number | null
	releasedAt?: string | null
	groupId?: string
	createdAt?: string
}

/** Raid group row from `GET /admin/raid_groups` */
export interface AdminRaidGroupRow {
	id: string
	nameEn: string
	nameJp: string
	section: number
	order: number
	difficulty: number | null
	hl: boolean
	extra: boolean
	guidebooks: boolean
	unlimited: boolean
	supportSummon: boolean
	raidCount: number
	/** Distinct player counts of its raids, ascending */
	playerCounts: number[]
	// Not in the default list: request via `fields`
	contentMode?: string | null
	createdAt?: string
	updatedAt?: string
}

/** Admin rows of slug-keyed resources (series, awakenings), camelCased */
interface AdminSluggedRow {
	id: string
	slug: string
	nameEn: string
	nameJp: string
	order: number
	// Not in the default list: request via `fields`
	createdAt?: string
	updatedAt?: string
}

export interface AdminWeaponSeriesRow extends AdminSluggedRow {
	extra?: boolean
	elementChangeable?: boolean
	hasWeaponKeys?: boolean
	hasAwakening?: boolean
	augmentType?: AugmentType
	numWeaponKeys?: number | null
	weaponCount?: number
}

export interface AdminCharacterSeriesRow extends AdminSluggedRow {
	characterCount?: number
}

export interface AdminAwakeningRow extends AdminSluggedRow {
	objectType: string
}

/**
 * Event row from `GET /admin/events` (curators and editors). Kinds, series
 * and statuses are names; the element is the boss's, as an integer.
 */
export interface AdminEventRow {
	id: string
	nameEn: string
	nameJp: string | null
	kind: string
	element: number | null
	eventNumber: number | null
	startsAt: string
	endsAt: string
	raidCount: number
	// Not in the default list: request via `fields`
	series?: string | null
	status?: string
	imageKey?: string | null
	createdAt?: string
	updatedAt?: string
}

/** Default `fields` of an admin job row, camelCased. Class I and II jobs share a granblueId */
export interface AdminJobRow {
	id: string
	granblueId: string
	nameEn: string | null
	nameJp: string | null
	/** 1-5, ex1, ex2 or o1 */
	row: string
	order: number | null
	proficiency1: number | null
	proficiency2: number | null
	updatedAt: string
	// Not in the default list: request via `fields`
	masterLevel?: boolean
	ultimateMastery?: boolean
	auxWeapon?: boolean
	accessory?: boolean
	accessoryType?: number
	baseJobId?: string | null
	skillCount?: number
	createdAt?: string
}

/** A job as the admin job skill and accessory lists send it */
export interface AdminJobRef {
	id: string
	granblueId: string
	nameEn: string | null
	nameJp: string | null
}

/** Default `fields` of an admin job skill row, camelCased */
export interface AdminJobSkillRow {
	id: string
	nameEn: string | null
	nameJp: string | null
	slug: string
	color: number
	main: boolean
	sub: boolean
	emp: boolean
	base: boolean
	order: number | null
	job: AdminJobRef | null
	updatedAt: string
	// Not in the default list: request via `fields`
	imageId?: string | null
	actionId?: number | null
	jobId?: string
	createdAt?: string
}

/** Default `fields` of an admin job accessory row, camelCased */
export interface AdminJobAccessoryRow {
	id: string
	granblueId: string
	nameEn: string | null
	nameJp: string | null
	accessoryType: number
	rarity: number | null
	job: AdminJobRef | null
	releaseDate: string | null
	updatedAt: string
	// Not in the default list: request via `fields`
	jobId?: string
	createdAt?: string
}
