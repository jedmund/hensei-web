/**
 * Spark maker state: the SSRs someone pulled on their way to a spark, in
 * three lists (new characters, characters that came back as gold moons, and
 * summons), which one they sparked, and how many draws it took.
 *
 * It lives in the URL so a spark can be shared as a link, and so the image
 * endpoint can rebuild it. Items are catalogue granblue_ids (the character's
 * weapon, or the summon). Every value is validated on the way in and anything
 * invalid is dropped.
 */

import {
	SPARK_POOLS,
	SPARK_SEASONS,
	findPromotion,
	poolOpenOn,
	poolTakesSeason
} from '$lib/features/spark/pools'
import type { CatalogueItem } from '$lib/types/gacha'
import type { SparkRenderData } from '$lib/types/spark'

export const SPARK_COLUMNS = ['characters', 'moons', 'summons'] as const
export type SparkColumn = (typeof SPARK_COLUMNS)[number]

export interface SparkMark {
	column: SparkColumn
	index: number
}

export interface Spark {
	characters: string[]
	moons: string[]
	summons: string[]
	/** The item that was sparked rather than drawn */
	sparked: SparkMark | null
	draws: number
	/** The day of the spark, as YYYY-MM-DD with no time zone */
	date: string | null
	/** The gacha it was on: a pool from SPARK_POOLS and a season from SPARK_SEASONS */
	pool: string | null
	season: string | null
}

/** More than anyone draws in one spark, and keeps links and renders bounded */
export const MAX_PER_COLUMN = 60
export const MAX_DRAWS = 99_999
export const DEFAULT_DRAWS = 300

export const emptySpark = (): Spark => ({
	characters: [],
	moons: [],
	summons: [],
	sparked: null,
	draws: DEFAULT_DRAWS,
	date: null,
	pool: null,
	season: null
})

// URL keys for each column, and the shape of the ids it holds: weapons
// (which recruit the characters) start with 1, summons with 2
const KEYS: Record<SparkColumn, string> = { characters: 'c', moons: 'm', summons: 's' }
const ID_PATTERNS: Record<SparkColumn, RegExp> = {
	characters: /^1\d{9}$/,
	moons: /^1\d{9}$/,
	summons: /^2\d{9}$/
}

function readList(params: URLSearchParams, column: SparkColumn): string[] {
	return (params.get(KEYS[column]) ?? '')
		.split(',')
		.filter((id) => ID_PATTERNS[column].test(id))
		.slice(0, MAX_PER_COLUMN)
}

function readMark(value: string | null, spark: Spark): SparkMark | null {
	const match = value?.match(/^([cms])(\d{1,2})$/)
	if (!match) return null
	const column = SPARK_COLUMNS.find((key) => KEYS[key] === match[1])
	const index = Number(match[2])
	if (!column || index >= spark[column].length) return null
	return { column, index }
}

/** A real day written as YYYY-MM-DD */
function isDate(value: string): boolean {
	const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
	if (!match) return false
	const [year, month, day] = match.slice(1).map(Number) as [number, number, number]
	const date = new Date(Date.UTC(year, month - 1, day))
	return (
		date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
	)
}

export function readSpark(params: URLSearchParams): Spark {
	const spark = emptySpark()
	for (const column of SPARK_COLUMNS) spark[column] = readList(params, column)
	spark.sparked = readMark(params.get('spark'), spark)
	const draws = params.get('draws') ?? ''
	if (/^\d{1,5}$/.test(draws) && Number(draws) > 0) spark.draws = Number(draws)
	const date = params.get('date') ?? ''
	if (isDate(date)) spark.date = date
	// A Classic pool from before it opened is dropped
	const pool = findPromotion(SPARK_POOLS, params.get('pool'))?.value ?? null
	spark.pool = poolOpenOn(pool, spark.date) ? pool : null
	// Only pools that run seasons keep one
	const season = findPromotion(SPARK_SEASONS, params.get('season'))?.value ?? null
	spark.season = poolTakesSeason(spark.pool) ? season : null
	return spark
}

