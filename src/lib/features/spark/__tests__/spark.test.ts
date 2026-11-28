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
	newCollectionCharacters,
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
			sparked: [{ column: 'characters', index: 1 }],
			draws: 280,
			date: '2026-11-15',
			pool: 'flash',
			season: 'halloween'
		})
		const query = writeSpark(original)
		expect(query).toBe(
			`c=${A},${B}&m=${C}&s=${S}&spark=c1&draws=280&date=2026-11-15&pool=flash&season=halloween`
		)
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

	it('drops a Classic pool from before it opened', () => {
		expect(readSpark(new URLSearchParams({ date: '2021-06-01', pool: 'classic' })).pool).toBeNull()
		expect(readSpark(new URLSearchParams({ date: '2022-06-01', pool: 'classic' })).pool).toBe(
			'classic'
		)
	})

	it('drops dates that are not real days', () => {
		expect(readSpark(new URLSearchParams({ date: '2026-02-30' })).date).toBeNull()
		expect(readSpark(new URLSearchParams({ date: 'tomorrow' })).date).toBeNull()
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
		expect(read.sparked).toEqual([])
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
		const start = spark({ characters: [A, B], sparked: [{ column: 'characters', index: 1 }] })
		const inserted = insertItem(start, C, { column: 'characters', index: 1 })
		expect(inserted.characters).toEqual([A, C, B])
		expect(inserted.sparked).toEqual([{ column: 'characters', index: 2 }])
		// Past the end appends; a character can go straight to gold moons
		expect(insertItem(start, C, { column: 'moons', index: 9 }).moons).toEqual([C])
		// Ids must suit the column
		expect(insertItem(start, S, { column: 'characters', index: 0 })).toBe(start)
	})

	it('keeps the sparked mark on its item as others are removed', () => {
		const start = spark({ characters: [A, B, C], sparked: [{ column: 'characters', index: 2 }] })
		expect(removeItem(start, 'characters', 0).sparked).toEqual([{ column: 'characters', index: 1 }])
		expect(removeItem(start, 'characters', 2).sparked).toEqual([])
	})

	it('reorders within a column, keeping the sparked mark on its item', () => {
		const start = spark({ characters: [A, B, C], sparked: [{ column: 'characters', index: 0 }] })
		const moved = moveItem(
			start,
			{ column: 'characters', index: 0 },
			{ column: 'characters', index: 2 }
		)
		expect(moved.characters).toEqual([B, C, A])
		expect(moved.sparked).toEqual([{ column: 'characters', index: 2 }])

		const other = moveItem(
			start,
			{ column: 'characters', index: 2 },
			{ column: 'characters', index: 1 }
		)
		expect(other.characters).toEqual([A, C, B])
		expect(other.sparked).toEqual([{ column: 'characters', index: 0 }])
	})

	it('moves characters between new characters and gold moons', () => {
		const start = spark({
			characters: [A, B],
			moons: [C],
			sparked: [{ column: 'characters', index: 1 }]
		})
		const moved = moveItem(start, { column: 'characters', index: 1 }, { column: 'moons', index: 0 })
		expect(moved.characters).toEqual([A])
		expect(moved.moons).toEqual([B, C])
		expect(moved.sparked).toEqual([{ column: 'moons', index: 0 }])

		// Past the end appends
		const appended = moveItem(
			start,
			{ column: 'characters', index: 0 },
			{ column: 'moons', index: 9 }
		)
		expect(appended.moons).toEqual([C, A])
		expect(appended.sparked).toEqual([{ column: 'characters', index: 0 }])
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
		expect(marked.sparked).toEqual([{ column: 'summons', index: 0 }])
		expect(toggleSparked(marked, 'summons', 0).sparked).toEqual([])
	})
})

