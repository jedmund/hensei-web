/**
 * Sticker mutation tests: optimistic `mySticker` updates across the party
 * detail and list caches (and registered ones), and rollback on failure.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MutationObserver, type QueryClient } from '@tanstack/svelte-query'
import {
	giveStickerOptions,
	removeStickerOptions,
	patchPartyCollection,
	registerStickerCacheRoot
} from '../sticker.mutations'
import { createTestQueryClient, seedPartyCache, getCachedParty } from './helpers'
import { MOCK_PARTY, MOCK_SHORTCODE } from './fixtures'
import { partyKeys } from '$lib/api/queries/party.queries'
import type { Party } from '$lib/types/api/party'

vi.mock('$lib/api/adapters/sticker.adapter', () => ({
	stickerAdapter: {
		giveSticker: vi.fn(),
		removeSticker: vi.fn()
	}
}))

const { stickerAdapter } = await import('$lib/api/adapters/sticker.adapter')

let queryClient: QueryClient

function run<TVars>(options: object, vars: TVars) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const observer = new MutationObserver<unknown, Error, TVars, any>(queryClient, options as any)
	return observer.mutate(vars)
}

const listKey = partyKeys.list({})
const otherParty: Party = { ...MOCK_PARTY, id: 'other-id', shortcode: 'other' }

function seedList(parties: Party[]) {
	queryClient.setQueryData(listKey, {
		pages: [{ results: parties, page: 1, total: parties.length, totalPages: 1, perPage: 20 }],
		pageParams: [1]
	})
}

function cachedList(): Party[] {
	const data = queryClient.getQueryData<{ pages: Array<{ results: Party[] }> }>(listKey)
	return data?.pages.flatMap((p) => p.results) ?? []
}

beforeEach(() => {
	queryClient = createTestQueryClient()
	vi.clearAllMocks()
})

describe('giveStickerOptions', () => {
	it('sets mySticker on the detail and list caches before the request settles', async () => {
		seedPartyCache(queryClient, { ...MOCK_PARTY, mySticker: null })
		seedList([{ ...MOCK_PARTY, mySticker: null }, otherParty])
		let resolve: (v: string) => void = () => {}
		;(stickerAdapter.giveSticker as ReturnType<typeof vi.fn>).mockReturnValue(
			new Promise<string>((r) => (resolve = r))
		)

		const pending = run(giveStickerOptions(queryClient), {
			id: MOCK_PARTY.id,
			shortcode: MOCK_SHORTCODE,
			slug: 'fast'
		})
		await vi.waitFor(() => expect(stickerAdapter.giveSticker).toHaveBeenCalled())

		expect(getCachedParty(queryClient, MOCK_SHORTCODE)?.mySticker).toBe('fast')
		expect(cachedList().find((p) => p.id === MOCK_PARTY.id)?.mySticker).toBe('fast')
		expect(cachedList().find((p) => p.id === 'other-id')?.mySticker).toBeUndefined()

		resolve('fast')
		await pending
		expect(stickerAdapter.giveSticker).toHaveBeenCalledWith(MOCK_PARTY.id, 'fast', undefined)
	})

	it('does not touch labels', async () => {
		seedPartyCache(queryClient, { ...MOCK_PARTY, labels: ['cleared'], mySticker: null })
		;(stickerAdapter.giveSticker as ReturnType<typeof vi.fn>).mockResolvedValue('fast')

		await run(giveStickerOptions(queryClient), {
			id: MOCK_PARTY.id,
			shortcode: MOCK_SHORTCODE,
			slug: 'fast'
		})

		expect(getCachedParty(queryClient, MOCK_SHORTCODE)?.labels).toEqual(['cleared'])
	})

	it('rolls back every cache when the request fails', async () => {
		seedPartyCache(queryClient, { ...MOCK_PARTY, mySticker: 'cleared' })
		seedList([{ ...MOCK_PARTY, mySticker: 'cleared' }])
		;(stickerAdapter.giveSticker as ReturnType<typeof vi.fn>).mockRejectedValue(
			new Error('forbidden')
		)

		await expect(
			run(giveStickerOptions(queryClient), {
				id: MOCK_PARTY.id,
				shortcode: MOCK_SHORTCODE,
				slug: 'fast'
			})
		).rejects.toThrow('forbidden')

		expect(getCachedParty(queryClient, MOCK_SHORTCODE)?.mySticker).toBe('cleared')
		expect(cachedList()[0]?.mySticker).toBe('cleared')
	})
})

describe('removeStickerOptions', () => {
	it('clears mySticker optimistically', async () => {
		seedPartyCache(queryClient, { ...MOCK_PARTY, mySticker: 'fast' })
		;(stickerAdapter.removeSticker as ReturnType<typeof vi.fn>).mockResolvedValue(undefined)

		await run(removeStickerOptions(queryClient), { id: MOCK_PARTY.id, shortcode: MOCK_SHORTCODE })

		expect(stickerAdapter.removeSticker).toHaveBeenCalledWith(MOCK_PARTY.id)
		expect(getCachedParty(queryClient, MOCK_SHORTCODE)?.mySticker).toBeNull()
	})
})

describe('patchPartyCollection', () => {
	const party = { id: 'p1', shortcode: 'abc', mySticker: null } as unknown as Party
	const patched = { id: 'p1', shortcode: 'abc', mySticker: 'fast' }

	it('handles plain arrays, paginated results and infinite pages', () => {
		expect(patchPartyCollection([party], 'p1', 'fast')).toEqual([patched])
		expect(patchPartyCollection({ results: [party] }, 'p1', 'fast')).toEqual({
			results: [patched]
		})
		expect(patchPartyCollection({ pages: [{ results: [party] }] }, 'p1', 'fast')).toEqual({
			pages: [{ results: [patched] }]
		})
		expect(patchPartyCollection(undefined, 'p1', 'fast')).toBeUndefined()
	})

	it('reaches parties nested deep in a payload', () => {
		const home = {
			current: [{ event: { id: 'ev' }, raids: [{ raid: { id: 'r' }, parties: [party] }] }],
			upcoming: [],
			rising: [party],
			staffPicks: [{ id: 'fp', party }]
		}
		const result = patchPartyCollection(home, 'p1', 'fast') as typeof home
		expect(result.current[0]?.raids[0]?.parties[0]).toEqual(patched)
		expect(result.rising[0]).toEqual(patched)
		expect(result.staffPicks[0]?.party).toEqual(patched)
	})

	it('returns the same reference when the party is not there', () => {
		const data = { results: [{ id: 'other', shortcode: 'x' }] }
		expect(patchPartyCollection(data, 'p1', 'fast')).toBe(data)
	})
})

describe('registerStickerCacheRoot', () => {
	it('updates parties in a registered query tree too', async () => {
		const feedKey = ['feed']
		registerStickerCacheRoot(feedKey)
		registerStickerCacheRoot(['feed'])
		queryClient.setQueryData(feedKey, { sections: [{ parties: [MOCK_PARTY] }] })
		;(stickerAdapter.giveSticker as ReturnType<typeof vi.fn>).mockResolvedValue({ sticker: 'fast' })

		await run(giveStickerOptions(queryClient), {
			id: MOCK_PARTY.id,
			shortcode: MOCK_SHORTCODE,
			slug: 'fast'
		})

		const feed = queryClient.getQueryData<{ sections: Array<{ parties: Party[] }> }>(feedKey)
		expect(feed?.sections[0]?.parties[0]?.mySticker).toBe('fast')
	})
})
