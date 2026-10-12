import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { QueryClient } from '@tanstack/svelte-query'
import { replaceGuidebookOptions, solomonisExpedition } from '../solomonis-guidebook.mutations'
import { solomonisGuidebookAdapter } from '$lib/api/adapters/solomonis-guidebook.adapter'
import { createTestQueryClient, seedPartyCache, getCachedParty } from './helpers'
import { MOCK_PARTY, MOCK_SHORTCODE } from './fixtures'
import { EXPECTED } from '$lib/api/adapters/__tests__/fixtures/solomonis-guidebook.fixtures'
import { addEffect, removeEntry } from '$lib/components/solomonis/guidebook/guidebook'
import type { Party } from '$lib/types/api/party'

vi.mock('$lib/api/adapters/solomonis-guidebook.adapter', () => ({
	solomonisGuidebookAdapter: {
		replaceGuidebook: vi.fn()
	}
}))

vi.mock('$lib/utils/editKeys', () => ({
	getEditKey: vi.fn(() => 'edit-key')
}))

const RUN_PARTY: Party = { ...MOCK_PARTY, solomonis: EXPECTED.runSolomonis }
const guidebook = EXPECTED.runSolomonis.guidebook

let queryClient: QueryClient

beforeEach(() => {
	vi.clearAllMocks()
	queryClient = createTestQueryClient()
	seedPartyCache(queryClient, RUN_PARTY)
})

function cachedGuidebook() {
	return solomonisExpedition(getCachedParty(queryClient, MOCK_SHORTCODE))?.guidebook
}

describe('solomonisExpedition', () => {
	it('returns the full-view object only', () => {
		expect(solomonisExpedition(RUN_PARTY)).toBe(EXPECTED.runSolomonis)
		expect(
			solomonisExpedition({
				...MOCK_PARTY,
				solomonis: { kind: 'run', routeEvokerId: 'x', pledgeLevel: 0 }
			})
		).toBeNull()
		expect(solomonisExpedition(MOCK_PARTY)).toBeNull()
	})
})

describe('replaceGuidebookOptions', () => {
	it('sends the whole list with the edit key', async () => {
		vi.mocked(solomonisGuidebookAdapter.replaceGuidebook).mockResolvedValue(RUN_PARTY)
		const opts = replaceGuidebookOptions(queryClient)

		await opts.mutationFn({ partyId: RUN_PARTY.id, shortcode: MOCK_SHORTCODE, entries: guidebook })

		const [partyId, input, headers] = vi.mocked(solomonisGuidebookAdapter.replaceGuidebook).mock
			.calls[0]!
		expect(partyId).toBe(RUN_PARTY.id)
		expect(input).toHaveLength(guidebook.length)
		expect(input[0]).toMatchObject({ guideEffectId: guidebook[0]!.effect.id, count: 1 })
		expect(headers).toEqual({ 'X-Edit-Key': 'edit-key' })
	})

	it('writes the new list to the cache optimistically', async () => {
		const entries = removeEntry(guidebook, guidebook[0]!.effect.id)
		const opts = replaceGuidebookOptions(queryClient)

		await opts.onMutate({ partyId: RUN_PARTY.id, shortcode: MOCK_SHORTCODE, entries })

		expect(cachedGuidebook()).toEqual(entries)
		const cached = solomonisExpedition(getCachedParty(queryClient, MOCK_SHORTCODE))
		expect(cached?.kind).toBe('run')
		expect(cached?.blessings).toEqual(EXPECTED.runSolomonis.blessings)
	})

	it('replaces the cached party with the response', async () => {
		const opts = replaceGuidebookOptions(queryClient)
		const response: Party = {
			...RUN_PARTY,
			name: 'Saved',
			solomonis: { ...EXPECTED.runSolomonis, guidebook: guidebook.slice(0, 2) }
		}

		opts.onSuccess(response, { partyId: RUN_PARTY.id, shortcode: MOCK_SHORTCODE, entries: [] })

		expect(cachedGuidebook()).toEqual(guidebook.slice(0, 2))
		expect(getCachedParty(queryClient, MOCK_SHORTCODE)?.name).toBe('Saved')
	})

	it('rolls back on error', async () => {
		const extra = EXPECTED.guideEffects.find((e) => e.rarity === 'cursed')!
		const params = {
			partyId: RUN_PARTY.id,
			shortcode: MOCK_SHORTCODE,
			entries: addEffect(guidebook, extra)
		}
		const opts = replaceGuidebookOptions(queryClient)

		const context = await opts.onMutate(params)
		expect(cachedGuidebook()).toHaveLength(guidebook.length + 1)

		opts.onError(new Error('fail'), params, context)
		expect(cachedGuidebook()).toEqual(guidebook)
	})

	it('leaves parties without a full solomonis object alone', async () => {
		seedPartyCache(queryClient, MOCK_PARTY)
		const opts = replaceGuidebookOptions(queryClient)

		await opts.onMutate({ partyId: MOCK_PARTY.id, shortcode: MOCK_SHORTCODE, entries: guidebook })

		expect(getCachedParty(queryClient, MOCK_SHORTCODE)?.solomonis).toBeUndefined()
	})
})
