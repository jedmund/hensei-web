/**
 * Typed mock data for Wonders, shaped like the GBF-282 contract's
 * `GET /wonders` and owned rows. Names and text come from the EN and JA
 * captures of `/item/memorial_list/1`.
 */

import type {
	OwnedWonder,
	Wonder,
	WonderCatalogue,
	WonderCategory,
	WonderLevelBonus,
	WonderStat,
	WonderStatElement
} from '$lib/types/api/wonder'

export const categories: WonderCategory[] = [
	{
		id: 'cat-1',
		granblueId: '1',
		name: { en: 'Girl in Blue', ja: '第1部 蒼の少女' },
		categoryType: 1,
		sortOrder: 1
	},
	{
		id: 'cat-4',
		granblueId: '4',
		name: { en: 'Crucible Seal', ja: '神滅の印章' },
		categoryType: 2,
		sortOrder: 4
	},
	{
		id: 'cat-5',
		granblueId: '5',
		name: { en: 'Other', ja: 'その他' },
		categoryType: 2,
		sortOrder: 5
	},
	{
		id: 'cat-6',
		granblueId: '6',
		name: { en: 'Cardinal Saint Yupei', ja: '四聖の玲瓏佩' },
		categoryType: 3,
		sortOrder: 6
	},
	{
		id: 'cat-8',
		granblueId: '8',
		name: { en: 'Rings of Fate', ja: '運命の契環' },
		categoryType: 2,
		sortOrder: 8
	}
]

const SEAL_TABLE: [string, number][] = [
	['res', 5],
	['def', 3],
	['double_attack_rate', 3],
	['healing_cap', 3],
	['debuff_resistance', 3],
	['def', 3],
	['triple_attack_rate', 3],
	['healing_cap', 3],
	['debuff_resistance', 3],
	['debuff_success_rate', 5],
	['def', 3],
	['healing_cap', 3],
	['double_attack_rate', 3],
	['debuff_resistance', 3],
	['triple_attack_rate', 2],
	['debuff_resistance', 1],
	['def', 3],
	['healing_cap', 3],
	['triple_attack_rate', 2],
	['res', 5]
]

function sealBonuses(resistance: WonderStatElement): WonderLevelBonus[] {
	return SEAL_TABLE.map(([stat, value], i) => ({
		level: i + 1,
		stat: (stat === 'res' ? `${resistance}_resistance` : stat) as WonderStat,
		value
	}))
}

function yupeiBonuses(element: WonderStatElement, vs: WonderStatElement): WonderLevelBonus[] {
	const stats: WonderStat[] = [
		`${element}_atk`,
		'def',
		'skill_dmg',
		'ca_dmg',
		`${element}_atk`,
		'def',
		`dmg_amplify_vs_${vs}`,
		'na_dmg_cap',
		'skill_dmg_cap',
		'ca_dmg_cap'
	]
	return stats.map((stat, i) => ({ level: i + 1, stat, value: 5 }))
}

const SEAL_CAPS = [
	{ evolution: 0, maxLevel: 10 },
	{ evolution: 1, maxLevel: 15 },
	{ evolution: 2, maxLevel: 18 },
	{ evolution: 3, maxLevel: 20 }
]

function wonder(overrides: Partial<Wonder> & Pick<Wonder, 'id' | 'granblueId' | 'name'>): Wonder {
	return {
		categoryId: 'cat-5',
		description: { en: null, ja: null },
		kind: 'fixed',
		element: null,
		maxLevel: null,
		maxEvolution: null,
		battleRelevant: false,
		hiddenInUniteAndFight: false,
		requiredCharacterIds: [],
		sortOrder: 1,
		effects: [],
		levelBonuses: [],
		evolutionCaps: [],
		...overrides
	}
}

export const tiamat = wonder({
	id: 'w-1',
	granblueId: '1',
	categoryId: 'cat-1',
	name: { en: 'Morning Calm of Tiamat', ja: 'ティアマトの朝凪' },
	description: { en: 'Earned in victory against Tiamat.', ja: null },
	effects: [{ actionId: 100001, position: 1, text: { en: 'Gives a 10% boost to RP.', ja: null } }]
})

export const fireSeal = wonder({
	id: 'w-9009',
	granblueId: '9009',
	categoryId: 'cat-4',
	name: { en: 'Seal of the Blazing Bodhisattva', ja: '赫焔灯す菩薩の印章' },
	kind: 'leveled',
	element: 1,
	maxLevel: 20,
	maxEvolution: 3,
	battleRelevant: true,
	hiddenInUniteAndFight: true,
	sortOrder: 1,
	levelBonuses: sealBonuses('wind'),
	evolutionCaps: SEAL_CAPS
})

export const waterSeal = wonder({
	id: 'w-9008',
	granblueId: '9008',
	categoryId: 'cat-4',
	name: { en: 'Seal of the Underworld Emperor', ja: '冥府座す獄帝の印章' },
	kind: 'leveled',
	element: 2,
	maxLevel: 20,
	maxEvolution: 3,
	battleRelevant: true,
	hiddenInUniteAndFight: true,
	sortOrder: 2,
	levelBonuses: sealBonuses('fire'),
	evolutionCaps: SEAL_CAPS
})

export const shield = wonder({
	id: 'w-9003',
	granblueId: '9003',
	name: { en: 'Shield of Eternal Splendor', ja: '十天光輝の楯' },
	battleRelevant: true,
	sortOrder: 1,
	effects: [
		{
			actionId: 109003,
			position: 1,
			text: {
				en: 'Boosts stats and charge bars of Eternals characters at battle start.',
				ja: null
			}
		}
	]
})

export const symbolum = wonder({
	id: 'w-9015',
	granblueId: '9015',
	name: { en: 'Symbolum Amicitiae', ja: 'シンボルム・アミキティアエ' },
	kind: 'scaling',
	maxLevel: 0,
	maxEvolution: 0,
	battleRelevant: true,
	sortOrder: 6
})

export const zhurong = wonder({
	id: 'w-1001',
	granblueId: '1001',
	categoryId: 'cat-6',
	name: { en: "Zhurong's Yupei", ja: '祝融の玲瓏佩' },
	kind: 'leveled',
	element: 1,
	maxLevel: 10,
	maxEvolution: 0,
	battleRelevant: true,
	sortOrder: 1,
	levelBonuses: yupeiBonuses('fire', 'wind')
})

export const ringOfDeath = wonder({
	id: 'w-2003',
	granblueId: '2003',
	categoryId: 'cat-8',
	name: { en: 'Ring of Death', ja: 'リング・オブ・デス' },
	element: 6,
	battleRelevant: true,
	effects: [
		{
			actionId: 120001,
			position: 1,
			text: { en: "Gives a 30% boost to dark allies' HP.", ja: null }
		},
		{
			actionId: 120002,
			position: 2,
			text: { en: "Amplifies dark allies' DMG against light foes by 10%.", ja: null }
		}
	]
})

export const catalogue: WonderCatalogue = {
	categories,
	wonders: [tiamat, fireSeal, waterSeal, shield, symbolum, zhurong, ringOfDeath]
}

export function owned(w: Wonder, overrides: Partial<OwnedWonder> = {}): OwnedWonder {
	return {
		id: `owned-${w.granblueId}`,
		wonderId: w.id,
		granblueId: w.granblueId,
		level: null,
		evolution: null,
		possession: null,
		image: w.granblueId,
		bonuses: [],
		...overrides
	}
}
