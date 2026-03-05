import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { Party, GridCharacter, GridWeapon, GridSummon } from '$lib/types/api/party'

vi.mock('$lib/api/adapters/grid.adapter', () => ({
	gridAdapter: {
		updateCharacter: vi.fn(),
		updateWeapon: vi.fn()
	}
}))

const { partyStore } = await import('../partyStore.svelte')
const { gridAdapter } = await import('$lib/api/adapters/grid.adapter')

// ============================================================================
// Helpers
// ============================================================================

function makeCharacter(id: string, position: number): GridCharacter {
	return {
		id,
		position,
		character: { id: `char-${id}`, granblueId: '3040001000', name: { en: `Char ${id}` } }
	} as GridCharacter
}

function makeWeapon(id: string, position: number): GridWeapon {
	return {
		id,
		position,
		weapon: { id: `wpn-${id}`, granblueId: '1040001000', name: { en: `Weapon ${id}` } }
	} as GridWeapon
}

function makeSummon(id: string, position: number): GridSummon {
	return {
		id,
		position,
		summon: { id: `smn-${id}`, granblueId: '2040001000', name: { en: `Summon ${id}` } }
	} as GridSummon
}

function makeParty(overrides: Partial<Party> = {}): Party {
	return {
		id: 'p-1',
		shortcode: 'ABC123',
		characters: [makeCharacter('c-1', 0), makeCharacter('c-2', 1)],
		weapons: [makeWeapon('w-1', 0), makeWeapon('w-2', 1)],
		summons: [makeSummon('s-1', 0), makeSummon('s-2', 1)],
		...overrides
	} as Party
}

// ============================================================================
// Setup
// ============================================================================

beforeEach(() => {
	partyStore.clear()
	vi.restoreAllMocks()
})

// ============================================================================
// setParty / clear
// ============================================================================

describe('setParty / clear', () => {
	it('sets party state', () => {
		partyStore.setParty(makeParty())
		expect(partyStore.party).not.toBeNull()
		expect(partyStore.shortcode).toBe('ABC123')
	})

	it('clear resets to null', () => {
		partyStore.setParty(makeParty())
		partyStore.clear()
		expect(partyStore.party).toBeNull()
		expect(partyStore.shortcode).toBeUndefined()
	})
})

// ============================================================================
// Lookups
// ============================================================================

describe('getCharacter', () => {
	it('finds by string id', () => {
		partyStore.setParty(makeParty())
		expect(partyStore.getCharacter('c-1')?.id).toBe('c-1')
	})

	it('finds by numeric id via String coercion', () => {
		partyStore.setParty(makeParty({ characters: [makeCharacter('123', 0)] }))
		expect(partyStore.getCharacter(123)?.id).toBe('123')
	})

	it('returns undefined for missing id', () => {
		partyStore.setParty(makeParty())
		expect(partyStore.getCharacter('nonexistent')).toBeUndefined()
	})

	it('returns undefined when party is null', () => {
		expect(partyStore.getCharacter('c-1')).toBeUndefined()
	})
})

describe('getWeapon', () => {
	it('finds by id', () => {
		partyStore.setParty(makeParty())
		expect(partyStore.getWeapon('w-1')?.id).toBe('w-1')
	})
})

describe('getSummon', () => {
	it('finds by id', () => {
		partyStore.setParty(makeParty())
		expect(partyStore.getSummon('s-1')?.id).toBe('s-1')
	})
})

describe('getItem', () => {
	it('dispatches to getCharacter', () => {
		partyStore.setParty(makeParty())
		expect(partyStore.getItem('character', 'c-1')?.id).toBe('c-1')
	})

	it('dispatches to getWeapon', () => {
		partyStore.setParty(makeParty())
		expect(partyStore.getItem('weapon', 'w-1')?.id).toBe('w-1')
	})

	it('dispatches to getSummon', () => {
		partyStore.setParty(makeParty())
		expect(partyStore.getItem('summon', 's-1')?.id).toBe('s-1')
	})
})

// ============================================================================
// Optimistic updates
// ============================================================================

describe('updateCharacter', () => {
	it('optimistically updates then applies server response', async () => {
		partyStore.setParty(makeParty())
		const serverResponse = { ...makeCharacter('c-1', 0), uncapLevel: 5 }
		vi.mocked(gridAdapter.updateCharacter).mockResolvedValue(serverResponse)

		const result = await partyStore.updateCharacter('c-1', { uncapLevel: 5 })

		expect(result.uncapLevel).toBe(5)
		expect(gridAdapter.updateCharacter).toHaveBeenCalledWith('c-1', { uncapLevel: 5 })
		expect(partyStore.getCharacter('c-1')?.uncapLevel).toBe(5)
	})
})

describe('updateWeapon', () => {
	it('optimistically updates then applies server response', async () => {
		partyStore.setParty(makeParty())
		const serverResponse = { ...makeWeapon('w-1', 0), element: 3 }
		vi.mocked(gridAdapter.updateWeapon).mockResolvedValue(serverResponse)

		const result = await partyStore.updateWeapon('w-1', { element: 3 })

		expect(result.element).toBe(3)
		expect(gridAdapter.updateWeapon).toHaveBeenCalledWith('w-1', { element: 3 })
	})
})
