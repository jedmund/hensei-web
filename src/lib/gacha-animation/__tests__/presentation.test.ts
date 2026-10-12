import { describe, it, expect } from 'vitest'
import {
	choosePresentation,
	CLASS_UP_CHANCE,
	FAKE_OUT_CHANCE,
	NEW_ITEM_RAINBOW_CHANCE,
	SHRINE_SINCE,
	SINGLE_SSR_RAINBOW_CHANCE,
	seededRandom
} from '../presentation'
import type { CatalogueItem } from '$lib/types/gacha'

const item = (identity: string, rarity: number, release_date = '2020-01-01'): CatalogueItem =>
	({
		release_date,
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

	it('opens on rainbow for several SSRs, and never without an SSR', () => {
		for (const seed of seeds(200)) {
			expect(choosePresentation(draw(3, 3, 2), seed).crystal).toBe('rainbow')
			expect(choosePresentation(draw(2), seed).crystal).not.toBe('rainbow')
		}
		const withNew = choosePresentation(draw(3, 2), 'x', {
			newCharacters: new Set(['Weapon:0'])
		})
		expect(withNew.newCharacters).toEqual([0])
	})

	it('sometimes opens a single SSR on Rainbow 5', () => {
		const results = seeds(4000).map((seed) => choosePresentation(draw(3, 2), seed))
		const rainbows = results.filter((r) => r.crystal === 'rainbow')
		expect(rainbows.every((r) => r.pattern.main === 5)).toBe(true)
		const rate = rainbows.length / results.length
		expect(rate).toBeGreaterThan(SINGLE_SSR_RAINBOW_CHANCE * 0.7)
		expect(rate).toBeLessThan(SINGLE_SSR_RAINBOW_CHANCE * 1.3)
	})

	const key = (p: { main: number; sub: number; add: number }) => `${p.main}/${p.sub}/${p.add}`
	const patterns = (items: CatalogueItem[], options: Parameters<typeof choosePresentation>[2]) =>
		seeds(2000).map((seed) => key(choosePresentation(items, seed, options).pattern))
	const share = (keys: string[], wanted: string) =>
		keys.filter((k) => k === wanted).length / keys.length

	it.each([
		['a new summon', 3, '2/0/3', { newSummons: new Set(['Weapon:0']) }, '2020-01-01'],
		['a new older character', 4, '2/0/4', { newCharacters: new Set(['Weapon:0']) }, '2020-01-01'],
		['a new shrine character', 1, '2/0/1', { newCharacters: new Set(['Weapon:0']) }, SHRINE_SINCE]
	] as const)('plays the opening for %s', (_, single, several, options, released) => {
		const one = [item('Weapon:0', 3, released), ...draw(2).slice(1)]
		const singles = patterns(one, options)
		expect(new Set(singles)).toEqual(
			new Set([`${single}/0/0`, '5/0/0', '6/0/0', '6/1/0', '8/0/0', '8/1/0'])
		)
		expect(share(singles, `${single}/0/0`)).toBeGreaterThan(NEW_ITEM_RAINBOW_CHANCE * 0.85)
		expect(share(singles, `${single}/0/0`)).toBeLessThan(NEW_ITEM_RAINBOW_CHANCE * 1.15)

		const two = [one[0] as CatalogueItem, ...draw(1, 3).slice(1)]
		const multis = patterns(two, options)
		expect(new Set(multis)).toEqual(new Set([several, '2/0/0']))
		expect(share(multis, several)).toBeGreaterThan(NEW_ITEM_RAINBOW_CHANCE * 0.85)
		expect(share(multis, several)).toBeLessThan(NEW_ITEM_RAINBOW_CHANCE * 1.15)
	})

	it('only counts new SSRs, and gives new characters the first chance', () => {
		const notSsr = patterns(draw(3, 2), {
			newSummons: new Set(['Weapon:1']),
			newCharacters: new Set(['Weapon:2'])
		})
		expect(notSsr.some((k) => ['3/0/0', '4/0/0', '1/0/0'].includes(k))).toBe(false)

		const both = patterns(draw(3, 3), {
			newCharacters: new Set(['Weapon:0']),
			newSummons: new Set(['Weapon:1'])
		})
		expect(share(both, '2/0/4')).toBeGreaterThan(NEW_ITEM_RAINBOW_CHANCE * 0.85)
		// The summon's opening only gets a chance when the character's doesn't play
		const summonShare = (1 - NEW_ITEM_RAINBOW_CHANCE) * NEW_ITEM_RAINBOW_CHANCE
		expect(share(both, '2/0/3')).toBeGreaterThan(summonShare * 0.8)
		expect(share(both, '2/0/3')).toBeLessThan(summonShare * 1.2)
	})

	it('plays plain Rainbow 2 for several SSRs with nothing new', () => {
		expect(new Set(patterns(draw(3, 3), {}))).toEqual(new Set(['2/0/0']))
	})

	it('opens on gold for one SSR, sometimes faking out with blue', () => {
		const results = seeds(2000)
			.map((seed) => choosePresentation(draw(3, 2), seed))
			.filter((r) => r.crystal !== 'rainbow')
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
		const mains = { rainbow: [2, 5], gold: [6], violet: [7], blue: [8] }
		for (const seed of seeds(500)) {
			for (const items of [draw(3, 3), draw(3, 2), draw(2)]) {
				const { crystal, pattern, burst } = choosePresentation(items, seed)
				expect(mains[crystal]).toContain(pattern.main)
				if (crystal !== 'rainbow') expect(pattern.add).toBe(0)
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
