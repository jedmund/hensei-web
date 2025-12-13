import type { Weapon } from '$lib/types/api/entities';
import type { GridWeapon } from '$lib/types/api/party';

/** Mock weapon data for Storybook stories */
export const mockWeapon: Weapon = {
	id: 'weapon-1',
	granblueId: '1040000000',
	name: { en: 'Luminiera Sword Omega', ja: 'シュヴァリエソード・マグナ' },
	element: 6, // Light
	rarity: 3, // SSR
	series: 1, // Omega
	proficiency: 1, // Sword
	uncap: { flb: true, ulb: true, transcendence: true }
};

export const mockOpusWeapon: Weapon = {
	id: 'weapon-opus',
	granblueId: '1040900000',
	name: { en: 'Cosmic Sword', ja: 'コスミックソード' },
	element: 6,
	rarity: 3,
	series: 2, // Opus
	proficiency: 1,
	uncap: { flb: true, ulb: true, transcendence: true }
};

export const mockDraconicWeapon: Weapon = {
	id: 'weapon-draconic',
	granblueId: '1040800000',
	name: { en: 'Draconic Harp', ja: 'ドラゴニックハープ' },
	element: 1, // Wind
	rarity: 3,
	series: 3, // Draconic
	proficiency: 4, // Harp
	uncap: { flb: true, ulb: true, transcendence: false }
};

export const mockGridWeapon: GridWeapon = {
	id: 'grid-weapon-1',
	position: 0,
	uncapLevel: 5,
	transcendenceStep: 0,
	mainhand: false,
	weapon: mockWeapon,
	awakening: null,
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
	awakening: { id: 'awk-1', type: { slug: 'attack', name: { en: 'Attack', ja: '攻撃' } } },
	weaponKeys: [],
	ax: []
};

/** Weapons organized by element */
export const mockWeaponsByElement = {
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
