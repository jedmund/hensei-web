import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { CharacterRefreshAdapter, refreshFailure } from '../characterRefresh.adapter'
import { API } from './fixtures/characterRefresh.fixtures'
import { mockApiResponse } from './fixtures/helpers'

const BASE = 'https://api.example.com'
const CHARACTER_ID = '0b6f1d2e-0000-4000-8000-000000000001'

/** A fetch that fails with the given status and JSON body */
function mockApiError(status: number, body: unknown) {
	return vi.fn().mockResolvedValue({
		ok: false,
		status,
		statusText: 'Error',
		json: async () => body
	})
}

function lastCall() {
	const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls
	const [url, init] = calls[calls.length - 1]!
	return { url: url as string, init: init as RequestInit }
}

describe('CharacterRefreshAdapter', () => {
	let adapter: CharacterRefreshAdapter
	let originalFetch: typeof global.fetch

	beforeEach(() => {
		originalFetch = global.fetch
		adapter = new CharacterRefreshAdapter({ baseURL: BASE })
	})

	afterEach(() => {
		global.fetch = originalFetch
	})

	describe('preview', () => {
		it('POSTs a fetching, non-writing reparse', async () => {
			global.fetch = mockApiResponse(API.reparsePreviewChanges)

			await adapter.preview(CHARACTER_ID, { refetchJp: true })

			const { url, init } = lastCall()
			expect(url).toBe(`${BASE}/characters/${CHARACTER_ID}/reparse`)
			expect(init.method).toBe('POST')
			expect(JSON.parse(init.body as string)).toEqual({
				refetch: true,
				refetch_jp: true,
				preview: true,
				preview_token: null
			})
		})

		it('defaults refetch_jp to false', async () => {
			global.fetch = mockApiResponse(API.reparsePreviewNoChanges)

			await adapter.preview(CHARACTER_ID)

			expect(JSON.parse(lastCall().init.body as string).refetch_jp).toBe(false)
		})

		it('converts the refresh to camelCase and leaves field names alone', async () => {
			global.fetch = mockApiResponse(API.reparsePreviewChanges)

			const { refresh, character } = await adapter.preview(CHARACTER_ID)

			expect(character).toBeNull()
			expect(refresh.previewToken).toBe('pv_8f2c1d0e4b7a')
			expect(refresh.wikiChanged).toBe(true)
			expect(refresh.wikiJpChanged).toBe(false)
			expect(refresh.counts).toEqual({
				slotsCreated: 0,
				slotsDeleted: 0,
				versionsCreated: 1,
				versionsUpdated: 3,
				versionsDeleted: 0,
				effectsCreated: 4,
				effectsUpdated: 1,
				effectsDeleted: 2,
				linksCreated: 1,
				linksDeleted: 0
			})
			expect(refresh.changes[0]).toEqual({
				kind: 'ability',
				position: 1,
				ordinal: 1,
				name: { en: 'Jinx of the Tiger', ja: '虎の呪い' },
				change: 'updated',
				fields: ['description_en', 'description_jp', 'effects']
			})
			expect(refresh.iconFallbacks).toHaveLength(1)
		})

		it('keeps a null wiki_jp_changed when the JP page was not fetched', async () => {
			global.fetch = mockApiResponse(API.reparsePreviewNoChanges)

			const { refresh } = await adapter.preview(CHARACTER_ID)

			expect(refresh.wikiJpChanged).toBeNull()
			expect(refresh.changes).toEqual([])
		})

		it('does not retry a failed preview, which would fetch the wiki again', async () => {
			global.fetch = mockApiError(502, { error: 'Bad gateway' })

			await expect(adapter.preview(CHARACTER_ID)).rejects.toMatchObject({ status: 502 })
			expect(global.fetch).toHaveBeenCalledTimes(1)
		})
	})

	describe('apply', () => {
		it('POSTs the preview token without fetching again', async () => {
			global.fetch = mockApiResponse({
				...API.reparseApplied,
				character: { id: CHARACTER_ID, granblue_id: '3040377000' }
			})

			const { refresh, character } = await adapter.apply(CHARACTER_ID, 'pv_8f2c1d0e4b7a')

			expect(JSON.parse(lastCall().init.body as string)).toEqual({
				refetch: false,
				refetch_jp: false,
				preview: false,
				preview_token: 'pv_8f2c1d0e4b7a'
			})
			expect(refresh.written).toBe(true)
			expect(character).toMatchObject({ id: CHARACTER_ID, granblueId: '3040377000' })
		})

		it('rejects an expired token as preview_expired', async () => {
			global.fetch = mockApiError(API.reparseExpiredToken.status, API.reparseExpiredToken.body)

			const error = await adapter.apply(CHARACTER_ID, 'pv_old').catch((e: unknown) => e)

			expect(error).toMatchObject({
				status: 422,
				message: 'This preview has expired. Preview again to refresh.'
			})
			expect(refreshFailure(error)).toBe('preview_expired')
		})
	})

	describe('reparse', () => {
		it('rebuilds from stored text: no fetch, no preview', async () => {
			global.fetch = mockApiResponse({ ...API.reparseApplied, character: null })

			await adapter.reparse(CHARACTER_ID)

			expect(JSON.parse(lastCall().init.body as string)).toEqual({
				refetch: false,
				refetch_jp: false,
				preview: false,
				preview_token: null
			})
		})
	})

	describe('batch', () => {
		it('createBatch POSTs row ids and the JP option', async () => {
			global.fetch = mockApiResponse(API.batchCreated.body)

			const result = await adapter.createBatch(['a', 'b'], true)

			const { url, init } = lastCall()
			expect(url).toBe(`${BASE}/character_skill_refreshes`)
			expect(JSON.parse(init.body as string)).toEqual({
				character_ids: ['a', 'b'],
				refetch_jp: true
			})
			expect(result).toEqual({ id: 'rf_3c4d5e6f7a8b' })
		})

		it('createBatch surfaces a 429 without retrying', async () => {
			global.fetch = mockApiError(429, { error: 'Rate limit exceeded' })

			const error = await adapter.createBatch(['a']).catch((e: unknown) => e)

			expect(refreshFailure(error)).toBe('rate_limited')
			expect(global.fetch).toHaveBeenCalledTimes(1)
		})

		it('createBatch surfaces too_many_characters', async () => {
			global.fetch = mockApiError(422, {
				error: 'too_many_characters',
				message: 'Pick 20 characters or fewer.'
			})

			const error = await adapter.createBatch(['a']).catch((e: unknown) => e)

			expect(refreshFailure(error)).toBe('too_many_characters')
		})

		it('getBatch converts items to camelCase', async () => {
			global.fetch = mockApiResponse(API.batchPreviewed)

			const batch = await adapter.getBatch('rf_3c4d5e6f7a8b')

			expect(lastCall().url).toBe(`${BASE}/character_skill_refreshes/rf_3c4d5e6f7a8b`)
			expect(batch.status).toBe('previewed')
			expect(batch.refetchJp).toBe(false)
			expect(batch.items).toHaveLength(3)
			expect(batch.items[1]).toMatchObject({
				characterId: '0b6f1d2e-0000-4000-8000-000000000002',
				styleSwap: true,
				styleName: { en: 'Super Cidala', ja: null },
				status: 'previewed'
			})
			expect(batch.items[0]!.granblueId).toBe('3040377000')
			expect(batch.items[0]!.refresh?.counts.versionsUpdated).toBe(2)
			expect(batch.items[2]).toMatchObject({ status: 'failed', refresh: null })
		})

		it('applyBatch POSTs the chosen row ids', async () => {
			global.fetch = mockApiResponse({})

			await adapter.applyBatch('rf_3c4d5e6f7a8b', ['a'])

			const { url, init } = lastCall()
			expect(url).toBe(`${BASE}/character_skill_refreshes/rf_3c4d5e6f7a8b/apply`)
			expect(JSON.parse(init.body as string)).toEqual({ character_ids: ['a'] })
		})

		it('applyBatch without ids leaves the default (all previewed) to the API', async () => {
			global.fetch = mockApiResponse({})

			await adapter.applyBatch('rf_3c4d5e6f7a8b')

			expect(JSON.parse(lastCall().init.body as string)).toEqual({})
		})
	})

	describe('refreshFailure', () => {
		it('classifies by status', () => {
			expect(refreshFailure({ status: 403 })).toBe('forbidden')
			expect(refreshFailure({ status: 404 })).toBe('not_found')
			expect(refreshFailure({ status: 500 })).toBe('other')
			expect(refreshFailure(new Error('boom'))).toBe('other')
			expect(refreshFailure(null)).toBe('other')
		})

		it('treats an unknown 422 as other', () => {
			expect(refreshFailure({ status: 422, details: { error: 'something' } })).toBe('other')
		})
	})
})
