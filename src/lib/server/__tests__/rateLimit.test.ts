import { describe, expect, it, vi } from 'vitest'

vi.mock('$env/dynamic/private', () => ({ env: {} }))

import {
	clientIp,
	createRateLimiter,
	edgeClientIp,
	RATE_LIMIT_RULES,
	rateLimitResponse
} from '../rateLimit'

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

	it('keeps active counters when the key table fills up', () => {
		const limiter = createRateLimiter({ limit: 2, windowMs: 1000, maxKeys: 3 })
		expect(limiter.hit('victim', 0)).toBe(true)
		expect(limiter.hit('victim', 1)).toBe(true)
		for (let i = 0; i < 50; i++) {
			limiter.hit(`spray-${i}`, 2)
			// Recently seen keys stay; only the least recently seen are evicted.
			expect(limiter.hit('victim', 2)).toBe(false)
		}
	})

	it('drops expired windows before evicting live ones', () => {
		const limiter = createRateLimiter({ limit: 1, windowMs: 1000, maxKeys: 2 })
		expect(limiter.hit('old', 0)).toBe(true)
		expect(limiter.hit('active', 600)).toBe(true)
		expect(limiter.hit('new', 1200)).toBe(true)
		expect(limiter.hit('active', 1300)).toBe(false)
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

	it('ignores other methods, other paths and sub-requests', () => {
		const r = rules()
		for (let i = 0; i < 5; i++) {
			expect(rateLimitResponse(request('GET', '203.0.113.9'), '/auth/login', r)).toBeNull()
			expect(rateLimitResponse(request('POST', '203.0.113.9'), '/teams', r)).toBeNull()
			expect(
				rateLimitResponse(request('POST'), '/auth/login', r, { isSubRequest: true })
			).toBeNull()
		}
	})

	it('puts requests without a client address in one shared bucket', () => {
		const r = rules()
		expect(rateLimitResponse(request('POST'), '/auth/login', r)).toBeNull()
		expect(rateLimitResponse(request('POST'), '/auth/login', r)).toBeNull()
		expect(rateLimitResponse(request('POST'), '/auth/login', r)?.status).toBe(429)
		// Identified clients keep their own buckets.
		expect(rateLimitResponse(request('POST', '203.0.113.9'), '/auth/login', r)).toBeNull()
	})
})

describe('clientIp', () => {
	function req(headers: Record<string, string>) {
		return new Request('http://localhost/', { headers })
	}

	it('prefers CF-Connecting-IP over rotating edge addresses', () => {
		const r = req({ 'cf-connecting-ip': '203.0.113.9', 'x-forwarded-for': '84.17.44.227' })
		expect(clientIp(r, {})).toBe('203.0.113.9')
	})

	it('falls back to the forwarded address without CF-Connecting-IP', () => {
		expect(clientIp(req({ 'x-forwarded-for': '84.17.44.227' }), {})).toBe('84.17.44.227')
		expect(clientIp(req({}), {})).toBeNull()
	})

	it('ignores private CF-Connecting-IP values', () => {
		const r = req({ 'cf-connecting-ip': '10.0.0.5', 'x-forwarded-for': '84.17.44.227' })
		expect(clientIp(r, {})).toBe('84.17.44.227')
	})

	it('requires a matching X-Origin-Auth when an origin secret is configured', () => {
		const secrets = { current: 'current', previous: 'previous' }
		const base = { 'cf-connecting-ip': '203.0.113.9', 'x-forwarded-for': '84.17.44.227' }

		expect(clientIp(req(base), secrets)).toBe('84.17.44.227')
		expect(clientIp(req({ ...base, 'x-origin-auth': 'wrong' }), secrets)).toBe('84.17.44.227')
		expect(clientIp(req({ ...base, 'x-origin-auth': 'current' }), secrets)).toBe('203.0.113.9')
		expect(clientIp(req({ ...base, 'x-origin-auth': 'previous' }), secrets)).toBe('203.0.113.9')
	})
})

describe('RATE_LIMIT_RULES paths', () => {
	const ruleFor = (method: string, path: string) =>
		RATE_LIMIT_RULES.find((r) => r.methods.includes(method) && r.path.test(path))?.name

	it('limits link-preview images separately from link previews', () => {
		expect(ruleFor('GET', '/api/og')).toBe('link-preview')
		expect(ruleFor('GET', '/api/og/image')).toBe('link-preview-image')
		expect(ruleFor('GET', '/ja/api/og/image')).toBe('link-preview-image')
	})

	it('limits YouTube title lookups', () => {
		expect(ruleFor('GET', '/api/youtube/oembed')).toBe('youtube-oembed')
	})

	it('limits CSP violation reports', () => {
		expect(ruleFor('POST', '/api/csp-report')).toBe('csp-report')
		expect(ruleFor('GET', '/api/csp-report')).toBeUndefined()
	})

	it('limits team view reports', () => {
		expect(ruleFor('POST', '/api/teams/0f8c6f3e-2b1a-4c5d-9e7f-1a2b3c4d5e6f/view')).toBe(
			'team-view'
		)
		expect(ruleFor('POST', '/ja/api/teams/abc/view')).toBe('team-view')
		expect(ruleFor('GET', '/api/teams/abc/view')).toBeUndefined()
	})

	it('limits client error reports', () => {
		expect(ruleFor('POST', '/api/client-error')).toBe('client-error')
		expect(ruleFor('POST', '/ja/api/client-error')).toBe('client-error')
	})

	it('limits social login starts, callbacks and the username step', () => {
		for (const provider of ['discord', 'google', 'apple']) {
			expect(ruleFor('GET', `/auth/${provider}`)).toBe('social-start')
			expect(ruleFor('GET', `/ja/auth/${provider}`)).toBe('social-start')
			expect(ruleFor('GET', `/auth/${provider}/callback`)).toBe('social-callback')
			expect(ruleFor('GET', `/ja/auth/${provider}/callback`)).toBe('social-callback')
		}
		expect(ruleFor('POST', '/auth/apple/callback')).toBe('social-callback')
		expect(ruleFor('POST', '/auth/choose-username')).toBe('social-signup')
		expect(ruleFor('GET', '/auth/choose-username')).toBeUndefined()
		expect(ruleFor('GET', '/auth/github')).toBeUndefined()
		expect(ruleFor('GET', '/auth/login')).toBeUndefined()
	})

	it('limits the extension login page and its code requests', () => {
		expect(ruleFor('GET', '/auth/extension')).toBe('extension-auth')
		expect(ruleFor('GET', '/ja/auth/extension')).toBe('extension-auth')
		expect(ruleFor('POST', '/auth/extension/code')).toBe('extension-auth-code')
		expect(ruleFor('POST', '/ja/auth/extension/code')).toBe('extension-auth-code')
		expect(ruleFor('GET', '/auth/extension/code')).toBeUndefined()
	})
})
