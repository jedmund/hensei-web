/**
 * Full records for four contrasting characters, shaped like the API's
 * `with_recruitment` view. `detail-baseline.json` holds the Info tab text the
 * hand-written detail (CharacterDetail) drew for each, captured 2026-11-01 by
 * mounting it on these records before it was deleted.
 */
import type { Character } from '$lib/api/adapters/character.adapter'

const series = (slug: string, en: string) => ({
	id: `series-${slug}`,
	slug,
	name: { en, ja: '' }
})

export const detailRecords = {
	// A seasonal SSR: FLB and transcendence, two proficiencies, every link
	transcended: {
		id: 'c-transcended',
		granblueId: '3040169000',
		characterId: [4004],
		name: { en: 'Nier', ja: 'ニーア' },
		rarity: 3,
		element: 6,
		gender: 2,
		proficiency: [9, 2],
		race: [1],
		season: 3,
		series: [series('fantasy', 'Fantasy'), series('summer', 'Summer')],
		seriesNames: ['Fantasy', 'Summer'],
		special: false,
		genderVariants: false,
		styleSwap: false,
		styleName: { en: undefined, ja: undefined },
		baseCharacter: null,
		uncap: { flb: true, ulb: false, transcendence: true, maxTranscendenceStage: 5 },
		hp: { minHp: 290, maxHp: 1450, maxHpFlb: 1750, maxHpTranscendence: 2050 },
		atk: { minAtk: 1650, maxAtk: 8400, maxAtkFlb: 9800, maxAtkTranscendence: 11200 },
		baseDa: 70,
		baseTa: 30,
		ougiRatio: { ougiRatio: 4.5, ougiRatioFlb: 5 },
		recruitedBy: {
			id: 'w-recruit',
			granblueId: '1040315900',
			name: { en: 'Lamia Bow', ja: 'ラミアボウ' },
			promotions: [1, 4],
			promotionNames: ['Premium', 'Flash']
		},
		nicknames: { en: ['Nier Summer'], ja: [] },
		releaseDate: '2019-03-10',
		flbDate: '2021-03-10',
		transcendenceDate: '2024-03-10',
		wiki: { en: 'Nier', ja: 'ニーア' },
		gamewith: '519325',
		kamigame: 'SSR闇ニーア'
	},
	// A story character: special, FLB then ULB, no race
	story: {
		id: 'c-story',
		granblueId: '3030093000',
		characterId: [],
		name: { en: 'Lyria', ja: 'ルリア' },
		rarity: 2,
		element: 0,
		gender: 2,
		proficiency: [5],
		race: [],
		season: null,
		series: [],
		seriesNames: [],
		special: true,
		genderVariants: true,
		styleSwap: false,
		baseCharacter: null,
		uncap: { flb: true, ulb: true, transcendence: false, maxTranscendenceStage: 0 },
		hp: { minHp: 200, maxHp: 1000, maxHpFlb: 1200, maxHpUlb: 1400 },
		atk: { minAtk: 900, maxAtk: 5000, maxAtkFlb: 6000, maxAtkUlb: 7000 },
		baseDa: 7,
		baseTa: 3,
		ougiRatio: { ougiRatio: 3.5, ougiRatioFlb: 4 },
		nicknames: { en: [], ja: [] },
		releaseDate: '2014-03-10',
		flbDate: '2018-03-10',
		ulbDate: '2023-03-10',
		wiki: { en: 'Lyria', ja: '' },
		gamewith: '',
		kamigame: ''
	},
	// A style shift (its own page, but the generated detail can still draw it)
	style: {
		id: 'c-style',
		granblueId: '3040088000',
		characterId: [],
		name: { en: 'Yngwie', ja: 'ユーウィ' },
		rarity: 3,
		element: 3,
		gender: 1,
		proficiency: [7, 0],
		race: [1, 3],
		season: null,
		series: [series('grand', 'Grand')],
		seriesNames: ['Grand'],
		special: false,
		genderVariants: false,
		styleSwap: true,
		styleName: { en: 'Legend of Bravado and Revelry', ja: '無頼と享楽の伝説' },
		baseCharacter: { id: 'c-yngwie', granblueId: '3040088000', name: { en: 'Yngwie', ja: '' } },
		uncap: { flb: false, ulb: false, transcendence: false, maxTranscendenceStage: 0 },
		hp: { minHp: 250, maxHp: 1300 },
		atk: { minAtk: 1500, maxAtk: 8000 },
		baseDa: 6,
		baseTa: 4,
		ougiRatio: { ougiRatio: 4.5 },
		nicknames: { en: [], ja: [] },
		releaseDate: '2025-05-01',
		wiki: { en: 'Yngwie (Style)', ja: '' },
		gamewith: '',
		kamigame: ''
	},
	// Nothing optional filled in
	sparse: {
		id: 'c-sparse',
		granblueId: '3020018000',
		name: { en: 'Rosamia' },
		rarity: 1,
		element: 1,
		proficiency: [1]
	}
} satisfies Record<string, Character & Record<string, unknown>>
