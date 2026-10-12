import { describe, it, expect } from 'vitest'
import { findNextEmptySlot, SLOT_NOT_FOUND } from '../gridHelpers'
import { GridType } from '$lib/types/enums'
import type { Party, GridWeapon, GridSummon, GridCharacter } from '$lib/types/api/party'
import { transformResponse } from '$lib/api/schemas/transforms'
import { getExpedition } from '$lib/components/solomonis/grid/seal'
import buildJson from '$lib/components/solomonis/grid/__fixtures__/party-build.json'
import runJson from '$lib/components/solomonis/grid/__fixtures__/party-run.json'

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
			weapons: [{ id: 'w-1', position: -1, mainhand: true }] as unknown as GridWeapon[]
		})
		expect(findNextEmptySlot(party, GridType.Weapon)).toBe(0)
	})

	it('skips occupied regular slots', () => {
		const party = makeParty({
			weapons: [
				{ id: 'w-1', position: -1, mainhand: true },
				{ id: 'w-2', position: 0 },
				{ id: 'w-3', position: 1 }
			] as unknown as GridWeapon[]
		})
		expect(findNextEmptySlot(party, GridType.Weapon)).toBe(2)
	})

	it('returns SLOT_NOT_FOUND when all weapon slots are full', () => {
		const weapons = [{ id: 'w-mh', position: -1, mainhand: true }] as unknown as GridWeapon[]
		for (let i = 0; i <= 8; i++) {
			weapons.push({ id: `w-${i}`, position: i } as unknown as GridWeapon)
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
		const summons = [{ id: 's-main', position: -1, main: true }] as unknown as GridSummon[]
		for (let i = 0; i <= 5; i++) {
			summons.push({ id: `s-${i}`, position: i } as unknown as GridSummon)
		}
		const party = makeParty({ summons })
		expect(findNextEmptySlot(party, GridType.Summon)).toBe(6)
	})

	it('returns SLOT_NOT_FOUND when all summon slots are full', () => {
		const summons = [
			{ id: 's-main', position: -1, main: true },
			{ id: 's-friend', position: 6, friend: true }
		] as unknown as GridSummon[]
		for (let i = 0; i <= 5; i++) {
			summons.push({ id: `s-${i}`, position: i } as unknown as GridSummon)
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
			] as unknown as GridCharacter[]
		})
		expect(findNextEmptySlot(party, GridType.Character)).toBe(2)
	})

	it('returns SLOT_NOT_FOUND when all character slots are full', () => {
		const characters = [] as unknown as GridCharacter[]
		for (let i = 0; i <= 4; i++) {
			characters.push({ id: `c-${i}`, position: i } as unknown as GridCharacter)
		}
		const party = makeParty({ characters })
		expect(findNextEmptySlot(party, GridType.Character)).toBe(SLOT_NOT_FOUND)
	})
})

describe('findNextEmptySlot — Evoking Solomonis', () => {
	const load = (json: unknown) => transformResponse<{ party: Party }>(json).party
	const hangedMan = {
		blessing: {
			id: 'hm',
			slug: 'hanged_man',
			arcanaNumber: 12,
			name: { en: 'The Hanged Man', ja: null }
		},
		levelId: 'hml',
		level: 1,
		cost: 100
	}
	const withHangedMan = (party: Party): Party => {
		const expedition = getExpedition(party)!
		return { ...party, solomonis: { ...expedition, blessings: [hangedMan] } }
	}

	it('stops at the route Evoker on a build', () => {
		const party = load(buildJson)
		expect(findNextEmptySlot(party, GridType.Character)).toBe(SLOT_NOT_FOUND)
	})

	it('allows one more character on a build with The Hanged Man', () => {
		const party = withHangedMan(load(buildJson))
		expect(findNextEmptySlot(party, GridType.Character)).toBe(1)
	})

	it('allows the usual five slots on a run', () => {
		const party = load(runJson)
		const characters = party.characters.filter((c) => c.position !== 3)
		expect(findNextEmptySlot({ ...party, characters }, GridType.Character)).toBe(3)
	})

	it('never offers the support summon slot', () => {
		const party = load(buildJson)
		expect(findNextEmptySlot(party, GridType.Summon)).toBe(SLOT_NOT_FOUND)
		const summons = party.summons.filter((s) => s.position !== 2)
		expect(findNextEmptySlot({ ...party, summons }, GridType.Summon)).toBe(2)
	})
})
