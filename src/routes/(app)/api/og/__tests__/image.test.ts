import { beforeEach, describe, expect, it, vi } from 'vitest'

// A plain function rather than vi.fn(): Vitest reports a rejection from a
// mocked vi.fn() as a failure even when the code under test catches it.
let upstreamImpl: () => Promise<Response> = async () => new Response(null, { status: 500 })
let upstreamCalls = 0
vi.mock('$lib/server/ssrfGuard', async (importOriginal) => {
	const actual = await importOriginal<typeof import('$lib/server/ssrfGuard')>()
	return {
		...actual,
		fetchPublicUrl: () => {
			upstreamCalls += 1
			return upstreamImpl()
		}
	}
})

function respondWith(response: Response) {
	upstreamImpl = async () => response
}

import { BlockedUrlError } from '$lib/server/ssrfGuard'
import { GET } from '../image/+server'

function get(target: string | null, headers: Record<string, string> = {}) {
	const url = new URL('http://localhost/api/og/image')
	if (target !== null) url.searchParams.set('url', target)
	const request = new Request(url, { headers })
	return GET({ url, request } as never) as Promise<Response>
}

function upstream(body: BodyInit, contentType: string, extra: Record<string, string> = {}) {
	return new Response(body, { headers: { 'content-type': contentType, ...extra } })
}

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3])

describe('GET /api/og/image', () => {
	beforeEach(() => {
		upstreamCalls = 0
	})

	it('serves a raster image from our origin with locked-down headers', async () => {
		respondWith(upstream(PNG, 'image/png'))
		const res = await get('https://example.com/preview.png', { 'sec-fetch-site': 'same-origin' })

		expect(res.status).toBe(200)
		expect(res.headers.get('content-type')).toBe('image/png')
		expect(res.headers.get('x-content-type-options')).toBe('nosniff')
		expect(res.headers.get('content-security-policy')).toBe("default-src 'none'; sandbox")
		expect(new Uint8Array(await res.arrayBuffer())).toEqual(PNG)
	})

	it('never serves SVG', async () => {
		respondWith(upstream('<svg onload="alert(1)"/>', 'image/svg+xml'))
		expect((await get('https://example.com/x.svg')).status).toBe(415)
	})

	it('rejects non-image content', async () => {
		respondWith(upstream('<html></html>', 'text/html; charset=utf-8'))
		expect((await get('https://example.com/page')).status).toBe(415)
	})

	it('rejects images over 2 MB, declared or streamed', async () => {
		respondWith(upstream(PNG, 'image/png', { 'content-length': String(3 * 1024 * 1024) }))
		expect((await get('https://example.com/big.png')).status).toBe(413)

		respondWith(upstream(new Uint8Array(2 * 1024 * 1024 + 1), 'image/png'))
		expect((await get('https://example.com/big.png')).status).toBe(413)
	})

	it('rejects private destinations through the SSRF guard', async () => {
		upstreamImpl = async () => {
			throw new BlockedUrlError('private address')
		}
		expect((await get('http://169.254.169.254/latest')).status).toBe(400)
	})

	it('rejects cross-site requests, bad URLs and other protocols', async () => {
		expect(
			(await get('https://example.com/a.png', { 'sec-fetch-site': 'cross-site' })).status
		).toBe(403)
		expect((await get(null)).status).toBe(400)
		expect((await get('not a url')).status).toBe(400)
		expect((await get('file:///etc/passwd')).status).toBe(400)
		expect(upstreamCalls).toBe(0)
	})

	it('returns 502 when the upstream fails', async () => {
		respondWith(new Response(null, { status: 404 }))
		expect((await get('https://example.com/missing.png')).status).toBe(502)
	})
})
