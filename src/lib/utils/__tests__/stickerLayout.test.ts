import { describe, expect, it } from 'vitest'
import {
	ROW_GAP,
	ROW_TOP,
	areaHeight,
	clampPoint,
	freeSpot,
	fromFraction,
	layoutStickers,
	minDistance,
	stickerBounds,
	toFraction,
	withinBounds
} from '../stickerLayout'

const SIZE = 60
const NO_INSETS = { left: 0, right: 0, bottom: 0 }

describe('areaHeight', () => {
	it('is one row before the width is known', () => {
		expect(areaHeight(0, 21, SIZE)).toBe(100)
	})

	it('is one row when every sticker fits side by side', () => {
		expect(areaHeight(800, 5, SIZE)).toBe(100)
	})

	it('grows with the rows a popular team needs', () => {
		// 787px fits 13 stickers per row at the minimum distance; 21 need two
		expect(areaHeight(787, 21, SIZE)).toBe(135)
	})
})

describe('stickerBounds', () => {
	it('lets stickers hang half their size past the card, but not above the area', () => {
		const bounds = stickerBounds(400, 100, { left: 16, right: 16, bottom: 8 }, SIZE)
		expect(bounds).toEqual({ minLeft: -46, maxLeft: 386, maxTop: 78 })
	})

	it('never has a maximum left of the minimum', () => {
		const bounds = stickerBounds(0, 100, NO_INSETS, SIZE)
		expect(bounds.maxLeft).toBe(bounds.minLeft)
	})
})

describe('placement fractions', () => {
	const bounds = stickerBounds(400, 100, NO_INSETS, SIZE)

	it('round-trips a left position', () => {
		expect(fromFraction(bounds, toFraction(bounds, 123))).toBeCloseTo(123)
	})

	it('maps the ends of the range to 0 and 1', () => {
		expect(toFraction(bounds, bounds.minLeft)).toBe(0)
		expect(toFraction(bounds, bounds.maxLeft)).toBe(1)
	})
})

describe('clampPoint and withinBounds', () => {
	const bounds = stickerBounds(400, 100, NO_INSETS, SIZE)

	it('keeps a point inside the bounds', () => {
		expect(clampPoint(bounds, -500, -10)).toEqual({ left: bounds.minLeft, top: 0 })
		expect(clampPoint(bounds, 900, 900)).toEqual({ left: bounds.maxLeft, top: bounds.maxTop })
	})

	it('rejects points above the area', () => {
		expect(withinBounds(bounds, SIZE, 100, -1)).toBe(false)
		expect(withinBounds(bounds, SIZE, 100, 10)).toBe(true)
	})
})

describe('layoutStickers', () => {
	const width = 800
	const height = 100
	const bounds = stickerBounds(width, height, NO_INSETS, SIZE)
	const layout = (
		entries: Parameters<typeof layoutStickers>[0]['entries'],
		extra: Partial<Parameters<typeof layoutStickers>[0]> = {}
	) => layoutStickers({ entries, width, height, size: SIZE, bounds, ...extra })

	it('lines up unplaced stickers in a row from the left', () => {
		const result = layout([
			{ key: 'a', placement: null },
			{ key: 'b', placement: null }
		])
		expect(result.get('a')).toMatchObject({ left: 0, top: ROW_TOP, rotation: null })
		expect(result.get('b')).toMatchObject({ left: SIZE + ROW_GAP, top: ROW_TOP })
	})

	it('pushes overlapping stickers apart to the minimum distance', () => {
		const result = layout([
			{ key: 'a', placement: { x: 0.5, y: 20, rotation: 3 } },
			{ key: 'b', placement: { x: 0.5, y: 20, rotation: -3 } }
		])
		const a = result.get('a')!
		const b = result.get('b')!
		expect(Math.hypot(a.left - b.left, a.top - b.top)).toBeGreaterThanOrEqual(
			minDistance(SIZE) - 0.01
		)
		expect(a.rotation).toBe(3)
	})

	it('keeps the anchored sticker where it was placed', () => {
		const placement = { x: 0.5, y: 20, rotation: 0 }
		const result = layout(
			[
				{ key: 'mine', placement },
				{ key: 'other', placement: { x: 0.51, y: 22, rotation: 0 } }
			],
			{ anchored: 'mine' }
		)
		expect(result.get('mine')).toMatchObject({ left: fromFraction(bounds, 0.5), top: 20 })
	})

	it('leaves the excluded sticker out of the spacing', () => {
		const placement = { x: 0.5, y: 20, rotation: 0 }
		const result = layout(
			[
				{ key: 'moving', placement },
				{ key: 'other', placement }
			],
			{ excluded: 'moving' }
		)
		expect(result.get('other')).toMatchObject({ left: fromFraction(bounds, 0.5), top: 20 })
	})

	it('is the same for the same inputs', () => {
		const entries = Array.from({ length: 12 }, (_, i) => ({
			key: String(i),
			placement: { x: (i % 3) / 10, y: 10, rotation: null }
		}))
		expect([...layout(entries).values()]).toEqual([...layout(entries).values()])
	})
})

describe('freeSpot', () => {
	const bounds = stickerBounds(800, 100, NO_INSETS, SIZE)

	it('keeps a spot that is already clear', () => {
		expect(freeSpot([{ left: 0, top: 0 }], bounds, SIZE, 300, 20)).toEqual({ left: 300, top: 20 })
	})

	it('moves off another sticker to the nearest clear spot', () => {
		const other = { left: 300, top: 20 }
		const spot = freeSpot([other], bounds, SIZE, 300, 20)
		expect(Math.hypot(spot.left - other.left, spot.top - other.top)).toBeGreaterThanOrEqual(
			minDistance(SIZE)
		)
		expect(Math.hypot(spot.left - 300, spot.top - 20)).toBeLessThan(minDistance(SIZE) + 6)
	})
})
