import { describe, it, expect, vi } from 'vitest'
import {
	detectModifications,
	hasAnyModification,
	canWeaponBeModified,
	canCharacterBeModified
} from '../modificationDetector'
import type { GridCharacter, GridWeapon, GridSummon } from '$lib/types/api/party'

vi.mock('$lib/utils/weaponSeries', () => ({
	seriesHasWeaponKeys: vi.fn((series) => series?.hasWeaponKeys === true)
}))

// ============================================================================
// Helpers
// ============================================================================

function makeGridCharacter(overrides: Partial<GridCharacter> = {}): GridCharacter {
	return {
		id: 'gc-1',
		position: 1,
		character: {
			id: 'c-1',
			granblueId: '3040001000',
			name: { en: 'Test Char', ja: 'テスト' },
			element: 1,
			rarity: 3,
			maxLevel: 100,
			uncap: { flb: false, ulb: false },
			special: false,
			recruits: null,
			gender: 1,
			race: { race1: 1, race2: 0 },
			proficiency: [1]
		},
		...overrides
	} as GridCharacter
}

function makeGridWeapon(overrides: Partial<GridWeapon> = {}): GridWeapon {
	return {
		id: 'gw-1',
		position: 0,
		weapon: {
			id: 'w-1',
			granblueId: '1040001000',
			name: { en: 'Test Weapon', ja: 'テスト武器' },
			element: 1,
			proficiency: 1,
			rarity: 3,
			maxLevel: 150,
			maxSkillLevel: 15,
			maxAwakeningLevel: 0,
			series: null,
			ax: false,
			axType: 0,
			hp: { minHp: 0, maxHp: 100, maxHpFlb: 120, maxHpUlb: 140 },
			atk: { minAtk: 0, maxAtk: 1000, maxAtkFlb: 1200, maxAtkUlb: 1400 }
		},
		...overrides
	} as GridWeapon
}

function makeGridSummon(overrides: Partial<GridSummon> = {}): GridSummon {
	return {
		id: 'gs-1',
		position: 0,
		summon: {
			id: 's-1',
			granblueId: '2040001000',
			name: { en: 'Test Summon', ja: 'テスト召喚' },
			element: 1,
			rarity: 3,
			maxLevel: 150,
			uncap: { flb: false, ulb: false, transcendence: false },
			subaura: false,
			hp: { minHp: 0, maxHp: 100, maxHpFlb: 120, maxHpUlb: 140 },
			atk: { minAtk: 0, maxAtk: 500, maxAtkFlb: 600, maxAtkUlb: 700 }
		},
		...overrides
	} as GridSummon
}

// ============================================================================
// detectModifications
// ============================================================================

describe('detectModifications', () => {
	it('returns all false for undefined item', () => {
		const status = detectModifications('character', undefined)
		expect(status.hasModifications).toBe(false)
		expect(status.hasAwakening).toBe(false)
		expect(status.hasRings).toBe(false)
	})

	// --- Character ---

	it('detects character awakening', () => {
		const char = makeGridCharacter({ awakening: { type: { id: 'a-1' } as any, level: 1 } })
		const status = detectModifications('character', char)
		expect(status.hasAwakening).toBe(true)
		expect(status.hasModifications).toBe(true)
	})

	it('detects character rings (overMastery)', () => {
		const char = makeGridCharacter({ overMastery: [{ modifier: 1, strength: 10 }] })
		const status = detectModifications('character', char)
		expect(status.hasRings).toBe(true)
		expect(status.hasModifications).toBe(true)
	})

	it('detects character earring (aetherialMastery)', () => {
		const char = makeGridCharacter({ aetherialMastery: { modifier: 1, strength: 5 } })
		const status = detectModifications('character', char)
		expect(status.hasEarring).toBe(true)
		expect(status.hasModifications).toBe(true)
	})

	it('detects character perpetuity', () => {
		const char = makeGridCharacter({ perpetuity: true })
		const status = detectModifications('character', char)
		expect(status.hasPerpetuity).toBe(true)
		expect(status.hasModifications).toBe(true)
	})

	it('detects character transcendence', () => {
		const char = makeGridCharacter({ transcendenceStep: 3 })
		const status = detectModifications('character', char)
		expect(status.hasTranscendence).toBe(true)
		expect(status.hasModifications).toBe(true)
	})

	it('detects character uncapLevel', () => {
		const char = makeGridCharacter({ uncapLevel: 4 })
		const status = detectModifications('character', char)
		expect(status.hasUncapLevel).toBe(true)
		expect(status.hasModifications).toBe(true)
	})

	it('returns no character modifications when all empty', () => {
		const char = makeGridCharacter()
		const status = detectModifications('character', char)
		expect(status.hasModifications).toBe(false)
	})

	// --- Weapon ---

	it('detects weapon awakening', () => {
		const weapon = makeGridWeapon({ awakening: { type: { id: 'a-1' } as any, level: 1 } })
		const status = detectModifications('weapon', weapon)
		expect(status.hasAwakening).toBe(true)
		expect(status.hasModifications).toBe(true)
	})

	it('detects weapon keys', () => {
		const weapon = makeGridWeapon({ weaponKeys: [{ id: 'k-1' } as any] })
		const status = detectModifications('weapon', weapon)
		expect(status.hasWeaponKeys).toBe(true)
		expect(status.hasModifications).toBe(true)
	})

	it('detects weapon ax skills', () => {
		const weapon = makeGridWeapon({ ax: [{ modifier: 1, strength: 5 } as any] })
		const status = detectModifications('weapon', weapon)
		expect(status.hasAxSkills).toBe(true)
		expect(status.hasModifications).toBe(true)
	})

	it('detects weapon befoulment', () => {
		const weapon = makeGridWeapon({ befoulment: { modifier: 1 } as any })
		const status = detectModifications('weapon', weapon)
		expect(status.hasBefoulment).toBe(true)
		expect(status.hasModifications).toBe(true)
	})

	it('detects weapon element change (element set, base element 0)', () => {
		const weapon = makeGridWeapon({ element: 3 })
		// Need weapon.element === 0 on the nested weapon
		weapon.weapon.element = 0
		const status = detectModifications('weapon', weapon)
		expect(status.hasElement).toBe(true)
		expect(status.hasModifications).toBe(true)
	})

	it('does not flag element when base weapon element is not 0', () => {
		const weapon = makeGridWeapon({ element: 3 })
		weapon.weapon.element = 1 // not zero
		const status = detectModifications('weapon', weapon)
		expect(status.hasElement).toBe(false)
	})

	// --- Summon ---

	it('detects summon transcendence', () => {
		const summon = makeGridSummon({ transcendenceStep: 2 })
		const status = detectModifications('summon', summon)
		expect(status.hasTranscendence).toBe(true)
		expect(status.hasModifications).toBe(true)
	})

	it('detects summon quickSummon', () => {
		const summon = makeGridSummon({ quickSummon: true })
		const status = detectModifications('summon', summon)
		expect(status.hasQuickSummon).toBe(true)
		expect(status.hasModifications).toBe(true)
	})

	it('detects summon friend flag', () => {
		const summon = makeGridSummon({ friend: true })
		const status = detectModifications('summon', summon)
		expect(status.hasFriendSummon).toBe(true)
		expect(status.hasModifications).toBe(true)
	})

	it('detects summon uncapLevel', () => {
		const summon = makeGridSummon({ uncapLevel: 3 })
		const status = detectModifications('summon', summon)
		expect(status.hasUncapLevel).toBe(true)
		expect(status.hasModifications).toBe(true)
	})
})

