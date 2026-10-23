import { describe, expect, it, vi } from 'vitest'
vi.mock('$lib/api/adapters/config', () => ({ getApiBaseUrl: () => 'http://api.test/api/v1' }))
import { GET, POST } from '../[...path]/+server'

function event(path: string, method = 'GET', body?: string) {
	return {
		params: { path },
		request: new Request('http://web.test/api/gacha/' + path, { method, body }),
		url: new URL('http://web.test/api/gacha/' + path + '?mode=classic'),
		fetch: vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ error: 'Limited' }), {
				status: 429,
				headers: { 'Retry-After': '60' }
			})
		)
	}
}
describe('gacha API proxy', () => {
	it('preserves errors and retry guidance through the server fetch hook', async () => {
		const input = event('simulations', 'POST', '{"draws":"300"}')
		const response = await POST(input as unknown as Parameters<typeof POST>[0])
		expect(response.status).toBe(429)
		expect(response.headers.get('Retry-After')).toBe('60')
		expect(input.fetch).toHaveBeenCalledWith(
			'http://api.test/api/v1/gacha/simulations?mode=classic',
			expect.objectContaining({ body: '{"draws":"300"}', method: 'POST' })
		)
	})
	it('restricts proxy paths and methods', async () => {
		await expect(
			GET(event('../users') as unknown as Parameters<typeof GET>[0])
		).rejects.toMatchObject({ status: 404 })
		await expect(
			POST(event('catalogue', 'POST') as unknown as Parameters<typeof POST>[0])
		).rejects.toMatchObject({ status: 404 })
	})
	it('answers with JSON when the API is unreachable', async () => {
		const input = event('catalogue')
		input.fetch.mockRejectedValueOnce(new TypeError('fetch failed'))
		const response = await GET(input as unknown as Parameters<typeof GET>[0])
		expect(response.status).toBe(502)
		expect(await response.json()).toEqual({ error: 'Gacha service unavailable' })
	})
})
