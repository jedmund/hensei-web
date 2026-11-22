import { describe, it, expect, vi, beforeEach } from 'vitest'
import { syncPartyWondersOptions, updatePartyWondersOptions } from '../wonder.mutations'
import { serialSaveScope } from '../serialSaves'
import { wonderAdapter } from '$lib/api/adapters/wonder.adapter'
import { createTestQueryClient, seedPartyCache, getCachedParty } from './helpers'
import type { QueryClient } from '@tanstack/svelte-query'
import type { Party } from '$lib/types/api/party'
import { owned, shield, waterSeal } from '$lib/features/wonders/__fixtures__/catalogue'

vi.mock('svelte-sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

vi.mock('$lib/api/adapters/wonder.adapter', () => ({
	wonderAdapter: {
		updatePartyWonders: vi.fn(),
		syncPartyWonders: vi.fn()
	}
}))

const PARTY = {
	id: 'party-1',
	shortcode: 'abc123',
	favorited: true,
	weapons: [],
	characters: [],
	summons: [],
	wonders: [owned(shield)]
} as unknown as Party

let queryClient: QueryClient

beforeEach(() => {
	vi.clearAllMocks()
	queryClient = createTestQueryClient()
	seedPartyCache(queryClient, PARTY)
})

describe('updatePartyWondersOptions', () => {
	const params = {
		partyId: PARTY.id,
		shortcode: PARTY.shortcode,
		wonders: [{ wonderId: waterSeal.id, level: 20, evolution: 3, possession: null }]
	}

	it('sends the set with the party id', async () => {
		vi.mocked(wonderAdapter.updatePartyWonders).mockResolvedValue([])
		const opts = updatePartyWondersOptions(queryClient, PARTY.id)

		await opts.mutationFn(params)

		expect(wonderAdapter.updatePartyWonders).toHaveBeenCalledWith(
			PARTY.id,
			params.wonders,
			undefined
		)
	})

	it('writes only the returned Wonders into the party', () => {
		const opts = updatePartyWondersOptions(queryClient, PARTY.id)
		const saved = [owned(waterSeal, { level: 20, evolution: 3, image: '9008_20' })]

		opts.onSuccess(saved, params)

		const cached = getCachedParty(queryClient, PARTY.shortcode)
		expect(cached?.wonders).toEqual(saved)
		expect(cached?.favorited).toBe(true)
	})
})

describe('syncPartyWondersOptions', () => {
	const params = { partyId: PARTY.id, shortcode: PARTY.shortcode }

	it('posts for the party', async () => {
		vi.mocked(wonderAdapter.syncPartyWonders).mockResolvedValue([])
		const opts = syncPartyWondersOptions(queryClient, PARTY.id)

		await opts.mutationFn(params)

		expect(wonderAdapter.syncPartyWonders).toHaveBeenCalledWith(PARTY.id, undefined)
	})

	it("shares the update's queue, so a sync and a save run in order", () => {
		const sync = syncPartyWondersOptions(queryClient, PARTY.id)
		const update = updatePartyWondersOptions(queryClient, PARTY.id)

		expect(sync.scope).toEqual(serialSaveScope('wonders', PARTY.id))
		expect(sync.scope).toEqual(update.scope)
		expect(sync.mutationKey).toEqual(update.mutationKey)
	})

	it('writes only the returned Wonders into the party', () => {
		const opts = syncPartyWondersOptions(queryClient, PARTY.id)
		const synced = [owned(waterSeal, { level: 15, evolution: 1, image: '9008_15' })]

		opts.onSuccess(synced, params)

		const cached = getCachedParty(queryClient, PARTY.shortcode)
		expect(cached?.wonders).toEqual(synced)
		expect(cached?.favorited).toBe(true)
	})

	it("toasts the API's error message", async () => {
		const { toast } = await import('svelte-sonner')
		const opts = syncPartyWondersOptions(queryClient, PARTY.id)

		opts.onError({ message: 'Collection is not accessible' })

		expect(toast.error).toHaveBeenCalledWith('Collection is not accessible')
	})
})