// ============================================================================
// hasAnyModification
// ============================================================================

describe('hasAnyModification', () => {
	it('returns false for unmodified item', () => {
		expect(hasAnyModification('character', makeGridCharacter())).toBe(false)
	})

	it('returns true when any modification exists', () => {
		const char = makeGridCharacter({ perpetuity: true })
		expect(hasAnyModification('character', char)).toBe(true)
	})

	it('returns false for undefined', () => {
		expect(hasAnyModification('weapon', undefined)).toBe(false)
	})
})

// ============================================================================
// canWeaponBeModified
// ============================================================================

describe('canWeaponBeModified', () => {
	it('returns false for undefined', () => {
		expect(canWeaponBeModified(undefined)).toBe(false)
	})

	it('returns false when weapon has no nested weapon', () => {
		expect(canWeaponBeModified({} as any)).toBe(false)
	})

	it('returns true when weapon element is 0 (any element)', () => {
		const weapon = makeGridWeapon()
		weapon.weapon.element = 0
		expect(canWeaponBeModified(weapon)).toBe(true)
	})

	it('returns true when series has weapon keys', () => {
		const weapon = makeGridWeapon()
		weapon.weapon.series = {
			id: 'ws-1',
			slug: 'test-series',
			name: { en: 'Test', ja: 'テスト' },
			hasWeaponKeys: true,
			hasAwakening: false,
			augmentType: 'no_augment',
			extra: false,
			elementChangeable: false
		}
		expect(canWeaponBeModified(weapon)).toBe(true)
	})

	it('returns true when series has augments (ax)', () => {
		const weapon = makeGridWeapon()
		weapon.weapon.series = {
			id: 'ws-1',
			slug: 'test-series',
			name: { en: 'Test', ja: 'テスト' },
			hasWeaponKeys: false,
			hasAwakening: false,
			augmentType: 'ax',
			extra: false,
			elementChangeable: false
		}
		expect(canWeaponBeModified(weapon)).toBe(true)
	})

	it('returns true when weapon has awakening', () => {
		const weapon = makeGridWeapon()
		weapon.weapon.maxAwakeningLevel = 5
		expect(canWeaponBeModified(weapon)).toBe(true)
	})

	it('returns false when nothing is modifiable', () => {
		const weapon = makeGridWeapon()
		weapon.weapon.element = 1 // not zero
		weapon.weapon.maxAwakeningLevel = 0
		weapon.weapon.series = null
		expect(canWeaponBeModified(weapon)).toBe(false)
	})
})

// ============================================================================
// canCharacterBeModified
// ============================================================================

describe('canCharacterBeModified', () => {
	it('returns false for undefined', () => {
		expect(canCharacterBeModified(undefined)).toBe(false)
	})

	it('returns false when no nested character', () => {
		expect(canCharacterBeModified({} as any)).toBe(false)
	})

	it('returns true for position 0 (MC) — can have rings and earring', () => {
		const char = makeGridCharacter({ position: 0 })
		expect(canCharacterBeModified(char)).toBe(true)
	})

	it('returns true for position > 0 — can have perpetuity', () => {
		const char = makeGridCharacter({ position: 1 })
		expect(canCharacterBeModified(char)).toBe(true)
	})

	it('returns true when character has awakening', () => {
		const char = makeGridCharacter()
		char.character.maxAwakeningLevel = 3
		expect(canCharacterBeModified(char)).toBe(true)
	})
})
