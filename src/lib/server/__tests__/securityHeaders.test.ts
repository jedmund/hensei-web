import { describe, expect, it, vi } from 'vitest'

vi.mock('$app/environment', () => ({ dev: false }))
vi.mock('$env/dynamic/private', () => ({ env: {} }))

import { applySecurityHeaders, hstsHeader, SECURITY_HEADERS } from '../securityHeaders'

describe('applySecurityHeaders', () => {
	it('adds the baseline headers and HSTS', () => {
		const res = applySecurityHeaders(new Response('ok'), 'max-age=86400')
		for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
			expect(res.headers.get(name)).toBe(value)
		}
		expect(res.headers.get('Strict-Transport-Security')).toBe('max-age=86400')
	})

	it('keeps headers a route already set', () => {
		const res = applySecurityHeaders(
			new Response('ok', { headers: { 'Referrer-Policy': 'no-referrer' } }),
			null
		)
		expect(res.headers.get('Referrer-Policy')).toBe('no-referrer')
		expect(res.headers.get('Strict-Transport-Security')).toBeNull()
	})

	it('leaves responses with immutable headers alone instead of throwing', () => {
		const res = Response.redirect('https://example.com/', 302)
		expect(() => applySecurityHeaders(res, 'max-age=86400')).not.toThrow()
	})
})

describe('hstsHeader', () => {
	it('is off in dev', () => {
		expect(hstsHeader(true, '31536000')).toBeNull()
	})

	it('defaults to a day and accepts a configured max-age', () => {
		expect(hstsHeader(false, undefined)).toBe('max-age=86400')
		expect(hstsHeader(false, '31536000')).toBe('max-age=31536000')
	})

	it('ignores invalid values', () => {
		expect(hstsHeader(false, 'forever')).toBe('max-age=86400')
		expect(hstsHeader(false, '-5')).toBe('max-age=86400')
	})
})
