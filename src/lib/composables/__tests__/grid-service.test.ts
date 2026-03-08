/**
 * Tests for useGridService composable
 *
 * Focuses on behavioral contracts:
 * - Error handling: errors toast AND propagate to callers
 * - Recovery: service remains usable after a failure
 * - Param contract differences between delete/update/uncap APIs
 * - Guard behavior: uncap silently no-ops when uncapLevel is undefined
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useGridService } from '../grid-service.svelte'
import { createMockMutations, createTestParty } from './helpers'
import type { PartyMutations } from '../party-mutations.svelte'

const { toast } = vi.hoisted(() => ({
	toast: { error: vi.fn(), success: vi.fn() }
}))

vi.mock('svelte-sonner', () => ({ toast }))

vi.mock('$lib/utils/errors', () => ({
	extractErrorMessage: vi.fn((_err: unknown, fallback: string) => fallback)
}))

describe('useGridService', () => {
	let mutations: PartyMutations
	let service: ReturnType<typeof useGridService>
	const party = createTestParty()

	beforeEach(() => {
		mutations = createMockMutations()
		service = useGridService(
			mutations,
			() => party.shortcode,
			() => party.id
		)
		vi.clearAllMocks()
	})

	// ========================================================================
	// Error handling contract: errors are both toasted AND re-thrown
	// This matters because callers (child components) may need to handle the
	// error too (e.g., reverting optimistic UI), while users still see feedback.
	// ========================================================================

	describe('error handling', () => {
		it('shows toast AND re-throws so callers can react', async () => {
			const error = new Error('Server error')
			vi.mocked(mutations.grid.deleteWeapon.mutateAsync).mockRejectedValue(error)

			await expect(service.removeWeapon(party.id, 'gw-1')).rejects.toThrow('Server error')
			expect(toast.error).toHaveBeenCalledWith('Failed to remove weapon')
		})

		it('service remains usable after a failure', async () => {
			vi.mocked(mutations.grid.deleteWeapon.mutateAsync)
				.mockRejectedValueOnce(new Error('Transient'))
				.mockResolvedValueOnce(undefined)

			// First call fails
			await expect(service.removeWeapon(party.id, 'gw-1')).rejects.toThrow()

			// Second call succeeds — service wasn't corrupted
			await service.removeWeapon(party.id, 'gw-1')
			expect(mutations.grid.deleteWeapon.mutateAsync).toHaveBeenCalledTimes(2)
		})

		it('toasts per-type error messages, not generic ones', async () => {
			vi.mocked(mutations.grid.deleteSummon.mutateAsync).mockRejectedValue(new Error('x'))
			vi.mocked(mutations.grid.deleteCharacter.mutateAsync).mockRejectedValue(new Error('x'))
			vi.mocked(mutations.grid.updateWeapon.mutateAsync).mockRejectedValue(new Error('x'))

			await service.removeSummon(party.id, 'gs-1').catch(() => {})
			await service.removeCharacter(party.id, 'gc-1').catch(() => {})
			await service.updateWeapon(party.id, 'gw-1', {}).catch(() => {})

			const messages = toast.error.mock.calls.map((c: unknown[]) => c[0])
			expect(messages).toContain('Failed to remove summon')
			expect(messages).toContain('Failed to remove character')
			expect(messages).toContain('Failed to update weapon')
		})
	})

	// ========================================================================
	// Param contract: delete, update, and uncap mutations each require
	// different fields. Getting these wrong causes API 422s or cache misses.
	// ========================================================================

	describe('API param contracts', () => {
		it('delete mutations include partyId for cache invalidation', async () => {
			await service.removeWeapon(party.id, 'gw-1')

			const args = vi.mocked(mutations.grid.deleteWeapon.mutateAsync).mock.calls[0]?.[0] as Record<string, unknown>
			expect(args).toHaveProperty('partyId', party.id)
			expect(args).toHaveProperty('partyShortcode', party.shortcode)
		})

		it('update mutations use partyShortcode but NOT partyId', async () => {
			await service.updateWeapon(party.id, 'gw-1', { position: 3 })

			const args = vi.mocked(mutations.grid.updateWeapon.mutateAsync).mock.calls[0]?.[0] as Record<string, unknown>
			expect(args).toHaveProperty('partyShortcode', party.shortcode)
			expect(args).not.toHaveProperty('partyId')
		})

		it('uncap mutations include BOTH partyId and partyShortcode', async () => {
			await service.updateWeaponUncap('gw-1', 5, 2)

			const args = vi.mocked(mutations.grid.updateWeaponUncap.mutateAsync).mock.calls[0]?.[0] as Record<string, unknown>
			expect(args).toHaveProperty('partyId', party.id)
			expect(args).toHaveProperty('partyShortcode', party.shortcode)
			expect(args).toHaveProperty('uncapLevel', 5)
			expect(args).toHaveProperty('transcendenceStep', 2)
		})
	})

	// ========================================================================
	// Uncap guard: undefined uncapLevel = no-op
	// This prevents unnecessary API calls when the UI passes undefined
	// (e.g., closing uncap dialog without changing anything).
	// ========================================================================

	describe('uncap guard', () => {
		it('weapon uncap is a no-op when uncapLevel is undefined', async () => {
			await service.updateWeaponUncap('gw-1', undefined, 2)
			expect(mutations.grid.updateWeaponUncap.mutateAsync).not.toHaveBeenCalled()
		})

		it('character uncap is a no-op when uncapLevel is undefined', async () => {
			await service.updateCharacterUncap('gc-1', undefined, 1)
			expect(mutations.grid.updateCharacterUncap.mutateAsync).not.toHaveBeenCalled()
		})

		it('summon uncap is a no-op when uncapLevel is undefined', async () => {
			await service.updateSummonUncap('gs-1', undefined, 0)
			expect(mutations.grid.updateSummonUncap.mutateAsync).not.toHaveBeenCalled()
		})

		it('uncap proceeds when uncapLevel is 0 (valid value)', async () => {
			await service.updateWeaponUncap('gw-1', 0, 0)
			expect(mutations.grid.updateWeaponUncap.mutateAsync).toHaveBeenCalled()
		})
	})

	// ========================================================================
	// Type dispatch: each remove/update/uncap hits the right mutation.
	// A copy-paste error during extraction would route to the wrong type.
	// ========================================================================

	describe('type dispatch correctness', () => {
		it('remove operations each hit their own mutation', async () => {
			await service.removeWeapon(party.id, 'gw-1')
			await service.removeSummon(party.id, 'gs-1')
			await service.removeCharacter(party.id, 'gc-1')

			expect(mutations.grid.deleteWeapon.mutateAsync).toHaveBeenCalledTimes(1)
			expect(mutations.grid.deleteSummon.mutateAsync).toHaveBeenCalledTimes(1)
			expect(mutations.grid.deleteCharacter.mutateAsync).toHaveBeenCalledTimes(1)
		})

		it('update operations each hit their own mutation', async () => {
			await service.updateWeapon(party.id, 'gw-1', {})
			await service.updateSummon(party.id, 'gs-1', {})
			await service.updateCharacter(party.id, 'gc-1', {})

			expect(mutations.grid.updateWeapon.mutateAsync).toHaveBeenCalledTimes(1)
			expect(mutations.grid.updateSummon.mutateAsync).toHaveBeenCalledTimes(1)
			expect(mutations.grid.updateCharacter.mutateAsync).toHaveBeenCalledTimes(1)
		})

		it('uncap operations each hit their own mutation', async () => {
			await service.updateWeaponUncap('gw-1', 5, 0)
			await service.updateCharacterUncap('gc-1', 5, 0)
			await service.updateSummonUncap('gs-1', 5, 0)

			expect(mutations.grid.updateWeaponUncap.mutateAsync).toHaveBeenCalledTimes(1)
			expect(mutations.grid.updateCharacterUncap.mutateAsync).toHaveBeenCalledTimes(1)
			expect(mutations.grid.updateSummonUncap.mutateAsync).toHaveBeenCalledTimes(1)
		})
	})

	// ========================================================================
	// Getter freshness: the service uses getPartyShortcode/getPartyId getters,
	// not captured values. If the party changes (e.g., after creation), the
	// service should use the new values.
	// ========================================================================

	describe('getter freshness', () => {
		it('uses current shortcode, not the one at creation time', async () => {
			let currentShortcode = 'OLD'
			const freshService = useGridService(
				mutations,
				() => currentShortcode,
				() => party.id
			)

			currentShortcode = 'NEW'
			await freshService.removeWeapon(party.id, 'gw-1')

			const args = vi.mocked(mutations.grid.deleteWeapon.mutateAsync).mock.calls[0]?.[0] as Record<string, unknown>
			expect(args).toHaveProperty('partyShortcode', 'NEW')
		})
	})
})
