import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { WikiImportAdapter } from '../wikiImport.adapter'
import { mockApiResponse } from './fixtures/helpers'
import type { WikiImportRequest } from '$lib/types/api/wikiImport'

const request: WikiImportRequest = {
	job: {
		name: 'Soldier',
		accessory: null,
		skills: ['Ammunition Belt', null, null],
		fullAutoOff: [0, 2]
	},
	bullets: ['expert-model-chaos-legion'],
	characters: [
		{ position: 0, title: 'Seofon', uncap: 't3', awakening: 'attack', ring: true, fullAutoOff: [1] }
	],
	weapons: [{ position: -1, title: 'Ultima Gun (Fire)', uncap: '5', awakening: null }],
	keys: { draconic: [null, 16002] },
	summons: [{ position: 6, title: 'Lucifer', uncap: null }],
	quick: -1
}

const report = {
	matched: [
		{
			kind: 'weapon',
			position: -1,
			title: 'Ultima Gun (Fire)',
			item: {
				id: 'w1',
				granblue_id: '1040508200',
				name: { en: 'Ultima Gun', ja: 'オメガガン' },
				element: 2
			}
		}
	],
	unmatched: [{ kind: 'character', position: 0, title: 'Seofon' }],
	ambiguous: [],
	warnings: [{ code: 'unknown_bullet', detail: 'slot 0' }]
}

function calls() {
	return (global.fetch as ReturnType<typeof vi.fn>).mock.calls
}

describe('WikiImportAdapter', () => {
	let adapter: WikiImportAdapter
	let originalFetch: typeof global.fetch

	beforeEach(() => {
		originalFetch = global.fetch
		adapter = new WikiImportAdapter({ baseURL: 'https://api.example.com' })
	})

	afterEach(() => {
		global.fetch = originalFetch
	})

	it('preview POSTs the request with preview: true, snake_cased', async () => {
		global.fetch = mockApiResponse({ party: null, report })

		const result = await adapter.preview(request)

		const [url, init] = calls()[0]!
		expect(url).toBe('https://api.example.com/import/wiki')
		expect(init.method).toBe('POST')
		expect(JSON.parse(init.body)).toEqual({
			wiki: {
				preview: true,
				job: {
					name: 'Soldier',
					accessory: null,
					skills: ['Ammunition Belt', null, null],
					full_auto_off: [0, 2]
				},
				bullets: ['expert-model-chaos-legion'],
				characters: [
					{
						position: 0,
						title: 'Seofon',
						uncap: 't3',
						awakening: 'attack',
						ring: true,
						full_auto_off: [1]
					}
				],
				weapons: [{ position: -1, title: 'Ultima Gun (Fire)', uncap: '5', awakening: null }],
				keys: { draconic: [null, 16002] },
				summons: [{ position: 6, title: 'Lucifer', uncap: null }],
				quick: -1
			}
		})
		expect(result.party).toBeNull()
		expect(result.report.matched[0]!.item.granblueId).toBe('1040508200')
		expect(result.report.unmatched).toEqual([{ kind: 'character', position: 0, title: 'Seofon' }])
	})

	it('create POSTs with preview: false and returns the party with its edit key', async () => {
		global.fetch = mockApiResponse({
			party: {
				id: 'p1',
				shortcode: 'abc123',
				edit_key: 'secret',
				characters: [],
				weapons: [],
				summons: []
			},
			report
		})

		const result = await adapter.create({ ...request, localId: 'local-1' })

		const body = JSON.parse(calls()[0]![1].body).wiki
		expect(body.preview).toBe(false)
		expect(body.local_id).toBe('local-1')
		expect(result.party?.shortcode).toBe('abc123')
		expect(result.party?.editKey).toBe('secret')
	})

	it('create is not retried when the server fails', async () => {
		global.fetch = vi.fn().mockResolvedValue({
			ok: false,
			status: 503,
			statusText: 'Service Unavailable',
			headers: new Headers(),
			json: async () => ({ error: 'unavailable' }),
			text: async () => '{"error":"unavailable"}'
		})

		await expect(adapter.create(request)).rejects.toMatchObject({ status: 503 })
		expect(calls()).toHaveLength(1)
	})
})
