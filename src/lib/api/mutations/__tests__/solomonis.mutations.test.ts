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
	it('merges the returned party, so seal states and solomonis both update', () => {
		const opts = updateBlessingsOptions(queryClient)
		const solomonis = {
			...(BUILD_PARTY.solomonis as SolomonisExpedition),
			blessings: [],
			blessingCostTotal: 0
		}
		const weapons = BUILD_PARTY.weapons.map((w) =>
			w.position === 2 ? { ...w, sealState: 'sealed' as const } : w
		)
		const server: Party = { ...BUILD_PARTY, solomonis, weapons }

		opts.onSuccess(server, {
			partyId: BUILD_PARTY.id,
			shortcode: BUILD_PARTY.shortcode,
			blessingLevelIds: []
		})

		const cached = getCachedParty(queryClient, BUILD_PARTY.shortcode)
		expect(cached?.solomonis).toEqual(solomonis)
		expect(cached?.weapons).toEqual(weapons)
		expect(cached?.favorited).toBe(true)
	})

	it('caches the party when nothing was cached yet', () => {
		const opts = updateBlessingsOptions(queryClient)
		opts.onSuccess(RUN_PARTY, {
			partyId: RUN_PARTY.id,
			shortcode: RUN_PARTY.shortcode,
			blessingLevelIds: []
		})
		expect(getCachedParty(queryClient, RUN_PARTY.shortcode)?.id).toBe(RUN_PARTY.id)
	})
})
