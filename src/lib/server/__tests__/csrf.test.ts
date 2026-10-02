import { describe, expect, it, vi } from 'vitest'

vi.mock('$app/environment', () => ({ dev: false }))

import { csrfResponse, handleCsrf, isExemptFromCsrf } from '../csrf'

const ORIGIN = 'https://granblue.team'

function request(
	path: string,
	{
		method = 'POST',
		origin,
		contentType = 'application/x-www-form-urlencoded',
		accept
	}: { method?: string; origin?: string | null; contentType?: string; accept?: string } = {}
) {
	const headers = new Headers()
	if (origin) headers.set('origin', origin)
	if (contentType) headers.set('content-type', contentType)
	if (accept) headers.set('accept', accept)
	const url = new URL(path, ORIGIN)
	return { request: new Request(url, { method, headers }), url }
}

describe('csrfResponse', () => {
	it('allows same-origin form submissions', () => {
		const { request: req, url } = request('/auth/login', { origin: ORIGIN })
		expect(csrfResponse(req, url)).toBeNull()
	})

	it('blocks cross-site form submissions like SvelteKit does', async () => {
		for (const contentType of [
			'application/x-www-form-urlencoded',
			'multipart/form-data; boundary=x',
			'text/plain;charset=UTF-8',
			'application/x-sveltekit-formdata'
		]) {
			const { request: req, url } = request('/auth/login', {
				origin: 'https://evil.example',
				contentType
			})
			const res = csrfResponse(req, url)
			expect(res?.status).toBe(403)
			expect(await res?.text()).toBe('Cross-site POST form submissions are forbidden')
		}
	})

	it('blocks form submissions without an Origin header', () => {
		const { request: req, url } = request('/settings', { origin: null })
		expect(csrfResponse(req, url)?.status).toBe(403)
	})

	it('covers PUT, PATCH and DELETE but not GET', () => {
		for (const method of ['PUT', 'PATCH', 'DELETE']) {
			const { request: req, url } = request('/x', { method, origin: 'https://evil.example' })
			expect(csrfResponse(req, url)?.status).toBe(403)
		}
		const { request: req, url } = request('/x', {
			method: 'GET',
			origin: 'https://evil.example',
			contentType: ''
		})
		expect(csrfResponse(req, url)).toBeNull()
	})

	it('ignores non-form content types (JSON is protected by CORS)', () => {
		const { request: req, url } = request('/auth/login', {
			origin: 'https://evil.example',
			contentType: 'application/json'
		})
		expect(csrfResponse(req, url)).toBeNull()
	})

	it('answers JSON when the client asks for it', async () => {
		const { request: req, url } = request('/x', {
			origin: 'https://evil.example',
			accept: 'application/json'
		})
		const res = csrfResponse(req, url)
		expect(res?.status).toBe(403)
		expect(await res?.json()).toEqual({ message: 'Cross-site POST form submissions are forbidden' })
	})

	it("exempts only POSTs to Apple's callback", () => {
		const apple = request('/auth/apple/callback', { origin: 'https://appleid.apple.com' })
		expect(csrfResponse(apple.request, apple.url)).toBeNull()

		const localized = request('/ja/auth/apple/callback', { origin: 'https://appleid.apple.com' })
		expect(csrfResponse(localized.request, localized.url)).toBeNull()

		for (const path of [
			'/auth/discord/callback',
			'/auth/google/callback',
			'/auth/apple',
			'/auth/apple/callback/extra',
			'/auth/login'
		]) {
			const { request: req, url } = request(path, { origin: 'https://appleid.apple.com' })
			expect(csrfResponse(req, url)?.status).toBe(403)
		}

		const put = request('/auth/apple/callback', {
			method: 'PUT',
			origin: 'https://appleid.apple.com'
		})
		expect(csrfResponse(put.request, put.url)?.status).toBe(403)
	})

	it('isExemptFromCsrf matches the Apple callback POST only', () => {
		expect(isExemptFromCsrf('POST', '/auth/apple/callback')).toBe(true)
		expect(isExemptFromCsrf('POST', '/auth/apple/callback/')).toBe(true)
		expect(isExemptFromCsrf('GET', '/auth/apple/callback')).toBe(false)
		expect(isExemptFromCsrf('POST', '/auth/google/callback')).toBe(false)
	})
})

describe('handleCsrf', () => {
	it('stops a cross-site form POST before it reaches the route', async () => {
		const { request: req, url } = request('/auth/login', { origin: 'https://evil.example' })
		const resolve = vi.fn()
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const res = await handleCsrf({ event: { request: req, url } as any, resolve })
		expect(res.status).toBe(403)
		expect(resolve).not.toHaveBeenCalled()
	})

	it('passes other requests through', async () => {
		const { request: req, url } = request('/auth/login', { origin: ORIGIN })
		const ok = new Response('ok')
		const resolve = vi.fn().mockResolvedValue(ok)
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const res = await handleCsrf({ event: { request: req, url } as any, resolve })
		expect(res).toBe(ok)
	})
})
