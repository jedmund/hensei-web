import { describe, it, expect } from 'vitest'
import { choosePresentation, CLASS_UP_CHANCE, FAKE_OUT_CHANCE, seededRandom } from '../presentation'
import type { CatalogueItem } from '$lib/types/gacha'

const item = (identity: string, rarity: number): CatalogueItem =>
	({
		identity,
		drawable_type: 'Weapon',
		drawable_id: identity,
		granblue_id: '1040000000',
		name: { en: identity, ja: identity },
		rarity,
		element: 1
	}) as CatalogueItem

/** A 10-draw: the given rarities, then R to fill */
const draw = (...rarities: number[]) =>
	Array.from({ length: 10 }, (_, i) => item(`Weapon:${i}`, rarities[i] ?? 1))

const seeds = (count: number) => Array.from({ length: count }, (_, i) => `seed-${i}`)

describe('seededRandom', () => {
	it('repeats for the same seed and stays in [0, 1)', () => {
		const a = seededRandom('abc')
		const b = seededRandom('abc')
		const values = Array.from({ length: 50 }, () => a())
		expect(values).toEqual(Array.from({ length: 50 }, () => b()))
		expect(values.every((v) => v >= 0 && v < 1)).toBe(true)
		expect(seededRandom('abd')()).not.toBe(values[0])
	})
})

describe('choosePresentation', () => {
	it('is the same for the same draw and seed', () => {
		const items = draw(3, 2)
		expect(choosePresentation(items, 'x')).toEqual(choosePresentation(items, 'x'))
	})

	it('opens on rainbow for several SSRs or a new character', () => {
		expect(choosePresentation(draw(3, 3, 2), 'x').crystal).toBe('rainbow')
		const items = draw(2, 2)
		const withNew = choosePresentation(items, 'x', { newCharacters: new Set(['Weapon:1']) })
		expect(withNew.crystal).toBe('rainbow')
		expect(withNew.newCharacters).toEqual([1])
	})

	it('opens on gold for one SSR, sometimes faking out with blue', () => {
		const results = seeds(2000).map((seed) => choosePresentation(draw(3, 2), seed))
		expect(new Set(results.map((r) => r.crystal))).toEqual(new Set(['gold', 'blue']))
		expect(results.every((r) => r.fakeOut === (r.crystal === 'blue'))).toBe(true)
		const rate = results.filter((r) => r.fakeOut).length / results.length
		expect(rate).toBeGreaterThan(FAKE_OUT_CHANCE * 0.7)
		expect(rate).toBeLessThan(FAKE_OUT_CHANCE * 1.3)
	})

	it('opens on blue-violet without an SSR, with no burst', () => {
		for (const seed of seeds(200)) {
			const result = choosePresentation(draw(2), seed)
			expect(result.crystal).toBe('violet')
			expect(result.pattern).toEqual({ main: 7, sub: 0, add: 0 })
			expect(result.burst).toBe(false)
		}
	})

	it("plays a game pattern that matches the crystal's colour", () => {
		const mains = { rainbow: [2, 3, 4, 5], gold: [6], violet: [7], blue: [8] }
		for (const seed of seeds(500)) {
			for (const items of [draw(3, 3), draw(3, 2), draw(2)]) {
				const { crystal, pattern, burst } = choosePresentation(items, seed)
				expect(mains[crystal]).toContain(pattern.main)
				expect(pattern.add).toBe(0)
				if (crystal === 'gold') expect(pattern.sub).toBe(burst ? 1 : 0)
				if (crystal !== 'gold') expect(burst).toBe(false)
			}
		}
	})

	it('classes up only SR and SSR stones, one rarity lower', () => {
		const results = seeds(2000).map((seed) => choosePresentation(draw(3, 2), seed))
		for (const { stones } of results) {
			expect(stones).toHaveLength(10)
			expect(stones[0]?.startsAs).toMatch(/^(SSR|SR)$/)
			expect(stones[1]?.startsAs).toMatch(/^(SR|R)$/)
			expect(stones.slice(2).every((s) => s.rarity === 'R' && s.startsAs === 'R')).toBe(true)
		}
		const rate = results.filter((r) => r.stones[1]?.startsAs === 'R').length / results.length
		expect(rate).toBeGreaterThan(CLASS_UP_CHANCE * 0.7)
		expect(rate).toBeLessThan(CLASS_UP_CHANCE * 1.3)
	})
})
