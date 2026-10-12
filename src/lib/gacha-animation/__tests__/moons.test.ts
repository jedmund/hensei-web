import { describe, it, expect } from 'vitest'
import { drawMoons, goldMoonCount } from '../moons'
import type { CatalogueItem } from '$lib/types/gacha'

const item = (identity: string, rarity: number, character?: string, count?: string) =>
	({
		identity,
		rarity,
		recruits: character ? { granblue_id: character, en: '', ja: '' } : null,
		...(count ? { count } : {})
	}) as CatalogueItem

describe('drawMoons', () => {
	it('gives a moon by rarity for owned characters and repeats in the draw', () => {
		const items = [
			item('ssr-owned', 3, 'c1'),
			item('sr-owned', 2, 'c2'),
			item('r-new', 1, 'c3'),
			item('r-again', 1, 'c3'),
			item('weapon', 3)
		]
		const { moons, newCharacters } = drawMoons(items, new Set(['c1', 'c2']))
		expect(moons).toEqual([3, 2, 0, 1, 0])
		expect([...newCharacters]).toEqual(['r-new'])
	})

	it('signed out, only repeats give moons and nothing counts as new', () => {
		const items = [item('a', 3, 'c1'), item('b', 3, 'c1')]
		const { moons, newCharacters } = drawMoons(items)
		expect(moons).toEqual([0, 3])
		expect(newCharacters.size).toBe(0)
	})
})

describe('goldMoonCount', () => {
	it('counts every copy of owned SSR characters and repeats of the rest', () => {
		const items = [
			item('owned', 3, 'c1', '2'),
			item('new', 3, 'c2', '3'),
			item('sr', 2, 'c3', '4'),
			item('weapon', 3, undefined, '5')
		]
		expect(goldMoonCount(items, new Set(['c1']))).toBe(4)
		expect(goldMoonCount(items)).toBe(3)
	})
})
