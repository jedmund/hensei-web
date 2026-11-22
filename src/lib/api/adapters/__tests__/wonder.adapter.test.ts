import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { WonderAdapter } from '../wonder.adapter'
import { mockApiResponse } from './fixtures/helpers'

const BASE = 'https://api.example.com'

function lastCall() {
	const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls
	const [url, init] = calls[calls.length - 1]!
	return {
		url: url as string,
		method: (init as RequestInit).method ?? 'GET',
		body: (init as RequestInit).body ? JSON.parse((init as RequestInit).body as string) : undefined,
		headers: (init as RequestInit).headers as Record<string, string>
	}
}

const ownedRow = {
	id: 'cw-1',
	wonder_id: 'w-9008',
	granblue_id: '9008',
	active: true,
	level: 20,
	evolution: 3,
	possession: null,
	image: '9008_20',
	bonuses: [
		{ stat: 'fire_resistance', value: 10 },
		{ stat: 'def', value: 12 }
	]
}

describe('WonderAdapter', () => {
	let adapter: WonderAdapter
	let originalFetch: typeof global.fetch

	beforeEach(() => {
		originalFetch = global.fetch
		adapter = new WonderAdapter({ baseURL: BASE })
	})

	afterEach(() => {
		global.fetch = originalFetch
	})

	it('getCatalogue camelCases the catalogue, leaving stat keys alone', async () => {
		global.fetch = mockApiResponse({
			categories: [
				{
					id: 'c4',
					granblue_id: '4',
					name: { en: 'Crucible Seal', ja: '神滅の印章' },
					category_type: 2,
					sort_order: 4
				}
			],
			wonders: [
				{
					id: 'w-9008',
					granblue_id: '9008',
					category_id: 'c4',
					hidden_in_unite_and_fight: true,
					battle_relevant: true,
					level_bonuses: [{ level: 1, stat: 'fire_resistance', value: 5 }],
					evolution_caps: [{ evolution: 0, max_level: 10 }]
				}
			]
		})

		const result = await adapter.getCatalogue()

		expect(lastCall().url).toBe(`${BASE}/wonders`)
		expect(result.categories[0]).toMatchObject({ granblueId: '4', categoryType: 2, sortOrder: 4 })
		expect(result.wonders[0]).toMatchObject({
			categoryId: 'c4',
			hiddenInUniteAndFight: true,
			battleRelevant: true,
			levelBonuses: [{ level: 1, stat: 'fire_resistance', value: 5 }],
			evolutionCaps: [{ evolution: 0, maxLevel: 10 }]
		})
	})

	it("listCollection reads a user's Wonders", async () => {
		global.fetch = mockApiResponse({ wonders: [ownedRow] })

		const result = await adapter.listCollection('user-1')

		expect(lastCall().url).toBe(`${BASE}/users/user-1/collection/wonders`)
		expect(result[0]).toMatchObject({ wonderId: 'w-9008', granblueId: '9008', image: '9008_20' })
		expect(result[0]!.bonuses[0]).toEqual({ stat: 'fire_resistance', value: 10 })
	})

	it('addToCollection wraps the row in collection_wonder', async () => {
		global.fetch = mockApiResponse(ownedRow)

		await adapter.addToCollection({
			wonderId: 'w-9008',
			active: true,
			level: 20,
			evolution: 3,
			possession: null
		})

		const call = lastCall()
		expect(call.url).toBe(`${BASE}/collection/wonders`)
		expect(call.method).toBe('POST')
		expect(call.body).toEqual({
			collection_wonder: {
				wonder_id: 'w-9008',
				active: true,
				level: 20,
				evolution: 3,
				possession: null
			}
		})
	})

	it('updateInCollection sends the fields without the Wonder', async () => {
		global.fetch = mockApiResponse(ownedRow)

		await adapter.updateInCollection('cw-1', {
			active: false,
			level: null,
			evolution: null,
			possession: 900
		})

		const call = lastCall()
		expect(call.url).toBe(`${BASE}/collection/wonders/cw-1`)
		expect(call.method).toBe('PUT')
		expect(call.body).toEqual({
			collection_wonder: { active: false, level: null, evolution: null, possession: 900 }
		})
	})

	it('removeFromCollection deletes the row', async () => {
		global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 204 })

		await adapter.removeFromCollection('cw-1')

		expect(lastCall()).toMatchObject({ url: `${BASE}/collection/wonders/cw-1`, method: 'DELETE' })
	})

	it('updatePartyWonders replaces the set and passes the edit key', async () => {
		global.fetch = mockApiResponse({ wonders: [ownedRow] })

		const result = await adapter.updatePartyWonders(
			'party-1',
			[
				{ wonderId: 'w-9008', level: 20, evolution: 3, possession: null },
				{ wonderId: 'w-9015', level: null, evolution: null, possession: 900 }
			],
			{ 'X-Edit-Key': 'key' }
		)

		const call = lastCall()
		expect(call.url).toBe(`${BASE}/parties/party-1/wonders`)
		expect(call.method).toBe('PUT')
		expect(call.headers['X-Edit-Key']).toBe('key')
		expect(call.body).toEqual({
			wonders: [
				{ wonder_id: 'w-9008', level: 20, evolution: 3, possession: null },
				{ wonder_id: 'w-9015', level: null, evolution: null, possession: 900 }
			]
		})
		expect(result[0]!.wonderId).toBe('w-9008')
	})

	it('syncPartyWonders posts with no body and passes the edit key', async () => {
		global.fetch = mockApiResponse({ wonders: [ownedRow] })

		const result = await adapter.syncPartyWonders('party-1', { 'X-Edit-Key': 'key' })

		const call = lastCall()
		expect(call.url).toBe(`${BASE}/parties/party-1/wonders/sync`)
		expect(call.method).toBe('POST')
		expect(call.body).toBeUndefined()
		expect(call.headers['X-Edit-Key']).toBe('key')
		expect(result[0]).toMatchObject({ wonderId: 'w-9008', image: '9008_20' })
	})
})
