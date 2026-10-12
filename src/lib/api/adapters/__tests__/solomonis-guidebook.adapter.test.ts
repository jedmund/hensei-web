import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SolomonisGuidebookAdapter } from '../solomonis-guidebook.adapter'
import { API, EXPECTED } from './fixtures/solomonis-guidebook.fixtures'
import { mockApiResponse } from './fixtures/helpers'

describe('SolomonisGuidebookAdapter', () => {
	let adapter: SolomonisGuidebookAdapter
	let originalFetch: typeof global.fetch

	beforeEach(() => {
		originalFetch = global.fetch
		adapter = new SolomonisGuidebookAdapter({ baseURL: 'https://api.example.com' })
	})

	afterEach(() => {
		global.fetch = originalFetch
		vi.clearAllTimers()
	})

	it('listGuideEffects GETs the catalogue and unwraps it', async () => {
		global.fetch = mockApiResponse(API.guideEffects)

		const result = await adapter.listGuideEffects()

		const [url] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!
		expect(url).toBe('https://api.example.com/solomonis/guide_effects')
		expect(result).toHaveLength(101)
		expect(result[0]).toEqual(EXPECTED.guideEffects[0])
		expect(result[0]).toMatchObject({ granblueId: 1, iconCategory: 1, targetValues: [] })
	})

	it('keeps the {value} placeholder in names', async () => {
		global.fetch = mockApiResponse(API.guideEffects)

		const result = await adapter.listGuideEffects()

		expect(result.some((e) => e.name.en?.includes('{value}'))).toBe(true)
	})

	it('replaceGuidebook PUTs the whole list in snake_case with the edit key', async () => {
		global.fetch = mockApiResponse({ party: { id: 'party-1', solomonis: API.runSolomonis } })

		const result = await adapter.replaceGuidebook(
			'party-1',
			[
				{
					guideEffectId: 'effect-1',
					count: 2,
					displayValue: '80%',
					acquiredOrder: 3,
					inherited: true,
					note: 'from the chest'
				}
			],
			{ 'X-Edit-Key': 'key' }
		)

		const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!
		expect(url).toBe('https://api.example.com/parties/party-1/guide_effects')
		expect(init.method).toBe('PUT')
		expect(init.headers).toMatchObject({ 'X-Edit-Key': 'key' })
		expect(JSON.parse(init.body)).toEqual({
			guide_effects: [
				{
					guide_effect_id: 'effect-1',
					count: 2,
					display_value: '80%',
					acquired_order: 3,
					inherited: true,
					note: 'from the chest'
				}
			]
		})
		const solomonis = result.solomonis as typeof EXPECTED.runSolomonis
		expect(result.id).toBe('party-1')
		expect(solomonis.guidebook).toHaveLength(EXPECTED.runSolomonis.guidebook.length)
		expect(solomonis.guidebook[1]?.displayValue).toBe('100%')
	})
})
