import { describe, it, expect } from 'vitest'
import { scene1Params, scene2Params } from '../scene'
import type { Presentation } from '../presentation'
import type { CatalogueItem } from '$lib/types/gacha'

const item = (identity: string, rarity: number, type: 'Weapon' | 'Summon', element: number) =>
	({
		identity,
		drawable_type: type,
		drawable_id: identity,
		granblue_id: '1040000000',
		name: { en: identity, ja: identity },
		rarity,
		element
	}) as CatalogueItem

const items = [item('a', 3, 'Weapon', 2), item('b', 2, 'Summon', 1), item('c', 1, 'Weapon', 6)]
const presentation: Presentation = {
	crystal: 'gold',
	pattern: { main: 6, sub: 1, add: 0 },
	fakeOut: false,
	burst: true,
	stones: [
		{ rarity: 'SSR', startsAs: 'SR' },
		{ rarity: 'SR', startsAs: 'SR' },
		{ rarity: 'R', startsAs: 'R' }
	],
	newCharacters: []
}

describe('scene1Params', () => {
	it("passes the pattern, rarities and class-ups in the game's codes", () => {
		expect(scene1Params(items, presentation)).toMatchObject({
			cjs_gacha_num: 3,
			main_pattern: 6,
			sub_pattern: 1,
			add_pattern: 0,
			gacha_rare_array: [4, 3, 2],
			gacha_rare_classup_array: [2, 0, 0]
		})
	})
})

describe('scene2Params', () => {
	it('describes each item: type, attribute and name', () => {
		const params = scene2Params(items, presentation, ['A', 'B', 'C'], true)
		expect(params).toMatchObject({
			gacha_type_array: [1, 2, 1],
			gacha_attribute_array: [1, 4, 5],
			gacha_text1: ['A', 'B', 'C'],
			gacha_scene1_skip_flg: true,
			cjs_gacha_demo_num: 0,
			gacha_pickup_demo_array: [0, 0, 0]
		})
	})
})
