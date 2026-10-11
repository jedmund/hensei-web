import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GET } from '../+server'

const mockFetch = vi.fn()

async function lookup(id: string | null) {
	const url = new URL('http://localhost/api/youtube/oembed')
	if (id !== null) url.searchParams.set('id', id)
	return (await GET({ url } as never)) as Response
}

describe('GET /api/youtube/oembed', () => {
	beforeEach(() => {
		mockFetch.mockReset()
		vi.stubGlobal('fetch', mockFetch)
	})
	afterEach(() => vi.unstubAllGlobals())

	it("returns only the video's title, from YouTube's fixed oEmbed URL", async () => {
		mockFetch.mockResolvedValue(
			Response.json({ title: 'Full auto run', author_name: 'someone', html: '<iframe>' })
		)
		const res = await lookup('dQw4w9WgXcQ')

		expect(res.status).toBe(200)
		expect(await res.json()).toEqual({ title: 'Full auto run' })
		expect(res.headers.get('cache-control')).toBe('public, max-age=86400')
		expect(mockFetch.mock.calls[0]![0]).toBe(
			'https://www.youtube.com/oembed?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DdQw4w9WgXcQ&format=json'
		)
	})

	it('rejects anything that is not a video id without calling YouTube', async () => {
		for (const id of [null, '', 'short', 'dQw4w9WgXcQ&x=1', '../../evil/', 'a'.repeat(12)]) {
			expect((await lookup(id)).status).toBe(400)
		}
		expect(mockFetch).not.toHaveBeenCalled()
	})

	it('answers 404 for private or missing videos', async () => {
		mockFetch.mockResolvedValue(new Response('Unauthorized', { status: 401 }))
		expect((await lookup('dQw4w9WgXcQ')).status).toBe(404)

		mockFetch.mockResolvedValue(new Response('Not Found', { status: 404 }))
		expect((await lookup('dQw4w9WgXcQ')).status).toBe(404)
	})

	it('answers 502 when YouTube fails', async () => {
		mockFetch.mockRejectedValue(new Error('network'))
		expect((await lookup('dQw4w9WgXcQ')).status).toBe(502)

		mockFetch.mockResolvedValue(new Response('oops', { status: 500 }))
		expect((await lookup('dQw4w9WgXcQ')).status).toBe(502)
	})
})
