import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SolomonisGridAdapter } from '../solomonis-grid.adapter'
import { mockApiResponse } from './fixtures/helpers'
import buildJson from '$lib/components/solomonis/grid/__fixtures__/party-build.json'

describe('SolomonisGridAdapter', () => {
	let adapter: SolomonisGridAdapter
	let originalFetch: typeof global.fetch

	beforeEach(() => {
		originalFetch = global.fetch
		adapter = new SolomonisGridAdapter({ baseURL: 'https://api.example.com' })
	})

	afterEach(() => {
		global.fetch = originalFetch
		vi.clearAllTimers()
	})

	it('updateUnsealPriority PUTs the ordered list and returns the solomonis object', async () => {
		global.fetch = mockApiResponse({ solomonis: buildJson.party.solomonis })

		const result = await adapter.updateUnsealPriority(
			'p1',
			[
				{ type: 'weapon', id: 'w1' },
				{ type: 'summon', id: 's1' }
			],
			{ 'X-Edit-Key': 'key' }
		)

		const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!
		expect(url).toBe('https://api.example.com/parties/p1/unseal_priority')
		expect(init.method).toBe('PUT')
		expect(JSON.parse(init.body)).toEqual({
			items: [
				{ type: 'weapon', id: 'w1' },
				{ type: 'summon', id: 's1' }
			]
		})
		expect(init.headers).toMatchObject({ 'X-Edit-Key': 'key' })
		expect(result.kind).toBe('build')
		expect(result.blessingCostLimit).toBe(100)
		expect(result.routeEvoker.granblueId).toBe('3040169000')
	})
})
