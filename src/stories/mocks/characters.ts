import type { Character } from '$lib/types/api/entities';
import type { GridCharacter } from '$lib/types/api/party';

/** Mock character data for Storybook stories */
export const mockCharacter: Character = {
	id: 'char-1',
	granblueId: '3040000000',
	name: { en: 'Narmaya', ja: 'ナルメア' },
	element: 5, // Dark
	rarity: 3, // SSR
	maxLevel: 100,
	special: false,
	recruits: null,
	gender: 2, // Female
	race: { race1: 1, race2: 0 }, // Human
	uncap: { flb: true, ulb: true, transcendence: false },
	proficiency: [1, 2], // Sabre, Dagger
	hp: { minHp: 200, maxHp: 1200, maxHpFlb: 1500 },
	atk: { minAtk: 6000, maxAtk: 8500, maxAtkFlb: 10000 }
};

export const mockSpecialCharacter: Character = {
	id: 'char-2',
	granblueId: '3040100000',
	name: { en: 'Cagliostro', ja: 'カリオストロ' },
	element: 4, // Earth
	rarity: 3, // SSR
	maxLevel: 100,
	special: true, // Limited
	recruits: null,
	gender: 2, // Female (canonical)
	race: { race1: 1, race2: 0 }, // Human
	uncap: { flb: true, ulb: true, transcendence: false },
	proficiency: [6, 0], // Staff
	hp: { minHp: 180, maxHp: 1100, maxHpFlb: 1400 },
	atk: { minAtk: 5500, maxAtk: 8000, maxAtkFlb: 9500 }
};

export const mockGridCharacter: GridCharacter = {
	id: 'grid-char-1',
	position: 1,
	uncapLevel: 5,
	transcendenceStep: 0,
	perpetuity: false,
	character: mockCharacter
};

export const mockGridCharacterWithRing: GridCharacter = {
	id: 'grid-char-2',
	position: 2,
	uncapLevel: 6,
	transcendenceStep: 3,
	perpetuity: true,
	character: mockCharacter
};

/** Characters organized by element for element-specific stories */
export const mockCharactersByElement: Record<string, Character> = {
	wind: { ...mockCharacter, id: 'char-wind', element: 1, name: { en: 'Tiamat', ja: 'ティアマト' } },
	fire: { ...mockCharacter, id: 'char-fire', element: 2, name: { en: 'Colossus', ja: 'コロッサス' } },
	water: {
		...mockCharacter,
		id: 'char-water',
		element: 3,
		name: { en: 'Leviathan', ja: 'リヴァイアサン' }
	},
	earth: { ...mockCharacter, id: 'char-earth', element: 4, name: { en: 'Yggdrasil', ja: 'ユグドラシル' } },
	dark: { ...mockCharacter, id: 'char-dark', element: 5, name: { en: 'Celeste', ja: 'セレスト' } },
	light: {
		...mockCharacter,
		id: 'char-light',
		element: 6,
		name: { en: 'Luminiera', ja: 'シュヴァリエ' }
	}
};
