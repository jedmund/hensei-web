/**
 * Tests for grid mutation options factories
 *
 * Tests cache operations (optimistic updates, rollbacks, invalidation)
 * by calling options callbacks directly against a real QueryClient.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { partyKeys } from '$lib/api/queries/party.queries'
import {
	createGridMutation,
	updateGridWeaponOptions,
	deleteGridWeaponOptions,
	updateWeaponUncapOptions,
	updateGridCharacterOptions,
	deleteGridCharacterOptions,
	updateCharacterUncapOptions,
	updateGridSummonOptions,
	deleteGridSummonOptions,
	updateSummonUncapOptions,
	updateQuickSummonOptions
} from '../grid.mutations'
import { createTestQueryClient, seedPartyCache, getCachedParty } from './helpers'
import { MOCK_PARTY, MOCK_SHORTCODE } from './fixtures'
import type { QueryClient } from '@tanstack/svelte-query'

// Mock adapter modules — we only test cache behavior, not API calls
vi.mock('$lib/api/adapters/grid.adapter', () => ({
	gridAdapter: {
		createWeapon: vi.fn().mockResolvedValue({}),
		updateWeapon: vi.fn().mockResolvedValue({}),
		deleteWeapon: vi.fn().mockResolvedValue({}),
		updateWeaponUncap: vi.fn().mockResolvedValue({}),
		resolveWeaponConflict: vi.fn().mockResolvedValue({}),
		swapWeapons: vi.fn().mockResolvedValue({}),
		createCharacter: vi.fn().mockResolvedValue({}),
		updateCharacter: vi.fn().mockResolvedValue({}),
		deleteCharacter: vi.fn().mockResolvedValue({}),
		updateCharacterUncap: vi.fn().mockResolvedValue({}),
		resolveCharacterConflict: vi.fn().mockResolvedValue({}),
		swapCharacters: vi.fn().mockResolvedValue({}),
		createSummon: vi.fn().mockResolvedValue({}),
		updateSummon: vi.fn().mockResolvedValue({}),
		deleteSummon: vi.fn().mockResolvedValue({}),
		updateSummonUncap: vi.fn().mockResolvedValue({}),
		updateQuickSummon: vi.fn().mockResolvedValue({}),
		swapSummons: vi.fn().mockResolvedValue({}),
		syncCharacter: vi.fn().mockResolvedValue({}),
		syncWeapon: vi.fn().mockResolvedValue({}),
		syncSummon: vi.fn().mockResolvedValue({}),
		syncAllPartyItems: vi.fn().mockResolvedValue({}),
		unlinkCollectionSource: vi.fn().mockResolvedValue({})
	}
}))

vi.mock('$lib/utils/editKeys', () => ({
	getEditKey: vi.fn()
}))

vi.mock('$lib/query/cacheHelpers', () => ({}))

describe('grid mutations', () => {
	let queryClient: QueryClient

	beforeEach(() => {
		queryClient = createTestQueryClient()
		seedPartyCache(queryClient, MOCK_PARTY)
		vi.clearAllMocks()
	})

	// ========================================================================
	// createGridMutation wrapper
	// ========================================================================

	describe('createGridMutation', () => {
		it('calls adapter without X-Edit-Key when no edit key exists', async () => {
			const { getEditKey } = await import('$lib/utils/editKeys')
			vi.mocked(getEditKey).mockReturnValue(null)

			const mockAdapter = vi.fn().mockResolvedValue({ id: 'result' })
			const wrapped = createGridMutation(mockAdapter)

			await wrapped({ partyId: 'some-shortcode', weaponId: 'w1', position: 1 })

			expect(mockAdapter).toHaveBeenCalledWith(
				{ partyId: 'some-shortcode', weaponId: 'w1', position: 1 },
				undefined
			)
		})

		it('injects X-Edit-Key header when edit key exists', async () => {
			const { getEditKey } = await import('$lib/utils/editKeys')
			vi.mocked(getEditKey).mockReturnValue('secret-edit-key')

			const mockAdapter = vi.fn().mockResolvedValue({ id: 'result' })
			const wrapped = createGridMutation(mockAdapter)

			await wrapped({ partyId: 'some-shortcode', weaponId: 'w1', position: 1 })

			expect(mockAdapter).toHaveBeenCalledWith(
				{ partyId: 'some-shortcode', weaponId: 'w1', position: 1 },
				{ 'X-Edit-Key': 'secret-edit-key' }
			)
		})

		it('skips edit key lookup for numeric partyId', async () => {
			const { getEditKey } = await import('$lib/utils/editKeys')

			const mockAdapter = vi.fn().mockResolvedValue({ id: 'result' })
			const wrapped = createGridMutation(mockAdapter)

			await wrapped({ partyId: 123, weaponId: 'w1', position: 1 })

			expect(getEditKey).not.toHaveBeenCalled()
			expect(mockAdapter).toHaveBeenCalledWith(
				{ partyId: 123, weaponId: 'w1', position: 1 },
				undefined
			)
		})
	})

	// ========================================================================
	// Weapon Mutations
	// ========================================================================

	describe('updateGridWeaponOptions', () => {
		it('onMutate optimistically updates the weapon in cache', async () => {
			const opts = updateGridWeaponOptions(queryClient)

			const context = await opts.onMutate({
				id: 'gw-1',
				partyShortcode: MOCK_SHORTCODE,
				updates: { element: 3 }
			})

			const cached = getCachedParty(queryClient, MOCK_SHORTCODE)
			expect(cached?.weapons[0]).toMatchObject({ id: 'gw-1', element: 3 })
			expect(cached?.weapons[1].id).toBe('gw-2') // other weapon untouched
			expect(context?.previousParty).toEqual(MOCK_PARTY)
		})

		it('onMutate handles missing weapons array', async () => {
			const partyWithoutWeapons = { ...MOCK_PARTY, weapons: undefined as any }
			queryClient.setQueryData(partyKeys.detail(MOCK_SHORTCODE), partyWithoutWeapons)

			const opts = updateGridWeaponOptions(queryClient)
			const context = await opts.onMutate({
				id: 'gw-1',
				partyShortcode: MOCK_SHORTCODE,
				updates: { element: 3 }
			})

			expect(context?.previousParty).toEqual(partyWithoutWeapons)
		})

		it('onError rolls back to previous party', () => {
			const opts = updateGridWeaponOptions(queryClient)
			const modifiedParty = { ...MOCK_PARTY, name: 'Modified' }
			queryClient.setQueryData(partyKeys.detail(MOCK_SHORTCODE), modifiedParty)

			opts.onError(new Error('fail'), { partyShortcode: MOCK_SHORTCODE } as any, {
				previousParty: MOCK_PARTY
			})

			expect(getCachedParty(queryClient, MOCK_SHORTCODE)).toEqual(MOCK_PARTY)
		})

		it('onError does nothing without context', () => {
			const opts = updateGridWeaponOptions(queryClient)

			opts.onError(new Error('fail'), { partyShortcode: MOCK_SHORTCODE } as any, undefined)

			expect(getCachedParty(queryClient, MOCK_SHORTCODE)).toEqual(MOCK_PARTY)
		})

		it('onSettled invalidates the party query', () => {
			const opts = updateGridWeaponOptions(queryClient)
			const spy = vi.spyOn(queryClient, 'invalidateQueries')

			opts.onSettled(null, null, { partyShortcode: MOCK_SHORTCODE } as any)

			expect(spy).toHaveBeenCalledWith({ queryKey: partyKeys.detail(MOCK_SHORTCODE) })
		})
	})

	describe('deleteGridWeaponOptions', () => {
		it('onMutate removes weapon by id', async () => {
			const opts = deleteGridWeaponOptions(queryClient)

			await opts.onMutate({ partyShortcode: MOCK_SHORTCODE, id: 'gw-1' })

			const cached = getCachedParty(queryClient, MOCK_SHORTCODE)
			expect(cached?.weapons).toHaveLength(1)
			expect(cached?.weapons[0].id).toBe('gw-2')
		})

		it('onMutate removes weapon by position when id is undefined', async () => {
			const opts = deleteGridWeaponOptions(queryClient)

			await opts.onMutate({ partyShortcode: MOCK_SHORTCODE, id: undefined, position: 2 })

			const cached = getCachedParty(queryClient, MOCK_SHORTCODE)
			expect(cached?.weapons).toHaveLength(1)
			expect(cached?.weapons[0].id).toBe('gw-1')
		})

		it('onError restores deleted weapon', async () => {
			const opts = deleteGridWeaponOptions(queryClient)

			await opts.onMutate({ partyShortcode: MOCK_SHORTCODE, id: 'gw-1' })
			opts.onError(new Error('fail'), { partyShortcode: MOCK_SHORTCODE } as any, {
				previousParty: MOCK_PARTY
			})

			const cached = getCachedParty(queryClient, MOCK_SHORTCODE)
			expect(cached?.weapons).toHaveLength(2)
		})
	})

	describe('updateWeaponUncapOptions', () => {
		it('onMutate updates uncapLevel on correct weapon', async () => {
			const opts = updateWeaponUncapOptions(queryClient)

			await opts.onMutate({
				partyShortcode: MOCK_SHORTCODE,
				id: 'gw-1',
				partyId: 'party-uuid',
				uncapLevel: 6
			})

			const cached = getCachedParty(queryClient, MOCK_SHORTCODE)
			expect(cached?.weapons[0].uncapLevel).toBe(6)
			expect(cached?.weapons[1].uncapLevel).toBe(4) // untouched
		})

		it('onMutate updates transcendenceStep when provided', async () => {
			const opts = updateWeaponUncapOptions(queryClient)

			await opts.onMutate({
				partyShortcode: MOCK_SHORTCODE,
				id: 'gw-1',
				partyId: 'party-uuid',
				uncapLevel: 6,
				transcendenceStep: 3
			})

			const cached = getCachedParty(queryClient, MOCK_SHORTCODE)
			expect(cached?.weapons[0].transcendenceStep).toBe(3)
		})

		it('onMutate does not set transcendenceStep when undefined', async () => {
			const opts = updateWeaponUncapOptions(queryClient)

			await opts.onMutate({
				partyShortcode: MOCK_SHORTCODE,
				id: 'gw-1',
				partyId: 'party-uuid',
				uncapLevel: 6,
				transcendenceStep: undefined
			})

			const cached = getCachedParty(queryClient, MOCK_SHORTCODE)
			expect(cached?.weapons[0].transcendenceStep).toBe(0) // original value preserved
		})
	})

	// ========================================================================
	// Character Mutations
	// ========================================================================

	describe('updateGridCharacterOptions', () => {
		it('onMutate optimistically updates the character in cache', async () => {
			const opts = updateGridCharacterOptions(queryClient)

			const context = await opts.onMutate({
				id: 'gc-1',
				partyShortcode: MOCK_SHORTCODE,
				updates: { perpetuity: true }
			})

			const cached = getCachedParty(queryClient, MOCK_SHORTCODE)
			expect(cached?.characters[0]).toMatchObject({ id: 'gc-1', perpetuity: true })
			expect(cached?.characters[1].id).toBe('gc-2')
			expect(context?.previousParty).toEqual(MOCK_PARTY)
		})

		it('onError rolls back to previous party', () => {
			const opts = updateGridCharacterOptions(queryClient)

			opts.onError(new Error('fail'), { partyShortcode: MOCK_SHORTCODE } as any, {
				previousParty: MOCK_PARTY
			})

			expect(getCachedParty(queryClient, MOCK_SHORTCODE)).toEqual(MOCK_PARTY)
		})
	})

	describe('deleteGridCharacterOptions', () => {
		it('onMutate removes character by id', async () => {
			const opts = deleteGridCharacterOptions(queryClient)

			await opts.onMutate({ partyShortcode: MOCK_SHORTCODE, id: 'gc-1' })

			const cached = getCachedParty(queryClient, MOCK_SHORTCODE)
			expect(cached?.characters).toHaveLength(1)
			expect(cached?.characters[0].id).toBe('gc-2')
		})

		it('onMutate removes character by position', async () => {
			const opts = deleteGridCharacterOptions(queryClient)

			await opts.onMutate({ partyShortcode: MOCK_SHORTCODE, id: undefined, position: 2 })

			const cached = getCachedParty(queryClient, MOCK_SHORTCODE)
			expect(cached?.characters).toHaveLength(1)
			expect(cached?.characters[0].id).toBe('gc-1')
		})
	})

	describe('updateCharacterUncapOptions', () => {
		it('onMutate updates uncapLevel and transcendenceStep', async () => {
			const opts = updateCharacterUncapOptions(queryClient)

			await opts.onMutate({
				partyShortcode: MOCK_SHORTCODE,
				id: 'gc-1',
				partyId: 'party-uuid',
				uncapLevel: 6,
				transcendenceStep: 2
			})

			const cached = getCachedParty(queryClient, MOCK_SHORTCODE)
			expect(cached?.characters[0].uncapLevel).toBe(6)
			expect(cached?.characters[0].transcendenceStep).toBe(2)
		})
	})

	// ========================================================================
	// Summon Mutations
	// ========================================================================

	describe('updateGridSummonOptions', () => {
		it('onMutate optimistically updates the summon in cache', async () => {
			const opts = updateGridSummonOptions(queryClient)

			const context = await opts.onMutate({
				id: 'gs-1',
				partyShortcode: MOCK_SHORTCODE,
				updates: { quickSummon: false }
			})

			const cached = getCachedParty(queryClient, MOCK_SHORTCODE)
			expect(cached?.summons[0]).toMatchObject({ id: 'gs-1', quickSummon: false })
			expect(cached?.summons[1].id).toBe('gs-2')
			expect(context?.previousParty).toEqual(MOCK_PARTY)
		})

		it('onError rolls back to previous party', () => {
			const opts = updateGridSummonOptions(queryClient)

			opts.onError(new Error('fail'), { partyShortcode: MOCK_SHORTCODE } as any, {
				previousParty: MOCK_PARTY
			})

			expect(getCachedParty(queryClient, MOCK_SHORTCODE)).toEqual(MOCK_PARTY)
		})
	})

	describe('deleteGridSummonOptions', () => {
		it('onMutate removes summon by id', async () => {
			const opts = deleteGridSummonOptions(queryClient)

			await opts.onMutate({ partyShortcode: MOCK_SHORTCODE, id: 'gs-1' })

			const cached = getCachedParty(queryClient, MOCK_SHORTCODE)
			expect(cached?.summons).toHaveLength(1)
			expect(cached?.summons[0].id).toBe('gs-2')
		})

		it('onMutate removes summon by position', async () => {
			const opts = deleteGridSummonOptions(queryClient)

			await opts.onMutate({ partyShortcode: MOCK_SHORTCODE, id: undefined, position: 2 })

			const cached = getCachedParty(queryClient, MOCK_SHORTCODE)
			expect(cached?.summons).toHaveLength(1)
			expect(cached?.summons[0].id).toBe('gs-1')
		})
	})

	describe('updateSummonUncapOptions', () => {
		it('onMutate updates uncapLevel and transcendenceStep', async () => {
			const opts = updateSummonUncapOptions(queryClient)

			await opts.onMutate({
				partyShortcode: MOCK_SHORTCODE,
				id: 'gs-1',
				partyId: 'party-uuid',
				uncapLevel: 6,
				transcendenceStep: 4
			})

			const cached = getCachedParty(queryClient, MOCK_SHORTCODE)
			expect(cached?.summons[0].uncapLevel).toBe(6)
			expect(cached?.summons[0].transcendenceStep).toBe(4)
		})

		it('onMutate preserves original transcendenceStep when undefined', async () => {
			const opts = updateSummonUncapOptions(queryClient)

			await opts.onMutate({
				partyShortcode: MOCK_SHORTCODE,
				id: 'gs-1',
				partyId: 'party-uuid',
				uncapLevel: 6,
				transcendenceStep: undefined
			})

			const cached = getCachedParty(queryClient, MOCK_SHORTCODE)
			expect(cached?.summons[0].transcendenceStep).toBe(2) // original value
		})
	})

	describe('updateQuickSummonOptions', () => {
		it('onMutate toggles quickSummon to false', async () => {
			const opts = updateQuickSummonOptions(queryClient)

			await opts.onMutate({
				partyShortcode: MOCK_SHORTCODE,
				id: 'gs-1',
				quickSummon: false
			})

			const cached = getCachedParty(queryClient, MOCK_SHORTCODE)
			expect(cached?.summons[0].quickSummon).toBe(false)
		})

		it('onMutate toggles quickSummon to true', async () => {
			const opts = updateQuickSummonOptions(queryClient)

			await opts.onMutate({
				partyShortcode: MOCK_SHORTCODE,
				id: 'gs-2',
				quickSummon: true
			})

			const cached = getCachedParty(queryClient, MOCK_SHORTCODE)
			expect(cached?.summons[1].quickSummon).toBe(true)
		})

		it('onError rolls back quickSummon change', async () => {
			const opts = updateQuickSummonOptions(queryClient)

			const context = await opts.onMutate({
				partyShortcode: MOCK_SHORTCODE,
				id: 'gs-1',
				quickSummon: false
			})

			opts.onError(new Error('fail'), { partyShortcode: MOCK_SHORTCODE } as any, context)

			const cached = getCachedParty(queryClient, MOCK_SHORTCODE)
			expect(cached?.summons[0].quickSummon).toBe(true) // restored
		})
	})

})