/**
 * Query string for a spark, in a fixed order; empty values are left out. The
 * values are digits and commas, which need no escaping, so commas stay
 * readable in links.
 */
export function writeSpark(spark: Spark): string {
	const parts: string[] = []
	for (const column of SPARK_COLUMNS) {
		if (spark[column].length > 0) parts.push(`${KEYS[column]}=${spark[column].join(',')}`)
	}
	if (spark.sparked) parts.push(`spark=${KEYS[spark.sparked.column]}${spark.sparked.index}`)
	if (spark.draws !== DEFAULT_DRAWS) parts.push(`draws=${spark.draws}`)
	if (spark.date) parts.push(`date=${spark.date}`)
	if (spark.pool) parts.push(`pool=${spark.pool}`)
	if (spark.season) parts.push(`season=${spark.season}`)
	return parts.join('&')
}

export const sparkItemCount = (spark: Spark) =>
	spark.characters.length + spark.moons.length + spark.summons.length

// --- Edits -------------------------------------------------------------------
// Each returns a new spark, keeping the sparked mark on the same item.

/**
 * Add an item where the game would put it: a summon with the summons; a
 * character as a gold moon when the player already had them (`owned`, from
 * their collection) or drew them earlier in this spark, otherwise as a new
 * character.
 */
export function addItem(spark: Spark, granblueId: string, owned = false): Spark {
	const column: SparkColumn = granblueId.startsWith('2')
		? 'summons'
		: owned || spark.characters.includes(granblueId) || spark.moons.includes(granblueId)
			? 'moons'
			: 'characters'
	if (!ID_PATTERNS[column].test(granblueId) || spark[column].length >= MAX_PER_COLUMN) return spark
	return { ...spark, [column]: [...spark[column], granblueId] }
}

/**
 * Put an item at a place in a column, as when it's dragged in from the
 * picker: the place the player chose wins over where adding would put it.
 * Ids must suit the column (summons with summons, characters with new
 * characters or gold moons), and a full column takes no more.
 */
export function insertItem(spark: Spark, granblueId: string, to: SparkMark): Spark {
	if (!ID_PATTERNS[to.column].test(granblueId) || spark[to.column].length >= MAX_PER_COLUMN) {
		return spark
	}
	const index = Math.min(Math.max(to.index, 0), spark[to.column].length)
	const list = [...spark[to.column]]
	list.splice(index, 0, granblueId)
	let sparked = spark.sparked
	if (sparked?.column === to.column && sparked.index >= index) {
		sparked = { column: to.column, index: sparked.index + 1 }
	}
	return { ...spark, [to.column]: list, sparked }
}

export function removeItem(spark: Spark, column: SparkColumn, index: number): Spark {
	const list = spark[column].filter((_, i) => i !== index)
	let sparked = spark.sparked
	if (sparked?.column === column) {
		if (sparked.index === index) sparked = null
		else if (sparked.index > index) sparked = { column, index: sparked.index - 1 }
	}
	return { ...spark, [column]: list, sparked }
}

/**
 * Move an item to a place in a column: within its own column to reorder it,
 * or between new characters and gold moons. `to.index` is where it ends up;
 * past the end appends. Summons stay in their column, and a full column
 * takes no more.
 */
export function moveItem(spark: Spark, from: SparkMark, to: SparkMark): Spark {
	const id = spark[from.column][from.index]
	if (!id) return spark
	const crossing = from.column !== to.column
	if (crossing && (from.column === 'summons' || to.column === 'summons')) return spark
	if (crossing && spark[to.column].length >= MAX_PER_COLUMN) return spark

	// Tag the sparked item so the mark follows it
	const tagged = (column: SparkColumn) =>
		spark[column].map((value, index) => ({
			id: value,
			sparked: spark.sparked?.column === column && spark.sparked.index === index
		}))
	const source = tagged(from.column)
	const [moved] = source.splice(from.index, 1)
	if (!moved) return spark
	const target = crossing ? tagged(to.column) : source
	target.splice(Math.min(to.index, target.length), 0, moved)

	const next: Spark = { ...spark, [from.column]: source.map((entry) => entry.id) }
	next[to.column] = target.map((entry) => entry.id)
	const columns = crossing ? [from.column, to.column] : [to.column]
	for (const column of columns) {
		const list = column === from.column ? source : target
		const index = list.findIndex((entry) => entry.sparked)
		if (index >= 0) next.sparked = { column, index }
	}
	return next
}

