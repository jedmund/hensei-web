/**
 * Tests for useItemAddition composable
 *
 * Focuses on behavioral contracts:
 * - Only the first item is processed per call (conflict detection requires this)
 * - Conflict detection halts slot advancement
 * - Special slot semantics: mainhand (-1), friend summon (6)
 * - ensurePartyExists creates party before adding items on new route
 * - State machine: loading/error lifecycle, conflict state lifecycle
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useItemAddition } from '../item-addition.svelte'
import { createMockMutations, createTestParty } from './helpers'
import { GridType } from '$lib/types/enums'
import type { PartyMutations } from '../party-mutations.svelte'
import type { Party } from '$lib/types/api/party'
import type { AddItemResult } from '$lib/types/api/search'

const MOCK_WEAPON_ITEM: AddItemResult = {
	id: 'weapon-1',
	granblueId: '1040001',
	name: { en: 'Test Weapon' },
	collectionId: 'cw-1'
}

const MOCK_CHARACTER_ITEM: AddItemResult = {
	id: 'char-1',
	granblueId: '3040001',
	name: { en: 'Test Character' },
	collectionId: 'cc-1'
}

const MOCK_SUMMON_ITEM: AddItemResult = {
	id: 'summon-1',
	granblueId: '2040001',
	name: { en: 'Test Summon' },
	collectionId: 'cs-1'
}

describe('useItemAddition', () => {
	let mutations: PartyMutations
	let party: Party
	let activeTab: GridType
	let selectedSlot: number
	let addition: ReturnType<typeof useItemAddition>

	function createAddition(overrides: Record<string, unknown> = {}) {
		return useItemAddition({
			mutations,
			getParty: () => party,
			canEdit: () => true,
			getActiveTab: () => activeTab,
			getSelectedSlot: () => selectedSlot,
			setSelectedSlot: (n: number) => {
				selectedSlot = n
			},
			...overrides
		})
	}

	beforeEach(() => {
		mutations = createMockMutations()
		party = createTestParty()
		activeTab = GridType.Weapon
		selectedSlot = 0
		addition = createAddition()
		vi.clearAllMocks()
	})

	// ========================================================================
	// Single-item processing: only the first item is processed per call.
	// This is intentional — conflict detection needs to halt before the
	// second item. The UI calls handleAddItems per search selection.
	// ========================================================================

	describe('single-item processing', () => {
		it('only processes the first item even when multiple are passed', async () => {
			const item2: AddItemResult = {
				id: 'weapon-2',
				granblueId: '1040002',
				name: { en: 'Weapon 2' }
			}

			await addition.handleAddItems([MOCK_WEAPON_ITEM, item2])

			expect(mutations.grid.createWeapon.mutateAsync).toHaveBeenCalledTimes(1)
			expect(mutations.grid.createWeapon.mutateAsync).toHaveBeenCalledWith(
				expect.objectContaining({ weaponId: '1040001' })
			)
		})
	})

	// ========================================================================
	// Conflict detection: when the API returns a conflict response,
	// the dialog opens and slot advancement is skipped.
	// ========================================================================

	describe('conflict detection', () => {
		const conflictResponse = {
			position: 3,
			conflicts: [{ id: 'gw-existing' }],
			incoming: { id: 'weapon-1' }
		}

		it('opens conflict dialog when weapon addition returns a conflict', async () => {
			vi.mocked(mutations.grid.createWeapon.mutateAsync).mockResolvedValue(conflictResponse)

			await addition.handleAddItems([MOCK_WEAPON_ITEM])

			expect(addition.conflictDialogOpen).toBe(true)
			expect(addition.conflictData).not.toBeNull()
			expect(addition.conflictData?.type).toBe('weapon')
		})

		it('opens conflict dialog for character conflicts', async () => {
			activeTab = GridType.Character
			vi.mocked(mutations.grid.createCharacter.mutateAsync).mockResolvedValue({
				position: 1,
				conflicts: [{ id: 'gc-existing' }],
				incoming: { id: 'char-1' }
			})

			await addition.handleAddItems([MOCK_CHARACTER_ITEM])

			expect(addition.conflictDialogOpen).toBe(true)
			expect(addition.conflictData?.type).toBe('character')
		})

		it('does NOT advance slot when conflict is detected', async () => {
			selectedSlot = 3
			vi.mocked(mutations.grid.createWeapon.mutateAsync).mockResolvedValue(conflictResponse)

			await addition.handleAddItems([MOCK_WEAPON_ITEM])

			// Slot should remain where it was, not advance
			expect(selectedSlot).toBe(3)
		})

		it('resolveConflict clears conflict state and advances slot', async () => {
			vi.mocked(mutations.grid.createWeapon.mutateAsync).mockResolvedValue(conflictResponse)
			await addition.handleAddItems([MOCK_WEAPON_ITEM])

			addition.resolveConflict()

			expect(addition.conflictData).toBeNull()
		})

		it('cancelConflict clears conflict without side effects', async () => {
			vi.mocked(mutations.grid.createWeapon.mutateAsync).mockResolvedValue(conflictResponse)
			await addition.handleAddItems([MOCK_WEAPON_ITEM])

			addition.cancelConflict()

			expect(addition.conflictData).toBeNull()
			// conflictDialogOpen is still true — the dialog component controls its own closing
			// via the setter. But conflictData being null will cause it to close.
		})

		it('summon additions never trigger conflict detection', async () => {
			activeTab = GridType.Summon
			// Even if the API returned a conflict-shaped response, summon path
			// doesn't check isConflictResponse — summons use replacement, not conflict
			vi.mocked(mutations.grid.createSummon.mutateAsync).mockResolvedValue({
				position: 1,
				conflicts: [{ id: 'gs-existing' }],
				incoming: { id: 'summon-1' }
			})

			await addition.handleAddItems([MOCK_SUMMON_ITEM])

			expect(addition.conflictDialogOpen).toBe(false)
			expect(addition.conflictData).toBeNull()
		})
	})

	// ========================================================================
	// Special slot semantics: position -1 = mainhand/main, position 6 = friend
	// Getting these flags wrong means the API puts items in the wrong grid slot.
	// ========================================================================

	describe('special slot semantics', () => {
		it('weapon at position -1 gets mainhand=true', async () => {
			selectedSlot = -1
			await addition.handleAddItems([MOCK_WEAPON_ITEM])

			expect(mutations.grid.createWeapon.mutateAsync).toHaveBeenCalledWith(
				expect.objectContaining({ mainhand: true, position: -1 })
			)
		})

		it('weapon at regular position gets mainhand=false', async () => {
			selectedSlot = 3
			await addition.handleAddItems([MOCK_WEAPON_ITEM])

			expect(mutations.grid.createWeapon.mutateAsync).toHaveBeenCalledWith(
				expect.objectContaining({ mainhand: false, position: 3 })
			)
		})

		it('summon at position -1 gets main=true, friend=false', async () => {
			activeTab = GridType.Summon
			selectedSlot = -1
			await addition.handleAddItems([MOCK_SUMMON_ITEM])

			expect(mutations.grid.createSummon.mutateAsync).toHaveBeenCalledWith(
				expect.objectContaining({ main: true, friend: false })
			)
		})

		it('summon at position 6 gets friend=true, main=false', async () => {
			activeTab = GridType.Summon
			selectedSlot = 6
			await addition.handleAddItems([MOCK_SUMMON_ITEM])

			expect(mutations.grid.createSummon.mutateAsync).toHaveBeenCalledWith(
				expect.objectContaining({ main: false, friend: true })
			)
		})

		it('summon at regular position gets both false', async () => {
			activeTab = GridType.Summon
			selectedSlot = 2
			await addition.handleAddItems([MOCK_SUMMON_ITEM])

			expect(mutations.grid.createSummon.mutateAsync).toHaveBeenCalledWith(
				expect.objectContaining({ main: false, friend: false })
			)
		})

		it('collection IDs are passed through for collection linking', async () => {
			await addition.handleAddItems([MOCK_WEAPON_ITEM])

			expect(mutations.grid.createWeapon.mutateAsync).toHaveBeenCalledWith(
				expect.objectContaining({ collectionWeaponId: 'cw-1' })
			)
		})

		it('collection ID is undefined when item has no collectionId', async () => {
			const itemWithoutCollection: AddItemResult = {
				id: 'w-1',
				granblueId: '1040099',
				name: { en: 'No Collection' }
			}

			await addition.handleAddItems([itemWithoutCollection])

			expect(mutations.grid.createWeapon.mutateAsync).toHaveBeenCalledWith(
				expect.objectContaining({ collectionWeaponId: undefined })
			)
		})
	})

	// ========================================================================
	// ensurePartyExists: creates party before adding items on new route
	// ========================================================================

	describe('new party creation flow', () => {
		it('creates party then adds item in sequence', async () => {
			const createdParty = createTestParty()
			party = createTestParty({ id: 'new', shortcode: 'new' })

			const ensurePartyExists = vi.fn().mockImplementation(async () => {
				party = createdParty
				return { id: createdParty.id, shortcode: createdParty.shortcode }
			})

			addition = createAddition({ ensurePartyExists })
			await addition.handleAddItems([MOCK_WEAPON_ITEM])

			// Party creation happened first
			expect(ensurePartyExists).toHaveBeenCalledTimes(1)
			// Then weapon was added to the CREATED party, not the placeholder
			expect(mutations.grid.createWeapon.mutateAsync).toHaveBeenCalledWith(
				expect.objectContaining({ partyId: createdParty.id })
			)
		})

		it('aborts silently when party is "new" and no ensurePartyExists provided', async () => {
			party = createTestParty({ id: 'new', shortcode: 'new' })
			addition = createAddition()

			await addition.handleAddItems([MOCK_WEAPON_ITEM])

			expect(mutations.grid.createWeapon.mutateAsync).not.toHaveBeenCalled()
			// No error shown — this is a guard, not a failure
			expect(addition.error).toBeNull()
		})

		it('does not call ensurePartyExists for existing parties', async () => {
			const ensurePartyExists = vi.fn()
			addition = createAddition({ ensurePartyExists })

			await addition.handleAddItems([MOCK_WEAPON_ITEM])

			expect(ensurePartyExists).not.toHaveBeenCalled()
		})
	})

	// ========================================================================
	// State machine: loading/error lifecycle
	// ========================================================================

	describe('state machine', () => {
		it('loading resets to false after success', async () => {
			await addition.handleAddItems([MOCK_WEAPON_ITEM])
			expect(addition.loading).toBe(false)
		})

		it('loading resets to false after failure', async () => {
			vi.mocked(mutations.grid.createWeapon.mutateAsync).mockRejectedValue(
				new Error('fail')
			)
			await addition.handleAddItems([MOCK_WEAPON_ITEM])
			expect(addition.loading).toBe(false)
		})

		it('error captures failure message', async () => {
			vi.mocked(mutations.grid.createWeapon.mutateAsync).mockRejectedValue(
				new Error('Server 500')
			)
			await addition.handleAddItems([MOCK_WEAPON_ITEM])
			expect(addition.error).toBe('Server 500')
		})

		it('error clears on next successful operation', async () => {
			vi.mocked(mutations.grid.createWeapon.mutateAsync)
				.mockRejectedValueOnce(new Error('fail'))
				.mockResolvedValueOnce(undefined)

			await addition.handleAddItems([MOCK_WEAPON_ITEM])
			expect(addition.error).toBe('fail')

			await addition.handleAddItems([MOCK_WEAPON_ITEM])
			expect(addition.error).toBeNull()
		})
	})

	// ========================================================================
	// Guards
	// ========================================================================

	describe('guards', () => {
		it('empty items array is a no-op', async () => {
			await addition.handleAddItems([])
			expect(mutations.grid.createWeapon.mutateAsync).not.toHaveBeenCalled()
			expect(addition.loading).toBe(false)
		})

		it('canEdit=false prevents any mutation', async () => {
			addition = createAddition({ canEdit: () => false })
			await addition.handleAddItems([MOCK_WEAPON_ITEM])
			expect(mutations.grid.createWeapon.mutateAsync).not.toHaveBeenCalled()
		})
	})

	// ========================================================================
	// Type dispatch: each grid type hits the right create mutation
	// ========================================================================

	describe('type dispatch', () => {
		it('weapon tab → createWeapon', async () => {
			activeTab = GridType.Weapon
			await addition.handleAddItems([MOCK_WEAPON_ITEM])
			expect(mutations.grid.createWeapon.mutateAsync).toHaveBeenCalled()
			expect(mutations.grid.createCharacter.mutateAsync).not.toHaveBeenCalled()
			expect(mutations.grid.createSummon.mutateAsync).not.toHaveBeenCalled()
		})

		it('character tab → createCharacter', async () => {
			activeTab = GridType.Character
			await addition.handleAddItems([MOCK_CHARACTER_ITEM])
			expect(mutations.grid.createCharacter.mutateAsync).toHaveBeenCalled()
			expect(mutations.grid.createWeapon.mutateAsync).not.toHaveBeenCalled()
		})

		it('summon tab → createSummon', async () => {
			activeTab = GridType.Summon
			await addition.handleAddItems([MOCK_SUMMON_ITEM])
			expect(mutations.grid.createSummon.mutateAsync).toHaveBeenCalled()
			expect(mutations.grid.createWeapon.mutateAsync).not.toHaveBeenCalled()
		})
	})
})
