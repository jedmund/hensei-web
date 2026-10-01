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
	it('uses the rightmost forwarded address', () => {
		expect(edgeClientIp(request('GET', '6.6.6.6, 203.0.113.9'))).toBe('203.0.113.9')
		expect(edgeClientIp(request('GET', '203.0.113.9'))).toBe('203.0.113.9')
	})

	it('returns null without a forwarded header', () => {
		expect(edgeClientIp(request('GET'))).toBeNull()
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