describe('several sparked items', () => {
	const two = spark({
		characters: [A, B, C],
		moons: [C],
		sparked: [
			{ column: 'moons', index: 0 },
			{ column: 'characters', index: 1 }
		]
	})

	it('writes and reads every mark, in column order', () => {
		const query = writeSpark(two)
		expect(query).toContain('spark=c1,m0')
		expect(readSpark(new URLSearchParams(query)).sparked).toEqual([
			{ column: 'characters', index: 1 },
			{ column: 'moons', index: 0 }
		])
	})

	it('still reads a link with one mark', () => {
		const read = readSpark(new URLSearchParams({ c: `${A},${B}`, spark: 'c1' }))
		expect(read.sparked).toEqual([{ column: 'characters', index: 1 }])
	})

	it('drops bad and repeated marks from a link', () => {
		const read = readSpark(new URLSearchParams({ c: `${A},${B}`, spark: 'c1,c1,c9,x0,m0' }))
		expect(read.sparked).toEqual([{ column: 'characters', index: 1 }])
	})

	it('adds a mark without clearing the others, and removes just one', () => {
		const three = toggleSparked(two, 'characters', 2)
		expect(three.sparked).toHaveLength(3)
		expect(toggleSparked(three, 'characters', 1).sparked).toEqual([
			{ column: 'characters', index: 2 },
			{ column: 'moons', index: 0 }
		])
	})

	it('keeps every mark on its item through removes and moves', () => {
		expect(removeItem(two, 'characters', 0).sparked).toEqual([
			{ column: 'characters', index: 0 },
			{ column: 'moons', index: 0 }
		])
		// The sparked moon moves to the front of the new characters
		const moved = moveItem(two, { column: 'moons', index: 0 }, { column: 'characters', index: 0 })
		expect(moved.sparked).toEqual([
			{ column: 'characters', index: 0 },
			{ column: 'characters', index: 2 }
		])
	})
})

describe('resolveSpark', () => {
	it('drops unknown ids and keeps the mark on its item', () => {
		const items = new Map([
			[A, { granblue_id: A } as CatalogueItem],
			[C, { granblue_id: C } as CatalogueItem]
		])
		const { spark: cleaned, data } = resolveSpark(
			spark({ characters: [A, B, C], sparked: [{ column: 'characters', index: 2 }] }),
			items
		)
		expect(cleaned.characters).toEqual([A, C])
		expect(cleaned.sparked).toEqual([{ column: 'characters', index: 1 }])
		expect(data.columns.characters.map((item) => item.granblue_id)).toEqual([A, C])
	})
})

describe('newCollectionCharacters', () => {
	const recruit = (granblueId: string, id: string, recruits: string) =>
		[granblueId, { granblue_id: granblueId, recruits: { id, granblue_id: recruits } }] as [
			string,
			CatalogueItem
		]
	const items = new Map([
		recruit(A, 'char-a', '3040000100'),
		recruit(B, 'char-b', '3040000200'),
		recruit(C, 'char-c', '3040000300'),
		[S, { granblue_id: S } as CatalogueItem]
	])

	it('lists new characters the player does not own, once each', () => {
		const owned = new Set(['3040000200'])
		expect(
			newCollectionCharacters(spark({ characters: [A, B, A], moons: [C] }), items, owned)
		).toEqual(['char-a'])
	})

	it('skips items without a recruited character', () => {
		expect(newCollectionCharacters(spark({ characters: [S] }), items, new Set())).toEqual([])
	})
})

describe('layoutSpark', () => {
	const box = {
		width: 1152,
		columnGap: 16,
		columnPadding: 12,
		tileGap: 6,
		aspect: 280 / 160
	}
	const counts = (characters: number, moons: number, summons: number) => ({
		characters,
		moons,
		summons
	})

	it('fills each column with two tiles, padded evenly', () => {
		const layout = layoutSpark(counts(1, 0, 1), box)
		expect(layout.columnWidth).toBe(373)
		expect(layout.tileWidth).toBe(171)
		// What's left beside the tiles is the column's padding, give or take rounding
		const side = (layout.columnWidth - TILES_PER_ROW * layout.tileWidth - box.tileGap) / 2
		expect(side).toBeGreaterThanOrEqual(box.columnPadding)
		expect(side).toBeLessThan(box.columnPadding + 1)
	})

	it('keeps the tile size and grows with the fullest column', () => {
		const few = layoutSpark(counts(2, 2, 0), box)
		const many = layoutSpark(counts(2, 10, 0), box)
		expect(many.tileWidth).toBe(few.tileWidth)
		const tileHeight = few.tileWidth / box.aspect
		expect(few.tilesHeight).toBeCloseTo(tileHeight)
		expect(many.tilesHeight).toBeCloseTo(5 * tileHeight + 4 * box.tileGap)
	})

	it('counts an empty spark as one row', () => {
		expect(layoutSpark(counts(0, 0, 0), box).tilesHeight).toBeCloseTo(171 / box.aspect)
	})
})
