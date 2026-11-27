import { describe, expect, it } from 'vitest'
import { inPool, poolTakesSeason } from '../pools'
import type { CatalogueItem } from '$lib/types/gacha'

const item = (promotions: number[]) => ({ promotions }) as CatalogueItem

describe('inPool', () => {
	it('shows everything without a pool or season', () => {
		expect(inPool(item([2]), null)).toBe(true)
		expect(inPool(item([2]), 'nonsense')).toBe(true)
	})

	it('puts ordinary Premium items in every pool but Classic', () => {
		const ordinary = item([1])
		for (const pool of ['premium', 'flash', 'legend', 'collab']) {
			expect(inPool(ordinary, pool)).toBe(true)
		}
		expect(inPool(ordinary, 'classic')).toBe(false)
	})

	it('keeps limited items to their own pool', () => {
		const flashLimited = item([4])
		expect(inPool(flashLimited, 'flash')).toBe(true)
		expect(inPool(flashLimited, 'legend')).toBe(false)
		expect(inPool(flashLimited, 'premium')).toBe(false)
	})

	it('adds a season’s limited items to its pool', () => {
		const summer = item([7])
		expect(inPool(summer, 'premium', 'summer')).toBe(true)
		expect(inPool(summer, 'flash', 'summer')).toBe(true)
		expect(inPool(summer, 'premium', 'halloween')).toBe(false)
		expect(inPool(summer, 'premium')).toBe(false)
		// A season alone is the Premium pool's season
		expect(inPool(summer, null, 'summer')).toBe(true)
		expect(inPool(item([4]), null, 'summer')).toBe(false)
	})

	it('holds only its own items in a Classic pool, with no season', () => {
		expect(inPool(item([12]), 'classic_iii')).toBe(true)
		expect(inPool(item([1, 3]), 'classic_ii')).toBe(true)
		expect(inPool(item([1, 3]), 'classic')).toBe(false)
		expect(inPool(item([7]), 'classic', 'summer')).toBe(false)
	})

	it('offers seasons on Premium-type pools only', () => {
		expect(poolTakesSeason(null)).toBe(true)
		expect(poolTakesSeason('legend')).toBe(true)
		expect(poolTakesSeason('collab')).toBe(false)
		expect(poolTakesSeason('classic_ii')).toBe(false)
	})
})
