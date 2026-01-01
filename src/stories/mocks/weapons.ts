import type { Weapon } from '$lib/types/api/entities';
import type { GridWeapon } from '$lib/types/api/party';

/** Mock weapon series ref */
const mockOmegaSeries = {
	id: 'series-omega',
	slug: 'omega',
	name: { en: 'Omega', ja: 'マグナ' },
	hasWeaponKeys: false,
	hasAwakening: true,
	augmentType: 'ax' as const,
	extra: false,
	elementChangeable: false
};

const mockOpusSeries = {
	id: 'series-opus',
	slug: 'opus',
	name: { en: 'Opus', ja: 'オプス' },
	hasWeaponKeys: true,
	hasAwakening: true,
	augmentType: 'no_augment' as const,
	extra: false,
	elementChangeable: false
};

const mockDraconicSeries = {
	id: 'series-draconic',
	slug: 'draconic',
	name: { en: 'Draconic', ja: 'ドラゴニック' },
	hasWeaponKeys: true,
	hasAwakening: false,
	augmentType: 'no_augment' as const,
	extra: false,
	elementChangeable: false
};

/** Mock weapon data for Storybook stories */
export const mockWeapon: Weapon = {
	id: 'weapon-1',
	granblueId: '1040000000',
	name: { en: 'Luminiera Sword Omega', ja: 'シュヴァリエソード・マグナ' },
	element: 6, // Light
	rarity: 3, // SSR
	maxLevel: 200,
	maxSkillLevel: 20,
	maxAwakeningLevel: 9,
	series: mockOmegaSeries,
	proficiency: 1, // Sword
	ax: false,
	axType: 0,
	uncap: { flb: true, ulb: true, transcendence: true },
	hp: { minHp: 100, maxHp: 200, maxHpFlb: 250, maxHpUlb: 300 },
	atk: { minAtk: 2000, maxAtk: 3500, maxAtkFlb: 4000, maxAtkUlb: 4500 }
};

export const mockOpusWeapon: Weapon = {
	id: 'weapon-opus',
	granblueId: '1040900000',
	name: { en: 'Cosmic Sword', ja: 'コスミックソード' },
	element: 6,
	rarity: 3,
	maxLevel: 250,
	maxSkillLevel: 20,
	maxAwakeningLevel: 9,
	series: mockOpusSeries,
	proficiency: 1,
	ax: false,
	axType: 0,
	uncap: { flb: true, ulb: true, transcendence: true },
	hp: { minHp: 200, maxHp: 400, maxHpFlb: 500, maxHpUlb: 600 },
	atk: { minAtk: 3000, maxAtk: 5000, maxAtkFlb: 6000, maxAtkUlb: 7000 }
};

export const mockDraconicWeapon: Weapon = {
	id: 'weapon-draconic',
	granblueId: '1040800000',
	name: { en: 'Draconic Harp', ja: 'ドラゴニックハープ' },
	element: 1, // Wind
	rarity: 3,
	maxLevel: 200,
	maxSkillLevel: 20,
	maxAwakeningLevel: 9,
	series: mockDraconicSeries,
	proficiency: 4, // Harp
	ax: false,
	axType: 0,
	uncap: { flb: true, ulb: true, transcendence: false },
	hp: { minHp: 150, maxHp: 300, maxHpFlb: 400, maxHpUlb: 500 },
	atk: { minAtk: 2500, maxAtk: 4000, maxAtkFlb: 5000, maxAtkUlb: 5500 }
};

export const mockGridWeapon: GridWeapon = {
	id: 'grid-weapon-1',
	position: 0,
	uncapLevel: 5,
	transcendenceStep: 0,
	mainhand: false,
	weapon: mockWeapon,
	weaponKeys: [],
	ax: []
};

export const mockMainhandWeapon: GridWeapon = {
	id: 'grid-weapon-main',
	position: -1,
	uncapLevel: 6,
	transcendenceStep: 5,
	mainhand: true,
	weapon: mockOpusWeapon,
	awakening: { type: { id: 'awk-1', slug: 'attack', name: { en: 'Attack', ja: '攻撃' } }, level: 9 },
	weaponKeys: [],
	ax: []
};

/** Weapons organized by element */
export const mockWeaponsByElement: Record<string, Weapon> = {
	wind: { ...mockWeapon, id: 'weapon-wind', element: 1, name: { en: 'Tiamat Bolt', ja: 'ティアマトボルト' } },
	fire: {
		...mockWeapon,
		id: 'weapon-fire',
		element: 2,
		name: { en: 'Colossus Cane', ja: 'コロッサスケーン' }
	},
	water: {
		...mockWeapon,
		id: 'weapon-water',
		element: 3,
		name: { en: 'Leviathan Gaze', ja: 'リヴァイアサンゲイズ' }
	},
	earth: {
		...mockWeapon,
		id: 'weapon-earth',
		element: 4,
		name: { en: 'Yggdrasil Bow', ja: 'ユグドラシルボウ' }
	},
	dark: {
		...mockWeapon,
		id: 'weapon-dark',
		element: 5,
		name: { en: 'Celeste Claw', ja: 'セレストクロー' }
	},
	light: { ...mockWeapon, id: 'weapon-light', element: 6, name: { en: 'Luminiera Sword', ja: 'シュヴァリエソード' } }
};
