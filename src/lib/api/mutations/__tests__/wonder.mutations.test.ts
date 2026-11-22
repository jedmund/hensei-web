import { describe, it, expect, vi, beforeEach } from 'vitest'
import { updatePartyWondersOptions } from '../wonder.mutations'
import { wonderAdapter } from '$lib/api/adapters/wonder.adapter'
import { createTestQueryClient, seedPartyCache, getCachedParty } from './helpers'
import type { QueryClient } from '@tanstack/svelte-query'
import type { Party } from '$lib/types/api/party'
import { owned, shield, waterSeal } from '$lib/features/wonders/__fixtures__/catalogue'

vi.mock('svelte-sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

vi.mock('$lib/api/adapters/wonder.adapter', () => ({
	wonderAdapter: {
		updatePartyWonders: vi.fn()
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
