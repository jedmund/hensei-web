import { describe, expect, it } from 'vitest'
import { createRateLimiter, edgeClientIp, rateLimitResponse } from '../rateLimit'

function request(method: string, forwardedFor?: string) {
	const headers = new Headers()
	if (forwardedFor) headers.set('x-forwarded-for', forwardedFor)
	return new Request('http://localhost/', { method, headers })
}

describe('createRateLimiter', () => {
	it('allows up to the limit within a window, then blocks', () => {
		const limiter = createRateLimiter({ limit: 2, windowMs: 1000 })
		expect(limiter.hit('a', 0)).toBe(true)
		expect(limiter.hit('a', 10)).toBe(true)
		expect(limiter.hit('a', 20)).toBe(false)
		expect(limiter.hit('b', 20)).toBe(true)
	})

	it('resets after the window', () => {
		const limiter = createRateLimiter({ limit: 1, windowMs: 1000 })
		expect(limiter.hit('a', 0)).toBe(true)
		expect(limiter.hit('a', 500)).toBe(false)
		expect(limiter.hit('a', 1000)).toBe(true)
	})
})

describe('edgeClientIp', () => {
	function withHeaders(headers: Record<string, string>) {
		return new Request('http://localhost/', { headers })
	}

	it('uses the rightmost forwarded address', () => {
		expect(edgeClientIp(request('GET', '6.6.6.6, 203.0.113.9'))).toBe('203.0.113.9')
		expect(edgeClientIp(request('GET', '203.0.113.9'))).toBe('203.0.113.9')
	})

	it('skips internal proxy hops appended after the client', () => {
		expect(edgeClientIp(request('GET', '203.0.113.9, 10.0.0.5'))).toBe('203.0.113.9')
		expect(edgeClientIp(request('GET', '203.0.113.9, 100.64.1.2, fd12:2dd5::1'))).toBe(
			'203.0.113.9'
		)
	})

	it('ignores values a client prepends', () => {
		expect(edgeClientIp(request('GET', '1.1.1.1, 203.0.113.9, 10.0.0.5'))).toBe('203.0.113.9')
	})

	it('strips ports and brackets', () => {
		expect(edgeClientIp(request('GET', '203.0.113.9:51234'))).toBe('203.0.113.9')
		expect(edgeClientIp(request('GET', '[2001:db8::1]:443'))).toBe('2001:db8::1')
	})

	it('falls back to X-Real-IP when X-Forwarded-For has no public address', () => {
		expect(edgeClientIp(withHeaders({ 'x-real-ip': '203.0.113.9' }))).toBe('203.0.113.9')
		expect(
			edgeClientIp(withHeaders({ 'x-forwarded-for': '10.0.0.5', 'x-real-ip': '203.0.113.9' }))
		).toBe('203.0.113.9')
	})

	it('returns null without a public client address', () => {
		expect(edgeClientIp(request('GET'))).toBeNull()
		expect(edgeClientIp(request('GET', '10.0.0.5, 127.0.0.1'))).toBeNull()
		expect(edgeClientIp(withHeaders({ 'x-real-ip': '10.0.0.5' }))).toBeNull()
	})
})

describe('rateLimitResponse', () => {
	const rules = () => [
		{
			name: 'login',
			methods: ['POST'],
			path: /^(?:\/[a-z]{2})?\/auth\/login\/?$/,
			limiter: createRateLimiter({ limit: 2, windowMs: 60_000 })
		}
	]

	it('returns 429 once a client exceeds the limit, including localized paths', () => {
		const r = rules()
		expect(rateLimitResponse(request('POST', '203.0.113.9'), '/auth/login', r)).toBeNull()
		expect(rateLimitResponse(request('POST', '203.0.113.9'), '/ja/auth/login', r)).toBeNull()
		expect(rateLimitResponse(request('POST', '203.0.113.9'), '/auth/login', r)?.status).toBe(429)
		expect(rateLimitResponse(request('POST', '198.51.100.1'), '/auth/login', r)).toBeNull()
	})

	it('ignores other methods, other paths and internal requests', () => {
		const r = rules()
		for (let i = 0; i < 5; i++) {
			expect(rateLimitResponse(request('GET', '203.0.113.9'), '/auth/login', r)).toBeNull()
			expect(rateLimitResponse(request('POST', '203.0.113.9'), '/teams', r)).toBeNull()
			expect(rateLimitResponse(request('POST'), '/auth/login', r)).toBeNull()
		}
	})
})
