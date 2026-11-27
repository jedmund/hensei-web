import { describe, expect, it } from 'vitest'
import {
	addItem,
	insertItem,
	emptySpark,
	layoutSpark,
	TILES_PER_ROW,
	MAX_PER_COLUMN,
	readSpark,
	removeItem,
	resolveSpark,
	moveItem,
	toggleSparked,
	writeSpark,
	type Spark
} from '../spark'
import type { CatalogueItem } from '$lib/types/gacha'

const A = '1040000100'
const B = '1040000200'
const C = '1040000300'
const S = '2040000100'

const spark = (overrides: Partial<Spark> = {}): Spark => ({ ...emptySpark(), ...overrides })

describe('spark links', () => {
	it('round-trips a spark', () => {
		const original = spark({
			characters: [A, B],
			moons: [C],
			summons: [S],
			sparked: { column: 'characters', index: 1 },
			draws: 280,
			pool: 'flash',
			season: 'halloween'
		})
		const query = writeSpark(original)
		expect(query).toBe(`c=${A},${B}&m=${C}&s=${S}&spark=c1&draws=280&pool=flash&season=halloween`)
		expect(readSpark(new URLSearchParams(query))).toEqual(original)
	})

	it('drops unknown pools and seasons, and seasons on pools without them', () => {
		expect(readSpark(new URLSearchParams({ pool: 'gala', season: 'spring' }))).toMatchObject({
			pool: null,
			season: null
		})
		expect(readSpark(new URLSearchParams({ pool: 'classic', season: 'summer' }))).toMatchObject({
			pool: 'classic',
			season: null
		})
	})

	it('leaves defaults out of the link', () => {
		expect(writeSpark(spark())).toBe('')
	})

	it('drops ids that are malformed or in the wrong column', () => {
		const params = new URLSearchParams({ c: `${A},${S},abc,104`, s: `${S},${A}` })
		const read = readSpark(params)
		expect(read.characters).toEqual([A])
		expect(read.summons).toEqual([S])
	})

	it('caps each column', () => {
		const ids = Array.from({ length: MAX_PER_COLUMN + 5 }, () => A).join(',')
		expect(readSpark(new URLSearchParams({ c: ids })).characters).toHaveLength(MAX_PER_COLUMN)
	})

	it('ignores a sparked mark past the end of its column, and bad draws', () => {
		const read = readSpark(new URLSearchParams({ c: A, spark: 'c4', draws: '-3' }))
		expect(read.sparked).toBeNull()
		expect(read.draws).toBe(300)
	})
})

