import { describe, it, expect, vi, beforeEach } from 'vitest'
import { updateBlessingsOptions, updateExpeditionOptions } from '../solomonis.mutations'
import { createTestQueryClient, seedPartyCache, getCachedParty } from './helpers'
import type { QueryClient } from '@tanstack/svelte-query'
import type { Party } from '$lib/types/api/party'
import type { SolomonisExpedition } from '$lib/types/api/solomonis'
import { BUILD_PARTY, RUN_PARTY } from '$lib/components/solomonis/party/__tests__/fixtures'

vi.mock('$lib/api/adapters/solomonis.adapter', () => ({
	solomonisAdapter: {
		updateExpedition: vi.fn(),
		updateBlessings: vi.fn()
	}
}))

let queryClient: QueryClient

beforeEach(() => {
	queryClient = createTestQueryClient()
	seedPartyCache(queryClient, { ...BUILD_PARTY, favorited: true })
})

describe('updateExpeditionOptions', () => {
	it('merges the server party into the cache, keeping fields it lacks', () => {
		const opts = updateExpeditionOptions(queryClient)
		const server: Party = { ...BUILD_PARTY, element: 2 }

		opts.onSuccess(server, {
			partyId: BUILD_PARTY.id,
			shortcode: BUILD_PARTY.shortcode,
			solomonis: { routeEvokerId: 'fraux' }
		})

		const cached = getCachedParty(queryClient, BUILD_PARTY.shortcode)
		expect(cached?.element).toBe(2)
		expect(cached?.favorited).toBe(true)
	})
})

describe('updateBlessingsOptions', () => {
	it("replaces the cached party's solomonis object", () => {
		const opts = updateBlessingsOptions(queryClient)
		const solomonis = {
			...(BUILD_PARTY.solomonis as SolomonisExpedition),
			blessings: [],
			blessingCostTotal: 0
		}

		opts.onSuccess(solomonis, {
			partyId: BUILD_PARTY.id,
			shortcode: BUILD_PARTY.shortcode,
			blessingLevelIds: []
		})

		const cached = getCachedParty(queryClient, BUILD_PARTY.shortcode)
		expect(cached?.solomonis).toEqual(solomonis)
		expect(cached?.weapons).toEqual(BUILD_PARTY.weapons)
	})

	it('leaves an uncached party alone', () => {
		const opts = updateBlessingsOptions(queryClient)
		opts.onSuccess(RUN_PARTY.solomonis as SolomonisExpedition, {
			partyId: RUN_PARTY.id,
			shortcode: RUN_PARTY.shortcode,
			blessingLevelIds: []
		})
		expect(getCachedParty(queryClient, RUN_PARTY.shortcode)).toBeUndefined()
	})
})
