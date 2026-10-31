/**
 * Tests for the shared grid mutation builders and list transforms.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { QueryClient } from '@tanstack/svelte-query'
import { partyKeys } from '$lib/api/queries/party.queries'
import { collectionKeys } from '$lib/api/queries/collection.queries'
import type { GridWeapon, Party } from '$lib/types/api/party'
import {
	applyGridUncap,
	applyNotesSyncedUpdate,
	invalidatePartyOnSuccess,
	optimisticGridList,
	removeGridItem
} from '../gridShared'
import { createTestQueryClient, seedPartyCache, getCachedParty } from './helpers'
import { MOCK_GRID_WEAPON, MOCK_GRID_WEAPON_2, MOCK_PARTY, MOCK_SHORTCODE } from './fixtures'

vi.mock('$lib/utils/editKeys', () => ({
	getEditKey: vi.fn()
}))

const granblueIdOf = (w: GridWeapon) => w.weapon?.granblueId
const NOTE = { type: 'doc', content: [] }

describe('gridShared', () => {
	let queryClient: QueryClient

	beforeEach(() => {
		queryClient = createTestQueryClient()
		seedPartyCache(queryClient, MOCK_PARTY)
	})

	describe('optimisticGridList', () => {
		it('onMutate writes the transformed list to the given key only', async () => {
			const apply = vi.fn((weapons: GridWeapon[]) => weapons.slice(1))
			const opts = optimisticGridList(queryClient, 'weapons', apply)

			const context = await opts.onMutate({ partyShortcode: MOCK_SHORTCODE })

			const cached = getCachedParty(queryClient, MOCK_SHORTCODE)
			expect(apply).toHaveBeenCalledWith(MOCK_PARTY.weapons, { partyShortcode: MOCK_SHORTCODE })
			expect(cached?.weapons.map((w) => w.id)).toEqual(['gw-2'])
			expect(cached?.summons).toEqual(MOCK_PARTY.summons)
			expect(context.previousParty).toEqual(MOCK_PARTY)
		})

		it('onMutate cancels in-flight party queries first', async () => {
			const spy = vi.spyOn(queryClient, 'cancelQueries')
			const opts = optimisticGridList(queryClient, 'weapons', (w) => w)

			await opts.onMutate({ partyShortcode: MOCK_SHORTCODE })

			expect(spy).toHaveBeenCalledWith({ queryKey: partyKeys.detail(MOCK_SHORTCODE) })
		})

		it('onMutate skips the cache write when the list is missing', async () => {
			const party = { ...MOCK_PARTY, weapons: undefined as unknown as Party['weapons'] }
			queryClient.setQueryData(partyKeys.detail(MOCK_SHORTCODE), party)
			const apply = vi.fn((w: GridWeapon[]) => w)
			const setSpy = vi.spyOn(queryClient, 'setQueryData')
			const opts = optimisticGridList(queryClient, 'weapons', apply)

			const context = await opts.onMutate({ partyShortcode: MOCK_SHORTCODE })

			expect(apply).not.toHaveBeenCalled()
			expect(setSpy).not.toHaveBeenCalled()
			expect(context.previousParty).toEqual(party)
		})

		it('onError restores the snapshot, and does nothing without one', () => {
			const opts = optimisticGridList(queryClient, 'weapons', (w) => w)
			queryClient.setQueryData(partyKeys.detail(MOCK_SHORTCODE), { ...MOCK_PARTY, name: 'X' })

			opts.onError(new Error('fail'), { partyShortcode: MOCK_SHORTCODE }, undefined)
			expect(getCachedParty(queryClient, MOCK_SHORTCODE)?.name).toBe('X')

			opts.onError(
				new Error('fail'),
				{ partyShortcode: MOCK_SHORTCODE },
				{ previousParty: MOCK_PARTY }
			)
			expect(getCachedParty(queryClient, MOCK_SHORTCODE)).toEqual(MOCK_PARTY)
		})

		it('onSettled invalidates the party query', () => {
			const spy = vi.spyOn(queryClient, 'invalidateQueries')
			const opts = optimisticGridList(queryClient, 'weapons', (w) => w)

			opts.onSettled(null, null, { partyShortcode: MOCK_SHORTCODE })

			expect(spy).toHaveBeenCalledWith({ queryKey: partyKeys.detail(MOCK_SHORTCODE) })
		})
	})

	describe('invalidatePartyOnSuccess', () => {
		it('invalidates only the party by default', () => {
			const spy = vi.spyOn(queryClient, 'invalidateQueries')

			invalidatePartyOnSuccess(queryClient).onSuccess(null, { partyShortcode: MOCK_SHORTCODE })

			expect(spy.mock.calls).toEqual([[{ queryKey: partyKeys.detail(MOCK_SHORTCODE) }]])
		})

		it('invalidates the party, then each extra key', () => {
			const spy = vi.spyOn(queryClient, 'invalidateQueries')

			invalidatePartyOnSuccess(queryClient, [collectionKeys.weapons()]).onSuccess(null, {
				partyShortcode: MOCK_SHORTCODE
			})

			expect(spy.mock.calls).toEqual([
				[{ queryKey: partyKeys.detail(MOCK_SHORTCODE) }],
				[{ queryKey: collectionKeys.weapons() }]
			])
		})
	})

	describe('removeGridItem', () => {
		const items = [MOCK_GRID_WEAPON, MOCK_GRID_WEAPON_2]

		it('removes by id when given', () => {
			expect(removeGridItem(items, { id: 'gw-2', position: 1 }).map((w) => w.id)).toEqual(['gw-1'])
		})

		it('removes by position when no id is given', () => {
			expect(removeGridItem(items, { position: 1 }).map((w) => w.id)).toEqual(['gw-2'])
		})
	})

	describe('applyGridUncap', () => {
		it('sets the uncap level and keeps the transcendence step when not given', () => {
			const items = [{ ...MOCK_GRID_WEAPON, transcendenceStep: 2 }, MOCK_GRID_WEAPON_2]

			const result = applyGridUncap(items, { id: 'gw-1', uncapLevel: 5 })

			expect(result[0]).toMatchObject({ uncapLevel: 5, transcendenceStep: 2 })
			expect(result[1]).toBe(MOCK_GRID_WEAPON_2)
		})

		it('sets the transcendence step when given', () => {
			const result = applyGridUncap([MOCK_GRID_WEAPON], {
				id: 'gw-1',
				uncapLevel: 6,
				transcendenceStep: 3
			})

			expect(result[0]).toMatchObject({ uncapLevel: 6, transcendenceStep: 3 })
		})
	})

	describe('applyNotesSyncedUpdate', () => {
		// Two copies of the same weapon plus a different one.
		const twin = { ...MOCK_GRID_WEAPON, id: 'gw-1b', position: 3 }
		const items = [MOCK_GRID_WEAPON, twin, MOCK_GRID_WEAPON_2]

		it('only touches the target when notes are not synced', () => {
			const result = applyNotesSyncedUpdate(items, 'gw-1', { description: NOTE }, granblueIdOf)

			expect(result[0]).toMatchObject({ description: NOTE })
			expect(result[1]).toBe(twin)
			expect(result[2]).toBe(MOCK_GRID_WEAPON_2)
		})

		it('mirrors notes keys onto siblings when the flag is turned on', () => {
			const result = applyNotesSyncedUpdate(
				items,
				'gw-1',
				{ notesSynced: true, description: NOTE, element: 3 },
				granblueIdOf
			)

			expect(result[0]).toMatchObject({ notesSynced: true, description: NOTE, element: 3 })
			expect(result[1]).toMatchObject({ notesSynced: true, description: NOTE })
			expect(result[1]).not.toHaveProperty('element', 3)
			expect(result[2]).toBe(MOCK_GRID_WEAPON_2)
		})

		it('mirrors notes edits on an already-synced item', () => {
			const synced = items.map((w) => ({ ...w, notesSynced: true }))

			const result = applyNotesSyncedUpdate(synced, 'gw-1', { description: NOTE }, granblueIdOf)

			expect(result[1]).toMatchObject({ description: NOTE })
			expect(result[2]).toBe(synced[2])
		})

		it('does not fan out non-notes edits on a synced item', () => {
			const synced = items.map((w) => ({ ...w, notesSynced: true }))

			const result = applyNotesSyncedUpdate(synced, 'gw-1', { element: 3 }, granblueIdOf)

			expect(result[1]).toBe(synced[1])
		})
	})
})
