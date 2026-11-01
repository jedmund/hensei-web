/**
 * Full records for three contrasting summons, shaped like the API's `full`
 * view. `detail-baseline.json` holds the Info tab text the hand-written
 * detail (SummonDetail) drew for each, captured 2026-11-01 by mounting it on
 * these records before it was deleted.
 */
import type { Summon } from '$lib/api/adapters/summon.adapter'

const aura = (id: string, slot: 'main' | 'sub', uncapLevel: number, value: number) => ({
	id,
	slot,
	target: 'omega_frame',
	element: null,
	value,
	uncapLevel,
	transcendenceStage: 0,
	condition: null,
	description: { en: `${value}% boost`, ja: null }
})

export const detailRecords = {
	// A transcended SSR in a series: every uncap, a sub aura, auras, every link and date
	transcended: {
		id: 's-transcended',
		granblueId: '2040034000',
		name: { en: 'Colossus Omega', ja: 'コロッサス・マグナ' },
		rarity: 3,
		element: 1,
		maxLevel: 250,
		series: {
			id: 'series-omega',
			slug: 'omega',
			name: { en: 'Omega', ja: 'マグナ' }
		},
		promotions: [1, 4],
		promotionNames: ['Premium', 'Flash'],
		uncap: { flb: true, ulb: true, transcendence: true },
		subaura: true,
		limit: false,
		hp: { minHp: 101, maxHp: 607, maxHpFlb: 707, maxHpUlb: 807, maxHpXlb: 907 },
		atk: { minAtk: 340, maxAtk: 1740, maxAtkFlb: 2040, maxAtkUlb: 2340, maxAtkXlb: 2640 },
		summonAuras: [aura('a-main', 'main', 4, 120), aura('a-sub', 'sub', 5, 10)],
		nicknames: { en: ['Colo', 'Magna'], ja: ['コロマグ'] },
		releaseDate: '2014-03-10',
		flbDate: '2018-03-10',
		ulbDate: '2020-08-08',
		transcendenceDate: '2024-05-02',
		wiki: { en: 'Colossus Omega', ja: 'コロッサス・マグナ' },
		gamewith: '21337',
		kamigame: 'SSR/コロッサス・マグナ'
	},
	// A limited SSR with FLB only and no series
	flb: {
		id: 's-flb',
		granblueId: '2040288000',
		name: { en: 'Morgana Car', ja: 'モルガナカー' },
		rarity: 3,
		element: 3,
		maxLevel: 150,
		series: null,
		promotions: [10],
		promotionNames: ['Collab'],
		uncap: { flb: true, ulb: false, transcendence: false },
		subaura: false,
		limit: true,
		hp: { minHp: 80, maxHp: 400, maxHpFlb: 480 },
		atk: { minAtk: 300, maxAtk: 1500, maxAtkFlb: 1800 },
		summonAuras: [],
		nicknames: { en: [], ja: [] },
		releaseDate: '2018-06-18',
		flbDate: '2018-06-18',
		wiki: { en: 'Morgana Car', ja: '' },
		gamewith: '',
		kamigame: ''
	},
	// An R with nothing filled in beyond the basics
	sparse: {
		id: 's-sparse',
		granblueId: '2020001000',
		name: { en: 'Goblin', ja: undefined },
		rarity: 1,
		element: 4,
		maxLevel: 50,
		series: null,
		promotions: [],
		uncap: { flb: false, ulb: false, transcendence: false },
		subaura: false,
		limit: false,
		hp: {},
		atk: {},
		nicknames: { en: [], ja: [] },
		wiki: { en: '', ja: '' }
	}
} satisfies Record<string, Summon & { maxLevel: number }>
