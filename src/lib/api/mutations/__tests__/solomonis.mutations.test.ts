import { describe, it, expect, vi, beforeEach } from 'vitest'
import { updateBlessingsOptions, updateExpeditionOptions } from '../solomonis.mutations'
import { solomonisAdapter } from '$lib/api/adapters/solomonis.adapter'
import { createTestQueryClient, seedPartyCache, getCachedParty } from './helpers'
import type { QueryClient } from '@tanstack/svelte-query'
import type { Party } from '$lib/types/api/party'
import type { SolomonisExpedition } from '$lib/types/api/solomonis'
import { toast } from 'svelte-sonner'
import * as m from '$lib/paraglide/messages'
import { BUILD_PARTY, RUN_PARTY } from '$lib/components/solomonis/party/__tests__/fixtures'

vi.mock('svelte-sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

vi.mock('$lib/api/adapters/solomonis.adapter', () => ({
	solomonisAdapter: {
		updateExpedition: vi.fn(),
		updateBlessings: vi.fn()
	}
}))

let queryClient: QueryClient

beforeEach(() => {
	vi.clearAllMocks()
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

describe('updateBlessingsOptions, saves in a row', () => {
	it('is scoped to the party', () => {
		expect(updateBlessingsOptions(queryClient, BUILD_PARTY.id).scope).toEqual({
			id: `solomonis-blessings-${BUILD_PARTY.id}`
		})
	})

	it('sends the next loadout after the previous one settles; the last response wins', async () => {
		let resolveFirst!: (value: Party) => void
		vi.mocked(solomonisAdapter.updateBlessings)
			.mockReturnValueOnce(new Promise<Party>((resolve) => (resolveFirst = resolve)))
			.mockResolvedValueOnce({ ...BUILD_PARTY, name: 'Second' })
		const run = (blessingLevelIds: string[]) =>
			queryClient
				.getMutationCache()
				.build(queryClient, updateBlessingsOptions(queryClient, BUILD_PARTY.id))
				.execute({ partyId: BUILD_PARTY.id, shortcode: BUILD_PARTY.shortcode, blessingLevelIds })

		const first = run(['a'])
		const second = run(['a', 'b'])
		await new Promise((resolve) => setTimeout(resolve, 0))
		expect(solomonisAdapter.updateBlessings).toHaveBeenCalledTimes(1)

		resolveFirst({ ...BUILD_PARTY, name: 'First' })
		await Promise.all([first, second])

		expect(solomonisAdapter.updateBlessings).toHaveBeenCalledTimes(2)
		expect(getCachedParty(queryClient, BUILD_PARTY.shortcode)?.name).toBe('Second')
	})

	it('toasts a failed save once, with no component mounted', async () => {
		vi.mocked(solomonisAdapter.updateBlessings).mockRejectedValueOnce({})

		await queryClient
			.getMutationCache()
			.build(queryClient, updateBlessingsOptions(queryClient, BUILD_PARTY.id))
			.execute({ partyId: BUILD_PARTY.id, shortcode: BUILD_PARTY.shortcode, blessingLevelIds: [] })
			.catch(() => undefined)

		expect(toast.error).toHaveBeenCalledTimes(1)
		expect(toast.error).toHaveBeenCalledWith(m.solomonis_web_party_blessings_save_failed())
	})
})
