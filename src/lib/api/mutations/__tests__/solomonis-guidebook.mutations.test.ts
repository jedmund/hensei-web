import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { QueryClient } from '@tanstack/svelte-query'
import { replaceGuidebookOptions, solomonisExpedition } from '../solomonis-guidebook.mutations'
import { solomonisGuidebookAdapter } from '$lib/api/adapters/solomonis-guidebook.adapter'
import { createTestQueryClient, seedPartyCache, getCachedParty } from './helpers'
import { MOCK_PARTY, MOCK_SHORTCODE } from './fixtures'
import { EXPECTED } from '$lib/api/adapters/__tests__/fixtures/solomonis-guidebook.fixtures'
import { addEffect, removeEntry } from '$lib/components/solomonis/guidebook/guidebook'
import { partyKeys } from '$lib/api/queries/party.queries'
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
				solomonis: { routeEvokerId: 'x', pledgeLevel: 0 }
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
		expect(cached?.routeEvoker).toEqual(EXPECTED.runSolomonis.routeEvoker)
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

describe('replaceGuidebookOptions, saves in a row', () => {
	function deferred<T>() {
		let resolve!: (value: T) => void
		let reject!: (err: unknown) => void
		const promise = new Promise<T>((res, rej) => {
			resolve = res
			reject = rej
		})
		return { promise, resolve, reject }
	}

	/** Runs a save through the mutation cache, as `mutateAsync` does. */
	function run(entries: typeof guidebook) {
		const mutation = queryClient
			.getMutationCache()
			.build(queryClient, replaceGuidebookOptions(queryClient, RUN_PARTY.id))
		return mutation
			.execute({ partyId: RUN_PARTY.id, shortcode: MOCK_SHORTCODE, entries })
			.catch(() => undefined)
	}

	const flush = () => new Promise((resolve) => setTimeout(resolve, 0))
	const listA = guidebook.slice(0, 1)
	const listB = guidebook.slice(0, 2)
	const responseFor = (list: typeof guidebook): Party => ({
		...RUN_PARTY,
		solomonis: { ...EXPECTED.runSolomonis, guidebook: list }
	})

	it('is scoped to the party', () => {
		expect(replaceGuidebookOptions(queryClient, RUN_PARTY.id).scope).toEqual({
			id: `solomonis-guidebook-${RUN_PARTY.id}`
		})
	})

	it('sends the next list only after the previous save settles', async () => {
		const first = deferred<Party>()
		const second = deferred<Party>()
		vi.mocked(solomonisGuidebookAdapter.replaceGuidebook)
			.mockReturnValueOnce(first.promise)
			.mockReturnValueOnce(second.promise)

		const a = run(listA)
		const b = run(listB)
		await flush()
		expect(solomonisGuidebookAdapter.replaceGuidebook).toHaveBeenCalledTimes(1)
		expect(cachedGuidebook()).toEqual(listB)

		// The earlier response doesn't replace the newer, queued list
		first.resolve(responseFor(listA))
		await flush()
		expect(solomonisGuidebookAdapter.replaceGuidebook).toHaveBeenCalledTimes(2)
		expect(cachedGuidebook()).toEqual(listB)

		second.resolve(responseFor(listB))
		await Promise.all([a, b])
		expect(cachedGuidebook()).toEqual(listB)
	})

	it("keeps a later save's list when an earlier save fails", async () => {
		const first = deferred<Party>()
		const second = deferred<Party>()
		vi.mocked(solomonisGuidebookAdapter.replaceGuidebook)
			.mockReturnValueOnce(first.promise)
			.mockReturnValueOnce(second.promise)

		const a = run(listA)
		const b = run(listB)
		await flush()

		first.reject(new Error('fail'))
		await flush()
		expect(cachedGuidebook()).toEqual(listB)

		second.resolve(responseFor(listB))
		await Promise.all([a, b])
		expect(cachedGuidebook()).toEqual(listB)
	})

	it('rolls back and refetches when the last save fails', async () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const first = deferred<Party>()
		const second = deferred<Party>()
		vi.mocked(solomonisGuidebookAdapter.replaceGuidebook)
			.mockReturnValueOnce(first.promise)
			.mockReturnValueOnce(second.promise)

		const a = run(listA)
		const b = run(listB)
		await flush()

		first.reject(new Error('fail'))
		await flush()
		second.reject(new Error('fail'))
		await Promise.all([a, b])

		// Back to the list before the last save; the refetch settles the rest
		expect(cachedGuidebook()).toEqual(listA)
		expect(spy).toHaveBeenCalledTimes(1)
		expect(spy.mock.calls[0]![0]!.queryKey).toEqual(partyKeys.detail(MOCK_SHORTCODE))
	})
})
