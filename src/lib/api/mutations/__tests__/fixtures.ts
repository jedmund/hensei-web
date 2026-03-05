/**
 * Shared test fixtures for mutation tests
 *
 * Provides mock data objects matching the app's TypeScript types.
 * Keep fixtures minimal — only include required fields and fields
 * that mutations actually read or transform.
 */

import type { Party, GridWeapon, GridCharacter, GridSummon, JobSkillList } from '$lib/types/api/party'
import type { Weapon, Character, Summon, Job, JobSkill } from '$lib/types/api/entities'

// ============================================================================
// Base Entities
// ============================================================================

export const MOCK_WEAPON: Weapon = {
	id: 'weapon-1',
	granblueId: '1040001',
	name: { en: 'Test Weapon', ja: 'テスト武器' },
	rarity: 5,
	element: 1,
	maxLevel: 150,
	maxSkillLevel: 15,
	maxAwakeningLevel: 5,
	series: {
		id: 'series-1',
		slug: 'dark-opus',
		name: { en: 'Dark Opus', ja: 'ダークオーパス' },
		hasWeaponKeys: true,
		hasAwakening: true,
		augmentType: 'no_augment',
		extra: false,
		elementChangeable: false
	},
	proficiency: 1,
	ax: true,
	axType: 1,
	uncap: { flb: true, ulb: true, transcendence: false },
	hp: { minHp: 100, maxHp: 500, maxHpFlb: 600, maxHpUlb: 700 },
	atk: { minAtk: 200, maxAtk: 1000, maxAtkFlb: 1200, maxAtkUlb: 1400 }
}

export const MOCK_CHARACTER: Character = {
	id: 'char-1',
	granblueId: '3040001',
	name: { en: 'Test Character', ja: 'テストキャラ' },
	rarity: 5,
	element: 1,
	maxLevel: 100,
	uncap: { flb: true, ulb: true },
	special: false,
	recruits: null,
	gender: 0,
	race: { race1: 1, race2: 0 },
	proficiency: [1],
	hp: { minHp: 150, maxHp: 750, maxHpFlb: 900 },
	atk: { minAtk: 250, maxAtk: 1250, maxAtkFlb: 1500 }
}

export const MOCK_SUMMON: Summon = {
	id: 'summon-1',
	granblueId: '2040001',
	name: { en: 'Test Summon', ja: 'テスト召喚石' },
	rarity: 5,
	element: 1,
	maxLevel: 150,
	uncap: { flb: true, ulb: true, transcendence: false },
	subaura: false,
	hp: { minHp: 100, maxHp: 500, maxHpFlb: 600, maxHpUlb: 700 },
	atk: { minAtk: 200, maxAtk: 1000, maxAtkFlb: 1200, maxAtkUlb: 1400 }
}

// ============================================================================
// Grid Items
// ============================================================================

export const MOCK_GRID_WEAPON: GridWeapon = {
	id: 'gw-1',
	position: 1,
	mainhand: true,
	uncapLevel: 5,
	transcendenceStep: 0,
	weapon: MOCK_WEAPON
}

export const MOCK_GRID_WEAPON_2: GridWeapon = {
	id: 'gw-2',
	position: 2,
	mainhand: false,
	uncapLevel: 4,
	transcendenceStep: 0,
	weapon: { ...MOCK_WEAPON, id: 'weapon-2', granblueId: '1040002' }
}

export const MOCK_GRID_CHARACTER: GridCharacter = {
	id: 'gc-1',
	position: 1,
	uncapLevel: 5,
	transcendenceStep: 1,
	character: MOCK_CHARACTER
}

export const MOCK_GRID_CHARACTER_2: GridCharacter = {
	id: 'gc-2',
	position: 2,
	uncapLevel: 4,
	transcendenceStep: 0,
	character: { ...MOCK_CHARACTER, id: 'char-2', granblueId: '3040002' }
}

export const MOCK_GRID_SUMMON: GridSummon = {
	id: 'gs-1',
	position: 1,
	quickSummon: true,
	uncapLevel: 5,
	transcendenceStep: 2,
	summon: MOCK_SUMMON
}

export const MOCK_GRID_SUMMON_2: GridSummon = {
	id: 'gs-2',
	position: 2,
	quickSummon: false,
	uncapLevel: 3,
	transcendenceStep: 0,
	summon: { ...MOCK_SUMMON, id: 'summon-2', granblueId: '2040002' }
}

// ============================================================================
// Job & Skills
// ============================================================================

export const MOCK_JOB: Job = {
	id: 'job-1',
	granblueId: '100001',
	name: { en: 'Dark Fencer', ja: 'ダークフェンサー' },
	row: 4,
	order: 1,
	proficiency: [1, 0],
	masterLevel: true,
	ultimateMastery: false,
	accessory: false,
	auxWeapon: false
}

export const MOCK_JOB_SKILL_1: JobSkill = {
	id: 'skill-1',
	name: { en: 'Gravity', ja: 'グラビティ' },
	slug: 'gravity',
	color: 0,
	main: true,
	sub: false,
	emp: false,
	base: false,
	order: 1,
	job: MOCK_JOB
}

export const MOCK_JOB_SKILL_2: JobSkill = {
	id: 'skill-2',
	name: { en: 'Delay', ja: 'ディレイ' },
	slug: 'delay',
	color: 1,
	main: false,
	sub: true,
	emp: false,
	base: false,
	order: 2,
	job: MOCK_JOB
}

export const MOCK_JOB_SKILLS: JobSkillList = {
	0: MOCK_JOB_SKILL_1,
	1: MOCK_JOB_SKILL_2
}

// ============================================================================
// Party
// ============================================================================

export const MOCK_SHORTCODE = 'ABC123'

export const MOCK_PARTY: Party = {
	id: 'party-uuid-550e8400-e29b-41d4-a716-446655440000',
	shortcode: MOCK_SHORTCODE,
	name: 'Test Party',
	weapons: [MOCK_GRID_WEAPON, MOCK_GRID_WEAPON_2],
	characters: [MOCK_GRID_CHARACTER, MOCK_GRID_CHARACTER_2],
	summons: [MOCK_GRID_SUMMON, MOCK_GRID_SUMMON_2],
	job: MOCK_JOB,
	jobSkills: MOCK_JOB_SKILLS,
	favorited: false,
	user: { id: 'user-1', username: 'testuser' },
	createdAt: '2024-01-01T00:00:00Z',
	updatedAt: '2024-01-01T00:00:00Z'
}
