import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockFetchPublicUrl = vi.fn()
vi.mock('$lib/server/ssrfGuard', async (importOriginal) => {
	const actual = await importOriginal<typeof import('$lib/server/ssrfGuard')>()
	return { ...actual, fetchPublicUrl: (...args: unknown[]) => mockFetchPublicUrl(...args) }
})

import { GET } from '../+server'

function page(html: string) {
	return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } })
}

async function preview(target: string) {
	const url = new URL('http://localhost/api/og')
	url.searchParams.set('url', target)
	const res = (await GET({ url } as never)) as Response
	return (await res.json()) as { title: string | null; image: string | null }
}

describe('GET /api/og', () => {
	beforeEach(() => mockFetchPublicUrl.mockReset())

	it('points og:image at the same-origin image proxy', async () => {
		mockFetchPublicUrl.mockResolvedValue(
			page(
				'<meta property="og:title" content="A team"><meta property="og:image" content="https://cdn.example.com/a.png">'
			)
		)
		expect(await preview('https://example.com/team')).toEqual({
			title: 'A team',
			image: `/api/og/image?url=${encodeURIComponent('https://cdn.example.com/a.png')}`
		})
	})

	it('resolves a relative og:image against the page URL', async () => {
		mockFetchPublicUrl.mockResolvedValue(page('<meta property="og:image" content="/img/card.jpg">'))
		const { image } = await preview('https://example.com/posts/1')
		expect(image).toBe(
			`/api/og/image?url=${encodeURIComponent('https://example.com/img/card.jpg')}`
		)
	})

	it('drops images that are not http(s)', async () => {
		mockFetchPublicUrl.mockResolvedValue(
			page('<title>Hi</title><meta property="og:image" content="javascript:alert(1)">')
		)
		expect(await preview('https://example.com/')).toEqual({ title: 'Hi', image: null })
	})
})