describe('spark edits', () => {
	it('adds characters and summons to their own columns', () => {
		const next = addItem(addItem(spark(), A), S)
		expect(next.characters).toEqual([A])
		expect(next.summons).toEqual([S])
	})

	it('adds characters the player already had as gold moons', () => {
		expect(addItem(spark(), A, true).moons).toEqual([A])
		// Drawn earlier in the spark, so this copy is a moon
		const again = addItem(addItem(spark(), A), A)
		expect(again.characters).toEqual([A])
		expect(again.moons).toEqual([A])
		// Summons don't give moons
		expect(addItem(spark(), S, true).summons).toEqual([S])
	})

	it('inserts a dragged-in item where it was dropped', () => {
		const start = spark({ characters: [A, B], sparked: { column: 'characters', index: 1 } })
		const inserted = insertItem(start, C, { column: 'characters', index: 1 })
		expect(inserted.characters).toEqual([A, C, B])
		expect(inserted.sparked).toEqual({ column: 'characters', index: 2 })
		// Past the end appends; a character can go straight to gold moons
		expect(insertItem(start, C, { column: 'moons', index: 9 }).moons).toEqual([C])
		// Ids must suit the column
		expect(insertItem(start, S, { column: 'characters', index: 0 })).toBe(start)
	})

	it('keeps the sparked mark on its item as others are removed', () => {
		const start = spark({ characters: [A, B, C], sparked: { column: 'characters', index: 2 } })
		expect(removeItem(start, 'characters', 0).sparked).toEqual({ column: 'characters', index: 1 })
		expect(removeItem(start, 'characters', 2).sparked).toBeNull()
	})

	it('reorders within a column, keeping the sparked mark on its item', () => {
		const start = spark({ characters: [A, B, C], sparked: { column: 'characters', index: 0 } })
		const moved = moveItem(
			start,
			{ column: 'characters', index: 0 },
			{ column: 'characters', index: 2 }
		)
		expect(moved.characters).toEqual([B, C, A])
		expect(moved.sparked).toEqual({ column: 'characters', index: 2 })

		const other = moveItem(
			start,
			{ column: 'characters', index: 2 },
			{ column: 'characters', index: 1 }
		)
		expect(other.characters).toEqual([A, C, B])
		expect(other.sparked).toEqual({ column: 'characters', index: 0 })
	})

	it('moves characters between new characters and gold moons', () => {
		const start = spark({
			characters: [A, B],
			moons: [C],
			sparked: { column: 'characters', index: 1 }
		})
		const moved = moveItem(start, { column: 'characters', index: 1 }, { column: 'moons', index: 0 })
		expect(moved.characters).toEqual([A])
		expect(moved.moons).toEqual([B, C])
		expect(moved.sparked).toEqual({ column: 'moons', index: 0 })

		// Past the end appends
		const appended = moveItem(
			start,
			{ column: 'characters', index: 0 },
			{ column: 'moons', index: 9 }
		)
		expect(appended.moons).toEqual([C, A])
		expect(appended.sparked).toEqual({ column: 'characters', index: 0 })
	})

	it("doesn't move summons out of their column, or into a full one", () => {
		const start = spark({ characters: [A], summons: [S] })
		expect(
			moveItem(start, { column: 'summons', index: 0 }, { column: 'characters', index: 0 })
		).toBe(start)
		const full = spark({ characters: [A], moons: Array.from({ length: MAX_PER_COLUMN }, () => B) })
		expect(moveItem(full, { column: 'characters', index: 0 }, { column: 'moons', index: 0 })).toBe(
			full
		)
	})

	it('toggles the sparked mark', () => {
		const marked = toggleSparked(spark({ summons: [S] }), 'summons', 0)
		expect(marked.sparked).toEqual({ column: 'summons', index: 0 })
		expect(toggleSparked(marked, 'summons', 0).sparked).toBeNull()
	})
})

describe('resolveSpark', () => {
	it('drops unknown ids and keeps the mark on its item', () => {
		const items = new Map([
			[A, { granblue_id: A } as CatalogueItem],
			[C, { granblue_id: C } as CatalogueItem]
		])
		const { spark: cleaned, data } = resolveSpark(
			spark({ characters: [A, B, C], sparked: { column: 'characters', index: 2 } }),
			items
		)
		expect(cleaned.characters).toEqual([A, C])
		expect(cleaned.sparked).toEqual({ column: 'characters', index: 1 })
		expect(data.columns.characters.map((item) => item.granblue_id)).toEqual([A, C])
	})
})

describe('layoutSpark', () => {
	const box = {
		width: 1152,
		height: 482,
		columnGap: 16,
		columnPadding: 12,
		tileGap: 6,
		aspect: 280 / 160,
		maxTileWidth: 240
	}
	const counts = (characters: number, moons: number, summons: number) => ({
		characters,
		moons,
		summons
	})

	function expectFits(layout: ReturnType<typeof layoutSpark>, most: number) {
		const rows = Math.ceil(most / TILES_PER_ROW)
		const height = layout.tileWidth / box.aspect
		expect(rows * height + (rows - 1) * box.tileGap).toBeLessThanOrEqual(box.height)
		expect(
			TILES_PER_ROW * layout.tileWidth + (TILES_PER_ROW - 1) * box.tileGap + box.columnPadding * 2
		).toBeLessThanOrEqual(layout.columnWidth)
		expect(layout.columnWidth * 3 + box.columnGap * 2).toBeLessThanOrEqual(box.width)
	}

	it('splits the width into equal columns of two tiles', () => {
		const layout = layoutSpark(counts(1, 0, 1), box)
		expect(layout.columnWidth).toBe(373)
		// A small spark fills the column's width
		expect(layout.tileWidth).toBe(171)
		expectFits(layout, 1)
	})

	it('sizes every tile to the fullest column', () => {
		const layout = layoutSpark(counts(12, 6, 5), box)
		expectFits(layout, 12)
		expect(layout.tileWidth).toBeLessThan(layoutSpark(counts(6, 6, 5), box).tileWidth)
	})

	it('fits full columns', () => {
		for (const c of [counts(60, 60, 60), counts(25, 4, 3)]) {
			const layout = layoutSpark(c, box)
			expectFits(layout, Math.max(c.characters, c.moons, c.summons))
			expect(layout.tileWidth).toBeGreaterThan(0)
		}
	})
})
