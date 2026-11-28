import { describe, expect, it, vi } from 'vitest'
import { fetchRateUps } from '../rateUps'

const respond = (body: unknown, status = 200) =>
	vi.fn(async () => new Response(JSON.stringify(body), { status }))

describe('fetchRateUps', () => {
	it("asks for the spark's day and pool", async () => {
		const fetch = respond({ banners: [], rate_ups: ['1040000100', 7, '2040000100'] })

		const ids = await fetchRateUps(fetch, '/api', '2026-11-17', 'flash')

		expect(fetch).toHaveBeenCalledWith('/api/gacha/rate_ups?date=2026-11-17&pool=flash', {
			signal: undefined
		})
		// Anything that isn't an id is dropped
		expect(ids).toEqual(['1040000100', '2040000100'])
	})

	it('leaves the pool out when the spark has none', async () => {
		const fetch = respond({ rate_ups: [] })
		await fetchRateUps(fetch, '/api', '2026-11-17', null)
		expect(fetch).toHaveBeenCalledWith('/api/gacha/rate_ups?date=2026-11-17', { signal: undefined })
	})

	it('has no marks without a date, or when the request fails', async () => {
		const fetch = respond({ rate_ups: ['1040000100'] })
		expect(await fetchRateUps(fetch, '/api', null, 'flash')).toEqual([])
		expect(fetch).not.toHaveBeenCalled()

		expect(await fetchRateUps(respond({ error: 'no' }, 500), '/api', '2026-11-17', null)).toEqual(
			[]
		)
		const failing = vi.fn(async () => {
			throw new Error('offline')
		})
		expect(await fetchRateUps(failing, '/api', '2026-11-17', null)).toEqual([])
	})
})
