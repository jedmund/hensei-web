/**
 * Tests for usePartyActions composable
 *
 * Focuses on behavioral contracts:
 * - State machine: loading/error lifecycle across operations
 * - Authorization guards: canEdit, auth ownership
 * - UX behaviors: dialog closes on error, error clears between operations
 * - toggleFavorite reads fresh party state (not stale closure)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { usePartyActions } from '../party-actions.svelte'
import { createMockMutations, createTestParty } from './helpers'
import { MOCK_PARTY } from '$lib/api/mutations/__tests__/fixtures'
import type { PartyMutations } from '../party-mutations.svelte'
import type { Party } from '$lib/types/api/party'
import type { Raid } from '$lib/types/api/entities'
import { openPartyEditSidebar } from '$lib/features/party/openPartyEditSidebar.svelte'
import type { PartyEditValues } from '$lib/features/party/partyEditValues'

vi.mock('svelte-sonner', () => ({
	toast: { error: vi.fn(), success: vi.fn() }
}))

vi.mock('$lib/utils/errors', () => ({
	extractErrorMessage: vi.fn((err: unknown, fallback: string) =>
		err instanceof Error ? err.message : fallback
	)
}))

vi.mock('$lib/features/description/openDescriptionPane.svelte', () => ({
	openDescriptionPane: vi.fn()
}))

vi.mock('$lib/features/party/openPartyEditSidebar.svelte', () => ({
	openPartyEditSidebar: vi.fn()
}))

describe('usePartyActions', () => {
	let mutations: PartyMutations
	let party: Party
	let actions: ReturnType<typeof usePartyActions>

	function createActions(overrides: Record<string, unknown> = {}) {
		return usePartyActions({
			mutations,
			getParty: () => party,
			canEdit: () => true,
			getAuthUserId: () => 'user-1',
			getAuthUsername: () => 'testuser',
			getUserElement: () => 'wind',
			getHasCollectionLinks: () => false,
			...overrides
		})
	}

	beforeEach(() => {
		mutations = createMockMutations()
		party = createTestParty()
		actions = createActions()
		vi.clearAllMocks()
	})

	// ========================================================================
	// State machine: loading/error lifecycle
	// ========================================================================

	describe('loading/error state machine', () => {
		it('loading is false after successful operation', async () => {
			await actions.updatePartyDetails({ name: 'New Name' })
			expect(actions.loading).toBe(false)
		})

		it('loading is false after failed operation', async () => {
			vi.mocked(mutations.party.update.mutateAsync).mockRejectedValue(new Error('fail'))
			await actions.updatePartyDetails({ name: 'New Name' })
			expect(actions.loading).toBe(false)
		})

		it('error clears when starting a new operation', async () => {
			// First call fails
			vi.mocked(mutations.party.update.mutateAsync).mockRejectedValueOnce(new Error('first fail'))
			await actions.updatePartyDetails({ name: 'Name 1' })
			expect(actions.error).toBe('first fail')

			// Second call succeeds — error should be cleared
			vi.mocked(mutations.party.update.mutateAsync).mockResolvedValueOnce(MOCK_PARTY)
			await actions.updatePartyDetails({ name: 'Name 2' })
			expect(actions.error).toBeNull()
		})

		it('error from syncFromCollection does not leak into updatePartyDetails', async () => {
			actions = createActions({ getHasCollectionLinks: () => true })
			vi.mocked(mutations.grid.syncAllItems.mutateAsync).mockRejectedValue(new Error('sync fail'))

			await actions.syncFromCollection()
			expect(actions.error).toBe('sync fail')

			vi.mocked(mutations.party.update.mutateAsync).mockResolvedValue(MOCK_PARTY)
			await actions.updatePartyDetails({ name: 'Clean' })
			expect(actions.error).toBeNull()
		})
	})

	// ========================================================================
	// Authorization guards
	// ========================================================================

	describe('authorization', () => {
		it('updatePartyDetails is a no-op when canEdit is false', async () => {
			actions = createActions({ canEdit: () => false })
			await actions.updatePartyDetails({ name: 'Hacked' })
			expect(mutations.party.update.mutateAsync).not.toHaveBeenCalled()
		})

		it('toggleFavorite is a no-op when user is not authenticated', async () => {
			actions = createActions({ getAuthUserId: () => undefined })
			await actions.toggleFavorite()
			expect(mutations.party.favorite.mutateAsync).not.toHaveBeenCalled()
			expect(mutations.party.unfavorite.mutateAsync).not.toHaveBeenCalled()
		})

		it('deleteParty is a no-op when user does not own the party', async () => {
			actions = createActions({ getAuthUserId: () => 'other-user' })
			await actions.deleteParty()
			expect(mutations.party.delete.mutateAsync).not.toHaveBeenCalled()
		})

		it('syncFromCollection requires both canEdit AND hasCollectionLinks', async () => {
			// canEdit=true but no links
			actions = createActions({ getHasCollectionLinks: () => false })
			await actions.syncFromCollection()
			expect(mutations.grid.syncAllItems.mutateAsync).not.toHaveBeenCalled()

			// has links but canEdit=false
			actions = createActions({ canEdit: () => false, getHasCollectionLinks: () => true })
			await actions.syncFromCollection()
			expect(mutations.grid.syncAllItems.mutateAsync).not.toHaveBeenCalled()
		})

		it('handleUnlinkCollection is a no-op when canEdit is false', async () => {
			actions = createActions({ canEdit: () => false })
			await actions.handleUnlinkCollection()
			expect(mutations.grid.unlinkCollectionSource.mutateAsync).not.toHaveBeenCalled()
		})
	})

	// ========================================================================
	// UX behaviors
	// ========================================================================

	describe('UX behaviors', () => {
		it('deleteParty closes dialog on failure so user is not stuck', async () => {
			vi.mocked(mutations.party.delete.mutateAsync).mockRejectedValue(new Error('Delete failed'))
			actions.deleteDialogOpen = true

			await actions.deleteParty()

			expect(actions.deleteDialogOpen).toBe(false)
			expect(actions.error).toBe('Delete failed')
		})

		it('deleting flag resets even on failure', async () => {
			vi.mocked(mutations.party.delete.mutateAsync).mockRejectedValue(new Error('fail'))

			await actions.deleteParty()

			expect(actions.deleting).toBe(false)
		})
	})

	// ========================================================================
	// toggleFavorite: reads fresh party state
	// ========================================================================

	describe('toggleFavorite', () => {
		it('reads party.favorited at call time, not at creation time', async () => {
			// Party starts unfavorited
			party = createTestParty({ favorited: false })
			actions = createActions()

			// External update: party becomes favorited
			party = createTestParty({ favorited: true })

			// toggleFavorite should now call unfavorite (reading fresh state)
			await actions.toggleFavorite()

			expect(mutations.party.unfavorite.mutateAsync).toHaveBeenCalled()
			expect(mutations.party.favorite.mutateAsync).not.toHaveBeenCalled()
		})

		it('favorite and unfavorite are mutually exclusive per call', async () => {
			party = createTestParty({ favorited: false })
			actions = createActions()
			await actions.toggleFavorite()

			expect(mutations.party.favorite.mutateAsync).toHaveBeenCalledTimes(1)
			expect(mutations.party.unfavorite.mutateAsync).toHaveBeenCalledTimes(0)
		})
	})

	// ========================================================================
	// Operation correctness
	// ========================================================================

	describe('operation correctness', () => {
		it('updatePartyDetails merges updates with party identity', async () => {
			await actions.updatePartyDetails({ name: 'New', visibility: 2 })

			expect(mutations.party.update.mutateAsync).toHaveBeenCalledWith({
				id: party.id,
				shortcode: party.shortcode,
				name: 'New',
				visibility: 2
			})
		})

		it('syncFromCollection passes both partyId and partyShortcode', async () => {
			actions = createActions({ getHasCollectionLinks: () => true })
			await actions.syncFromCollection()

			expect(mutations.grid.syncAllItems.mutateAsync).toHaveBeenCalledWith({
				partyId: party.id,
				partyShortcode: party.shortcode
			})
		})

		it('deleteParty passes party identity for server-side deletion', async () => {
			await actions.deleteParty()

			expect(mutations.party.delete.mutateAsync).toHaveBeenCalledWith({
				id: party.id,
				shortcode: party.shortcode
			})
		})
	})

	// ========================================================================
	// Settings pane raid changes (Evoking Solomonis, D12)
	// ========================================================================

	describe('settings pane raid change hook', () => {
		const NEW_RAID = { id: 'raid-new', slug: 'zone' } as Raid

		function saveSettings(raid: Raid | null) {
			actions.openSettingsPanel()
			const { initialValues, onSave } = vi.mocked(openPartyEditSidebar).mock.calls[0]![0]
			const values: PartyEditValues = { ...initialValues, raid, raidId: raid?.id ?? null }
			return onSave!(values)
		}

		it('leaves the raid out of the update when the hook takes it over', async () => {
			const handleRaidChange = vi.fn().mockReturnValue(true)
			actions = createActions({ handleRaidChange })

			await saveSettings(NEW_RAID)

			expect(handleRaidChange).toHaveBeenCalledWith(NEW_RAID)
			const params = vi.mocked(mutations.party.update.mutateAsync).mock.calls[0]![0]
			expect(params).not.toHaveProperty('raidId')
			expect(params).toHaveProperty('name')
		})

		it('sends the raid when the hook declines it', async () => {
			actions = createActions({ handleRaidChange: vi.fn().mockReturnValue(false) })

			await saveSettings(NEW_RAID)

			const params = vi.mocked(mutations.party.update.mutateAsync).mock.calls[0]![0]
			expect(params.raidId).toBe('raid-new')
		})

		it("doesn't call the hook when the raid didn't change", async () => {
			const handleRaidChange = vi.fn().mockReturnValue(true)
			actions = createActions({ handleRaidChange })

			await saveSettings(party.raid ?? null)

			expect(handleRaidChange).not.toHaveBeenCalled()
		})
	})
})
