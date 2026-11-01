/**
 * Full records for the six weapons in `detail-baseline.json`: the Info tab
 * text the hand-written detail showed for each (captured 2026-11-01 from the
 * local API on prod-copy data). Rebuilt from that text: fields the detail
 * doesn't show are left out.
 */
import type { Weapon } from '$lib/api/adapters/weapon.adapter'
import type { WeaponSeriesRef } from '$lib/types/api/weaponSeries'

const series = (name: string, variant?: { id: string; name: string }) =>
	({
		id: `series-${name}`,
		slug: name.toLowerCase().replace(/ /g, '-'),
		name: { en: name, ja: '' },
		weaponSeriesVariantId: variant?.id ?? null,
		weaponSeriesVariantName: variant?.name ?? null
	}) as unknown as WeaponSeriesRef

const awakening = (slug: string, name: string, order: number) => ({
	id: `awakening-${slug}`,
	slug,
	name: { en: name, ja: '' },
	order,
	level: 1
})

const allLinks = {
	wiki: { en: 'Page', ja: 'ページ' },
	gamewith: '519325',
	kamigame: '武器'
}

/** Typed as a full record, with the fields only the full view sends */
const weapon = (w: Weapon & Record<string, unknown>) => w

export const detailRecords = {
	plain: weapon({
		id: 'w-plain',
		granblueId: '1030102700',
		name: { en: 'Sunset Dagger', ja: '紅陽刃' },
		rarity: 2,
		element: 1,
		proficiency: 2,
		series: series('Gacha Weapons'),
		promotions: [],
		uncap: { flb: false, ulb: false, transcendence: false, extraPrerequisite: null },
		extra: false,
		limit: 0,
		hp: { minHp: 21, maxHp: 131 },
		atk: { minAtk: 205, maxAtk: 1305 },
		maxLevel: 75,
		maxSkillLevel: 10,
		releaseDate: '2014-03-10',
		wiki: { en: 'Sunset_Dagger' }
	}),
	sparse: weapon({
		id: 'w-sparse',
		granblueId: '1030007400',
		name: { en: 'Kilij' },
		rarity: 2,
		element: 4,
		proficiency: 1,
		series: null,
		promotions: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
		recruits: { id: 'c-juri', granblueId: '3030158000', name: { en: 'Juri', ja: 'ジュリ' } },
		uncap: { flb: false, ulb: false, transcendence: false },
		extra: false,
		hp: {},
		atk: {},
		maxLevel: 75,
		maxSkillLevel: 10,
		releaseDate: '2018-09-30',
		wiki: { en: 'Kilij' }
	}),
	gunNull: weapon({
		id: 'w-gun-null',
		granblueId: '1040620200',
		name: { en: 'Iron Fist of Severed Chains', ja: '鎖断鉄鋼拳' },
		rarity: 3,
		element: 0,
		proficiency: 7,
		series: series('Class Champion Weapons', { id: 'variant-forged', name: 'Forged' }),
		elementVariantIds: {
			'1': '1040620200',
			'2': '1040620300',
			'3': '1040620400',
			'4': '1040620500',
			'5': '1040620600',
			'6': '1040620700'
		},
		uncap: { flb: true, ulb: true, transcendence: false },
		extra: false,
		limit: 0,
		hp: { minHp: 37, maxHp: 225, maxHpFlb: 272, maxHpUlb: 319 },
		atk: { minAtk: 416, maxAtk: 2566, maxAtkFlb: 3104, maxAtkUlb: 3642 },
		maxLevel: 200,
		maxSkillLevel: 20,
		maxAwakeningLevel: 15,
		awakenings: [awakening('defense', 'Defense', 2), awakening('attack', 'Attack', 1)],
		releaseDate: '2025-07-22',
		...allLinks
	}),
	awake: weapon({
		id: 'w-awake',
		granblueId: '1040120100',
		name: { en: 'Twinfall-Sky Blade', ja: '双葬・落天刃' },
		rarity: 3,
		element: 5,
		proficiency: 2,
		series: series('Celestial Weapons'),
		uncap: { flb: true, ulb: true, transcendence: false, extraPrerequisite: 5 },
		extra: true,
		limit: 1,
		hp: { minHp: 44, maxHp: 260, maxHpFlb: 314, maxHpUlb: 368 },
		atk: { minAtk: 409, maxAtk: 2571, maxAtkFlb: 3112, maxAtkUlb: 3653 },
		maxLevel: 200,
		maxSkillLevel: 20,
		maxAwakeningLevel: 5,
		awakenings: [
			awakening('attack', 'Attack', 1),
			awakening('ca', 'C.A.', 2),
			awakening('skill-dmg', 'Skill DMG', 3)
		],
		releaseDate: '2024-09-07',
		flbDate: '2024-09-07',
		ulbDate: '2025-11-21',
		...allLinks
	}),
	forge: weapon({
		id: 'w-forge',
		granblueId: '1040904400',
		name: { en: 'Blade of Bahamut Coda', ja: 'バハムートブレイド・フツルス' },
		rarity: 3,
		element: 6,
		proficiency: 1,
		series: series('Bahamut Weapons'),
		uncap: { flb: true, ulb: true, transcendence: false, extraPrerequisite: 5 },
		extra: true,
		limit: 1,
		hp: { minHp: 26, maxHp: 179, maxHpFlb: 209, maxHpUlb: 239 },
		atk: { minAtk: 440, maxAtk: 2620, maxAtkFlb: 3060, maxAtkUlb: 3500 },
		maxLevel: 200,
		maxSkillLevel: 20,
		maxAwakeningLevel: 0,
		forgeChain: [
			{ id: 'f0', granblueId: '1040900400', name: { en: 'Blade of Bahamut' }, forgeOrder: 0 },
			{ id: 'f1', granblueId: '1040902400', name: { en: 'Blade of Bahamut Nova' }, forgeOrder: 1 },
			{ id: 'f2', granblueId: '1040904400', name: { en: 'Blade of Bahamut Coda' }, forgeOrder: 2 }
		],
		forgedFrom: { id: 'f1', granblueId: '1040902400', name: { en: 'Blade of Bahamut Nova' } },
		forgeOrder: 2,
		releaseDate: '2014-03-10',
		ulbDate: '2021-12-03',
		wiki: { en: 'Blade_of_Bahamut_Coda' }
	}),
	transc: weapon({
		id: 'w-transc',
		granblueId: '1040017000',
		name: { en: 'Sword of Repudiation', ja: '絶対否定の剣' },
		rarity: 3,
		element: 6,
		proficiency: 2,
		series: series('Dark Opus Weapons'),
		uncap: { flb: true, ulb: true, transcendence: true },
		extra: false,
		limit: 1,
		hp: { minHp: 36, maxHp: 222, maxHpFlb: 269, maxHpUlb: 316 },
		atk: { minAtk: 420, maxAtk: 2580, maxAtkFlb: 3120, maxAtkUlb: 3660 },
		maxLevel: 200,
		maxSkillLevel: 20,
		releaseDate: '2019-04-11',
		flbDate: '2019-04-11',
		ulbDate: '2019-04-11',
		transcendenceDate: '2024-01-15',
		...allLinks
	})
}