/** Mark an item as the sparked one, or clear the mark if it already is */
export function toggleSparked(spark: Spark, column: SparkColumn, index: number): Spark {
	const same = spark.sparked?.column === column && spark.sparked.index === index
	return { ...spark, sparked: same ? null : { column, index } }
}

// --- Layout ------------------------------------------------------------------

/** Tiles per row in every column */
/**
 * The characters under New characters that the player doesn't own yet, as
 * collection character ids, once each. Gold Moons were owned already.
 */
export function newCollectionCharacters(
	spark: Spark,
	byId: ReadonlyMap<string, CatalogueItem>,
	owned: ReadonlySet<string>
): string[] {
	const ids = new Set<string>()
	for (const granblueId of spark.characters) {
		const recruit = byId.get(granblueId)?.recruits
		if (recruit?.id && recruit.granblue_id && !owned.has(recruit.granblue_id)) ids.add(recruit.id)
	}
	return [...ids]
}

export const TILES_PER_ROW = 2

export interface SparkLayoutBox {
	/** The space the columns share */
	width: number
	columnGap: number
	/** Padding inside each column, on each side */
	columnPadding: number
	tileGap: number
	/** Tile width over height */
	aspect: number
}

export interface SparkLayout {
	/** Every tile is the same width, in every column */
	tileWidth: number
	/** Every column is the same width */
	columnWidth: number
	/** Height of the fullest column's tiles */
	tilesHeight: number
}

/**
 * Lay out a spark: equal columns of {@link TILES_PER_ROW} tiles per row, the
 * tiles filling each column's width so its padding is even on every side.
 * The fullest column sets how tall the tiles run; the image grows to fit. A
 * pure function of the counts, so the page and the server render agree.
 */
export function layoutSpark(counts: Record<SparkColumn, number>, box: SparkLayoutBox): SparkLayout {
	const columns = SPARK_COLUMNS.length
	const columnWidth = Math.floor((box.width - box.columnGap * (columns - 1)) / columns)
	const tiles = columnWidth - box.columnPadding * 2
	const tileWidth = Math.max(
		0,
		Math.floor((tiles - box.tileGap * (TILES_PER_ROW - 1)) / TILES_PER_ROW)
	)
	const rows = Math.max(
		1,
		...SPARK_COLUMNS.map((column) => Math.ceil(counts[column] / TILES_PER_ROW))
	)
	const tilesHeight = rows * (tileWidth / box.aspect) + box.tileGap * (rows - 1)
	return { tileWidth, columnWidth, tilesHeight }
}

// --- Resolving ---------------------------------------------------------------

/**
 * Resolve a spark's ids against the catalogue. Ids the catalogue doesn't have
 * are dropped, and the sparked mark follows its item (or is cleared with it).
 * Returns the resolved columns and the spark with only the ids that resolved.
 */
export function resolveSpark(
	spark: Spark,
	byId: ReadonlyMap<string, CatalogueItem>
): { spark: Spark; data: SparkRenderData } {
	const columns = { characters: [], moons: [], summons: [] } as SparkRenderData['columns']
	const cleaned: Spark = { ...spark, characters: [], moons: [], summons: [], sparked: null }
	for (const column of SPARK_COLUMNS) {
		spark[column].forEach((id, index) => {
			const item = byId.get(id)
			if (!item) return
			if (spark.sparked?.column === column && spark.sparked.index === index) {
				cleaned.sparked = { column, index: cleaned[column].length }
			}
			cleaned[column].push(id)
			columns[column].push(item)
		})
	}
	return {
		spark: cleaned,
		data: {
			columns,
			sparked: cleaned.sparked,
			draws: cleaned.draws,
			date: cleaned.date,
			pool: cleaned.pool,
			season: cleaned.season
		}
	}
}
