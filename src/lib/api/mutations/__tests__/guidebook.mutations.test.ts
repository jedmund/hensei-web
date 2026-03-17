import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
	updatePartyGuidebookOptions,
	removePartyGuidebookOptions
} from '../guidebook.mutations'
import { createTestQueryClient, seedPartyCache, getCachedParty } from './helpers'
import { MOCK_PARTY, MOCK_SHORTCODE, MOCK_GUIDEBOOK_1, MOCK_GUIDEBOOK_2 } from './fixtures'
import type { QueryClient } from '@tanstack/svelte-query'
import type { Guidebook } from '$lib/types/api/entities'

vi.mock('$lib/api/adapters/party.adapter', () => ({
	partyAdapter: {
		updateGuidebook: vi.fn(),
		removeGuidebook: vi.fn()
	}
}))

let queryClient: QueryClient

beforeEach(() => {
	queryClient = createTestQueryClient()
	seedPartyCache(queryClient, MOCK_PARTY)
})

const MOCK_NEW_GUIDEBOOK: Guidebook = {
	id: 'guidebook-new',
	granblueId: 999,
	name: { en: 'New Guidebook', ja: '新教本' },
	slug: 'new-guidebook'
}

// ============================================================================
// updatePartyGuidebook
// ============================================================================

describe('updatePartyGuidebookOptions', () => {
	it('optimistically sets guidebook at the given position', async () => {
		const opts = updatePartyGuidebookOptions(queryClient)

		await opts.onMutate({
			partyId: MOCK_PARTY.id,
			shortcode: MOCK_SHORTCODE,
			guidebookId: MOCK_NEW_GUIDEBOOK.id,
			guidebook: MOCK_NEW_GUIDEBOOK,
			position: 3
		})

		const cached = getCachedParty(queryClient, MOCK_SHORTCODE)
		expect(cached?.guidebooks?.[3]).toEqual(MOCK_NEW_GUIDEBOOK)
	})

	it('preserves other guidebook positions during optimistic update', async () => {
		const opts = updatePartyGuidebookOptions(queryClient)

		await opts.onMutate({
			partyId: MOCK_PARTY.id,
			shortcode: MOCK_SHORTCODE,
			guidebookId: MOCK_NEW_GUIDEBOOK.id,
			guidebook: MOCK_NEW_GUIDEBOOK,
			position: 3
		})

		const cached = getCachedParty(queryClient, MOCK_SHORTCODE)
		expect(cached?.guidebooks?.[1]).toEqual(MOCK_GUIDEBOOK_1)
		expect(cached?.guidebooks?.[2]).toEqual(MOCK_GUIDEBOOK_2)
	})

	it('returns snapshot for rollback', async () => {
		const opts = updatePartyGuidebookOptions(queryClient)

		const context = await opts.onMutate({
			partyId: MOCK_PARTY.id,
			shortcode: MOCK_SHORTCODE,
			guidebookId: MOCK_NEW_GUIDEBOOK.id,
			guidebook: MOCK_NEW_GUIDEBOOK,
			position: 1
		})

		expect(context.previousParty).toEqual(MOCK_PARTY)
	})

	it('rolls back on error', async () => {
		const opts = updatePartyGuidebookOptions(queryClient)
		const params = {
			partyId: MOCK_PARTY.id,
			shortcode: MOCK_SHORTCODE,
			guidebookId: MOCK_NEW_GUIDEBOOK.id,
			guidebook: MOCK_NEW_GUIDEBOOK,
			position: 1 as const
		}

		const context = await opts.onMutate(params)
		opts.onError(new Error('fail'), params, context)

		const cached = getCachedParty(queryClient, MOCK_SHORTCODE)
		expect(cached?.guidebooks?.[1]).toEqual(MOCK_GUIDEBOOK_1)
	})

	it('does nothing on error without context', () => {
		const opts = updatePartyGuidebookOptions(queryClient)

		opts.onError(
			new Error('fail'),
			{
				partyId: MOCK_PARTY.id,
				shortcode: MOCK_SHORTCODE,
				guidebookId: 'x',
				guidebook: MOCK_NEW_GUIDEBOOK,
				position: 1
			},
			undefined
		)

		expect(getCachedParty(queryClient, MOCK_SHORTCODE)).toEqual(MOCK_PARTY)
	})

	it('invalidates party on settled', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = updatePartyGuidebookOptions(queryClient)

		opts.onSettled(undefined, undefined, {
			partyId: MOCK_PARTY.id,
			shortcode: MOCK_SHORTCODE,
			guidebookId: 'x',
			guidebook: MOCK_NEW_GUIDEBOOK,
			position: 1
		})

		const keys = spy.mock.calls.map((c) => c[0]!.queryKey)
		expect(keys).toContainEqual(['party', MOCK_SHORTCODE])
	})
})

// ============================================================================
// removePartyGuidebook
// ============================================================================

describe('removePartyGuidebookOptions', () => {
	it('optimistically removes guidebook from slot', async () => {
		const opts = removePartyGuidebookOptions(queryClient)

		await opts.onMutate({
			partyId: MOCK_PARTY.id,
			shortcode: MOCK_SHORTCODE,
			position: 1
		})

		const cached = getCachedParty(queryClient, MOCK_SHORTCODE)
		expect(cached?.guidebooks?.[1]).toBeUndefined()
		expect(cached?.guidebooks?.[2]).toEqual(MOCK_GUIDEBOOK_2)
	})

	it('returns snapshot for rollback', async () => {
		const opts = removePartyGuidebookOptions(queryClient)

		const context = await opts.onMutate({
			partyId: MOCK_PARTY.id,
			shortcode: MOCK_SHORTCODE,
			position: 1
		})

		expect(context.previousParty?.guidebooks?.[1]).toEqual(MOCK_GUIDEBOOK_1)
	})

	it('rolls back on error', async () => {
		const opts = removePartyGuidebookOptions(queryClient)
		const params = {
			partyId: MOCK_PARTY.id,
			shortcode: MOCK_SHORTCODE,
			position: 1 as const
		}

		const context = await opts.onMutate(params)
		opts.onError(new Error('fail'), params, context)

		const cached = getCachedParty(queryClient, MOCK_SHORTCODE)
		expect(cached?.guidebooks?.[1]).toEqual(MOCK_GUIDEBOOK_1)
	})

	it('does nothing on error without context', () => {
		const opts = removePartyGuidebookOptions(queryClient)

		opts.onError(
			new Error('fail'),
			{ partyId: MOCK_PARTY.id, shortcode: MOCK_SHORTCODE, position: 1 },
			undefined
		)

		expect(getCachedParty(queryClient, MOCK_SHORTCODE)).toEqual(MOCK_PARTY)
	})

	it('invalidates party on settled', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = removePartyGuidebookOptions(queryClient)

		opts.onSettled(undefined, undefined, {
			partyId: MOCK_PARTY.id,
			shortcode: MOCK_SHORTCODE,
			position: 1
		})

		const keys = spy.mock.calls.map((c) => c[0]!.queryKey)
		expect(keys).toContainEqual(['party', MOCK_SHORTCODE])
	})
})
