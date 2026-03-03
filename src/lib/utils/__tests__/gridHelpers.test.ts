import { describe, it, expect } from 'vitest'
import { findNextEmptySlot, SLOT_NOT_FOUND } from '../gridHelpers'
import { GridType } from '$lib/types/enums'
import type { Party } from '$lib/types/api/party'

function makeParty(overrides: Partial<Party> = {}): Party {
	return {
		id: 'p-1',
		shortcode: 'ABC123',
		name: { en: 'Test Party', ja: 'テスト' },
		extra: false,
		weapons: [],
		characters: [],
		summons: [],
		...overrides
	} as Party
}

// ============================================================================
// Weapon Grid
// ============================================================================

describe('findNextEmptySlot — weapons', () => {
	it('returns -1 (mainhand) for empty weapon grid', () => {
		const party = makeParty()
		expect(findNextEmptySlot(party, GridType.Weapon)).toBe(-1)
	})

	it('returns 0 when mainhand is occupied', () => {
		const party = makeParty({
			weapons: [{ id: 'w-1', position: -1, mainhand: true }] as any[]
		})
		expect(findNextEmptySlot(party, GridType.Weapon)).toBe(0)
	})

	it('skips occupied regular slots', () => {
		const party = makeParty({
			weapons: [
				{ id: 'w-1', position: -1, mainhand: true },
				{ id: 'w-2', position: 0 },
				{ id: 'w-3', position: 1 }
			] as any[]
		})
		expect(findNextEmptySlot(party, GridType.Weapon)).toBe(2)
	})

	it('returns SLOT_NOT_FOUND when all weapon slots are full', () => {
		const weapons = [{ id: 'w-mh', position: -1, mainhand: true }] as any[]
		for (let i = 0; i <= 8; i++) {
			weapons.push({ id: `w-${i}`, position: i })
		}
		const party = makeParty({ weapons })
		expect(findNextEmptySlot(party, GridType.Weapon)).toBe(SLOT_NOT_FOUND)
	})
})

// ============================================================================
// Summon Grid
// ============================================================================

describe('findNextEmptySlot — summons', () => {
	it('returns -1 (main summon) for empty summon grid', () => {
		const party = makeParty()
		expect(findNextEmptySlot(party, GridType.Summon)).toBe(-1)
	})

	it('returns 6 (friend) when main and regular slots are full', () => {
		const summons = [{ id: 's-main', position: -1, main: true }] as any[]
		for (let i = 0; i <= 5; i++) {
			summons.push({ id: `s-${i}`, position: i })
		}
		const party = makeParty({ summons })
		expect(findNextEmptySlot(party, GridType.Summon)).toBe(6)
	})

	it('returns SLOT_NOT_FOUND when all summon slots are full', () => {
		const summons = [
			{ id: 's-main', position: -1, main: true },
			{ id: 's-friend', position: 6, friend: true }
		] as any[]
		for (let i = 0; i <= 5; i++) {
			summons.push({ id: `s-${i}`, position: i })
		}
		const party = makeParty({ summons })
		expect(findNextEmptySlot(party, GridType.Summon)).toBe(SLOT_NOT_FOUND)
	})
})

// ============================================================================
// Character Grid
// ============================================================================

describe('findNextEmptySlot — characters', () => {
	it('returns 0 for empty character grid', () => {
		const party = makeParty()
		expect(findNextEmptySlot(party, GridType.Character)).toBe(0)
	})

	it('skips occupied character slots', () => {
		const party = makeParty({
			characters: [
				{ id: 'c-1', position: 0 },
				{ id: 'c-2', position: 1 }
			] as any[]
		})
		expect(findNextEmptySlot(party, GridType.Character)).toBe(2)
	})

	it('returns SLOT_NOT_FOUND when all character slots are full', () => {
		const characters = [] as any[]
		for (let i = 0; i <= 4; i++) {
			characters.push({ id: `c-${i}`, position: i })
		}
		const party = makeParty({ characters })
		expect(findNextEmptySlot(party, GridType.Character)).toBe(SLOT_NOT_FOUND)
	})
})
