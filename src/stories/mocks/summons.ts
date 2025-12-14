import type { Summon } from '$lib/types/api/entities';
import type { GridSummon } from '$lib/types/api/party';

/** Mock summon data for Storybook stories */
export const mockSummon: Summon = {
	id: 'summon-1',
	granblueId: '2040000000',
	name: { en: 'Bahamut', ja: 'バハムート' },
	element: 5, // Dark
	rarity: 3, // SSR
	maxLevel: 200,
	subaura: true,
	uncap: { flb: true, ulb: true, transcendence: true },
	hp: { minHp: 1000, maxHp: 2000, maxHpFlb: 2500, maxHpUlb: 3000 },
	atk: { minAtk: 3000, maxAtk: 4500, maxAtkFlb: 5500, maxAtkUlb: 6500 }
};

export const mockGridSummon: GridSummon = {
	id: 'grid-summon-1',
	position: 0,
	uncapLevel: 5,
	transcendenceStep: 0,
	main: false,
	friend: false,
	summon: mockSummon
};

export const mockMainSummon: GridSummon = {
	id: 'grid-summon-main',
	position: -1,
	uncapLevel: 6,
	transcendenceStep: 5,
	main: true,
	friend: false,
	summon: mockSummon
};

export const mockFriendSummon: GridSummon = {
	id: 'grid-summon-friend',
	position: 6,
	uncapLevel: 5,
	transcendenceStep: 0,
	main: false,
	friend: true,
	summon: mockSummon
};

/** Summons organized by element */
export const mockSummonsByElement: Record<string, Summon> = {
	wind: { ...mockSummon, id: 'summon-wind', element: 1, name: { en: 'Tiamat', ja: 'ティアマト' } },
	fire: { ...mockSummon, id: 'summon-fire', element: 2, name: { en: 'Colossus', ja: 'コロッサス' } },
	water: { ...mockSummon, id: 'summon-water', element: 3, name: { en: 'Leviathan', ja: 'リヴァイアサン' } },
	earth: { ...mockSummon, id: 'summon-earth', element: 4, name: { en: 'Yggdrasil', ja: 'ユグドラシル' } },
	dark: { ...mockSummon, id: 'summon-dark', element: 5, name: { en: 'Celeste', ja: 'セレスト' } },
	light: { ...mockSummon, id: 'summon-light', element: 6, name: { en: 'Luminiera', ja: 'シュヴァリエ' } }
};
