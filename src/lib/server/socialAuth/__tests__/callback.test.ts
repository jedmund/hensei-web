import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockCookies } from './mockCookies'

vi.mock('$lib/api/adapters/config', () => ({ getApiBaseUrl: () => 'http://api.test/api/v1' }))

const { handleSocialCallback, appleName } = await import('../callback')
type CallbackContext = Parameters<typeof handleSocialCallback>[0]

const TOKEN_BODY = {
	access_token: 'new-access',
	token_type: 'Bearer',
	expires_in: 2592000,
	refresh_token: 'new-refresh',
	created_at: 1700000000,
	user: { id: 'u1', username: 'djeeta', role: 1 }
}

function jsonResponse(status: number, body?: unknown) {
	return new Response(body === undefined ? null : JSON.stringify(body), {
		status,
		headers: { 'content-type': 'application/json' }
	})
}

function flowCookies(
	provider: string,
	{ mode = 'login', next }: { mode?: 'login' | 'link'; next?: string } = {}
) {
	const cookies: Record<string, string> = {
		[`oauth_${provider}_state`]: 'state-123',
		[`oauth_${provider}_mode`]: mode
	}
	if (provider !== 'apple') cookies[`oauth_${provider}_verifier`] = 'verifier-abc'
	if (provider !== 'discord') cookies[`oauth_${provider}_nonce`] = 'nonce-xyz'
	if (next) cookies[`oauth_${provider}_next`] = next
	return cookies
}

function setup({
	provider = 'discord' as CallbackContext['provider'],
	cookies = flowCookies(provider),
	params = {},
	apiResponse = jsonResponse(200, TOKEN_BODY),
	sessionToken = null as string | null,
	exchange = vi.fn().mockResolvedValue('provider-assertion')
}: {
	provider?: CallbackContext['provider']
	cookies?: Record<string, string>
	params?: Partial<CallbackContext['params']>
	apiResponse?: Response
	sessionToken?: string | null
	exchange?: ReturnType<typeof vi.fn>
} = {}) {
	const jar = createMockCookies(cookies)
	const fetchFn = vi.fn().mockResolvedValue(apiResponse)
	const establishSession = vi.fn().mockResolvedValue({})
	const ctx: CallbackContext = {
		provider,
		origin: 'https://granblue.team',
		params: { code: 'auth-code', state: 'state-123', error: null, user: null, ...params },
		cookies: jar.cookies,
		fetch: fetchFn as unknown as typeof fetch,
		sessionToken,
		secure: true
	}
	return {
		jar,
		fetchFn,
		exchange,
		establishSession,
		run: () => handleSocialCallback(ctx, { exchangeCode: exchange, establishSession })
	}
}

function apiCall(fetchFn: ReturnType<typeof vi.fn>) {
	const [url, init] = fetchFn.mock.calls[0] as [string, RequestInit]
	return {
		url,
		headers: init.headers as Record<string, string>,
		body: JSON.parse(String(init.body))
	}
}

beforeEach(() => {
	vi.restoreAllMocks()
})

describe('handleSocialCallback: state', () => {
	it('rejects a state that does not match the cookie', async () => {
		const t = setup({ params: { state: 'forged-state' } })
		expect(await t.run()).toBe('/auth/login?social_error=failed')
		expect(t.exchange).not.toHaveBeenCalled()
		expect(t.fetchFn).not.toHaveBeenCalled()
	})

	it('rejects a callback with no flow cookies', async () => {
		const t = setup({ cookies: {} })
		expect(await t.run()).toBe('/auth/login?social_error=failed')
		expect(t.exchange).not.toHaveBeenCalled()
	})

	it('rejects a callback without a state param', async () => {
		const t = setup({ params: { state: null } })
		expect(await t.run()).toBe('/auth/login?social_error=failed')
	})

	it('clears the flow cookies on every outcome, including a mismatch', async () => {
		const t = setup({ params: { state: 'forged-state' } })
		await t.run()
		const deleted = t.jar.deletes.map((d) => d.name)
		expect(deleted).toEqual(
			expect.arrayContaining([
				'oauth_discord_state',
				'oauth_discord_verifier',
				'oauth_discord_nonce',
				'oauth_discord_mode',
				'oauth_discord_next'
			])
		)
		expect(t.jar.store.has('oauth_discord_state')).toBe(false)
	})

	it('reports a provider error (user cancelled) without exchanging a code', async () => {
		const t = setup({ params: { code: null, error: 'access_denied' } })
		expect(await t.run()).toBe('/auth/login?social_error=cancelled')
		expect(t.exchange).not.toHaveBeenCalled()
	})

	it('fails cleanly when the code exchange fails, without logging secrets', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
		const t = setup({ exchange: vi.fn().mockRejectedValue(new Error('auth-code was bad')) })
		expect(await t.run()).toBe('/auth/login?social_error=failed')
		expect(t.fetchFn).not.toHaveBeenCalled()
		const logged = warn.mock.calls.flat().join(' ')
		expect(logged).not.toContain('auth-code')
	})
})

describe('handleSocialCallback: sign-in outcomes', () => {
	it('exchanges the code with the PKCE verifier and sends the Discord access token', async () => {
		const t = setup()
		await t.run()
		expect(t.exchange).toHaveBeenCalledWith(
			'discord',
			'https://granblue.team',
			'auth-code',
			'verifier-abc',
			null
		)
		const call = apiCall(t.fetchFn)
		expect(call.url).toBe('http://api.test/api/v1/auth/discord')
		expect(call.body).toEqual({ assertion: 'provider-assertion' })
	})

	it('sends the nonce with Google and Apple assertions', async () => {
		const google = setup({ provider: 'google' })
		await google.run()
		expect(apiCall(google.fetchFn).body).toEqual({
			assertion: 'provider-assertion',
			nonce: 'nonce-xyz'
		})

		const apple = setup({ provider: 'apple' })
		await apple.run()
		expect(google.exchange).toHaveBeenCalledWith(
			'google',
			'https://granblue.team',
			'auth-code',
			'verifier-abc',
			'nonce-xyz'
		)
		expect(apple.exchange).toHaveBeenCalledWith(
			'apple',
			'https://granblue.team',
			'auth-code',
			null,
			'nonce-xyz'
		)
		expect(apiCall(apple.fetchFn)).toMatchObject({
			url: 'http://api.test/api/v1/auth/apple',
			body: { assertion: 'provider-assertion', nonce: 'nonce-xyz' }
		})
	})

	it("passes Apple's first-login name through to the API", async () => {
		const t = setup({
			provider: 'apple',
			params: {
				user: JSON.stringify({
					name: { firstName: 'Djeeta', lastName: 'Grancypher' },
					email: 'x@privaterelay.appleid.com'
				})
			}
		})
		await t.run()
		expect(apiCall(t.fetchFn).body).toEqual({
			assertion: 'provider-assertion',
			nonce: 'nonce-xyz',
			name: 'Djeeta Grancypher'
		})
	})

	it('signs in with tokens: sets the session the password-login way and follows next', async () => {
		const t = setup({ cookies: flowCookies('discord', { next: '/teams/explore' }) })
		expect(await t.run()).toBe('/teams/explore')
		expect(t.establishSession).toHaveBeenCalledWith(t.jar.cookies, TOKEN_BODY, { secure: true })
	})

	it('accepts a token body without a scope key', async () => {
		const t = setup()
		expect(await t.run()).toBe('/me')
		expect(t.establishSession).toHaveBeenCalled()
	})

	it('signup_required: stores the ticket in an httpOnly cookie and goes to the username step', async () => {
		const t = setup({
			apiResponse: jsonResponse(200, {
				status: 'signup_required',
				ticket: 'signup-ticket',
				suggested_username: 'djeeta',
				email_required: true
			})
		})
		expect(await t.run()).toBe('/auth/choose-username')
		expect(t.establishSession).not.toHaveBeenCalled()

		const cookie = t.jar.lastSet('social_signup')
		expect(JSON.parse(cookie?.value ?? '')).toEqual({
			ticket: 'signup-ticket',
			provider: 'discord',
			suggestedUsername: 'djeeta',
			emailRequired: true
		})
		expect(cookie?.opts).toMatchObject({
			httpOnly: true,
			sameSite: 'lax',
			secure: true,
			path: '/',
			maxAge: 600
		})
	})

	it('link_required: stores the ticket in an httpOnly cookie and goes to the login prompt', async () => {
		const t = setup({
			provider: 'google',
			apiResponse: jsonResponse(200, {
				status: 'link_required',
				ticket: 'link-ticket',
				provider: 'google'
			})
		})
		expect(await t.run()).toBe('/auth/login')
		expect(t.establishSession).not.toHaveBeenCalled()

		const cookie = t.jar.lastSet('social_link')
		expect(JSON.parse(cookie?.value ?? '')).toEqual({ ticket: 'link-ticket', provider: 'google' })
		expect(cookie?.opts).toMatchObject({ httpOnly: true, sameSite: 'lax', maxAge: 600 })
	})

	it('maps invalid_assertion, disabled providers and server errors to a generic error', async () => {
		for (const res of [
			jsonResponse(401, { error: 'invalid_assertion' }),
			jsonResponse(404),
			jsonResponse(500),
			jsonResponse(200, { unexpected: true })
		]) {
			const t = setup({ apiResponse: res })
			expect(await t.run()).toBe('/auth/login?social_error=failed')
			expect(t.establishSession).not.toHaveBeenCalled()
		}
	})

	it('reports rate limiting from the API', async () => {
		const t = setup({ apiResponse: jsonResponse(429) })
		expect(await t.run()).toBe('/auth/login?social_error=rate_limited')
	})
})

describe('handleSocialCallback: link mode', () => {
	it('links with the session token instead of signing in, then returns to settings', async () => {
		const t = setup({
			provider: 'google',
			cookies: flowCookies('google', { mode: 'link', next: '/teams/explore?page=2' }),
			sessionToken: 'session-token',
			apiResponse: jsonResponse(201, {
				provider: 'google',
				email: 'djeeta@example.com',
				is_private_email: false,
				created_at: '2026-10-02T00:00:00Z'
			})
		})
		expect(await t.run()).toBe(
			'/teams/explore?page=2&settings=account&social_provider=google&social_linked=google'
		)
		const call = apiCall(t.fetchFn)
		expect(call.url).toBe('http://api.test/api/v1/users/me/identities')
		expect(call.headers.Authorization).toBe('Bearer session-token')
		expect(call.body).toEqual({
			provider: 'google',
			assertion: 'provider-assertion',
			nonce: 'nonce-xyz'
		})
		expect(t.establishSession).not.toHaveBeenCalled()
	})

	it('returns identity_taken and provider_already_linked to settings', async () => {
		for (const error of ['identity_taken', 'provider_already_linked']) {
			const t = setup({
				cookies: flowCookies('discord', { mode: 'link', next: '/me' }),
				sessionToken: 'session-token',
				apiResponse: jsonResponse(409, { error })
			})
			expect(await t.run()).toBe(
				`/me?settings=account&social_provider=discord&social_error=${error}`
			)
		}
	})

	it('reports other link failures generically', async () => {
		const t = setup({
			cookies: flowCookies('discord', { mode: 'link' }),
			sessionToken: 'session-token',
			apiResponse: jsonResponse(401, { error: 'invalid_assertion' })
		})
		expect(await t.run()).toBe('/?settings=account&social_provider=discord&social_error=failed')
	})

	it('reports a cancelled link back to settings', async () => {
		const t = setup({
			cookies: flowCookies('discord', { mode: 'link', next: '/me' }),
			sessionToken: 'session-token',
			params: { code: null, error: 'access_denied' }
		})
		expect(await t.run()).toBe(
			'/me?settings=account&social_provider=discord&social_error=cancelled'
		)
	})

	it('sends the user to log in when the session is gone', async () => {
		const t = setup({ cookies: flowCookies('discord', { mode: 'link' }), sessionToken: null })
		expect(await t.run()).toBe('/auth/login?social_error=expired')
		expect(t.fetchFn).not.toHaveBeenCalled()
	})

	it('ignores an off-site next path', async () => {
		const t = setup({
			cookies: flowCookies('discord', { mode: 'link', next: '//evil.example/x' }),
			sessionToken: 'session-token',
			apiResponse: jsonResponse(201, { provider: 'discord' })
		})
		expect(await t.run()).toBe('/?settings=account&social_provider=discord&social_linked=discord')
	})
})

describe('handleSocialCallback: next in login mode', () => {
	const NEXT = '/auth/extension?redirect_uri=https%3A%2F%2Fabc.chromiumapp.org%2F&state=s'

	it('carries next to the username step through the signup ticket', async () => {
		const t = setup({
			cookies: flowCookies('discord', { next: NEXT }),
			apiResponse: jsonResponse(200, {
				status: 'signup_required',
				ticket: 'signup-ticket',
				suggested_username: 'djeeta',
				email_required: false
			})
		})
		expect(await t.run()).toBe('/auth/choose-username')
		expect(JSON.parse(t.jar.lastSet('social_signup')?.value ?? '')).toMatchObject({ next: NEXT })
	})

	it('keeps an off-site next out of the signup ticket', async () => {
		const t = setup({
			cookies: flowCookies('discord', { next: '//evil.example/x' }),
			apiResponse: jsonResponse(200, { status: 'signup_required', ticket: 'signup-ticket' })
		})
		await t.run()
		expect(JSON.parse(t.jar.lastSet('social_signup')?.value ?? '')).toMatchObject({ next: '/me' })
	})

	it('keeps next on the login page for a password login that links the provider', async () => {
		const t = setup({
			provider: 'google',
			cookies: flowCookies('google', { next: NEXT }),
			apiResponse: jsonResponse(200, {
				status: 'link_required',
				ticket: 'link-ticket',
				provider: 'google'
			})
		})
		const location = new URL(await t.run(), 'https://granblue.team')
		expect(location.pathname).toBe('/auth/login')
		expect(location.searchParams.get('next')).toBe(NEXT)
	})

	it('keeps next on the login page after a cancelled or failed sign-in', async () => {
		const cancelled = setup({
			cookies: flowCookies('discord', { next: NEXT }),
			params: { code: null, error: 'access_denied' }
		})
		const location = new URL(await cancelled.run(), 'https://granblue.team')
		expect(location.searchParams.get('social_error')).toBe('cancelled')
		expect(location.searchParams.get('next')).toBe(NEXT)

		const failed = setup({
			cookies: flowCookies('discord', { next: NEXT }),
			apiResponse: jsonResponse(500)
		})
		const failedLocation = new URL(await failed.run(), 'https://granblue.team')
		expect(failedLocation.searchParams.get('social_error')).toBe('failed')
		expect(failedLocation.searchParams.get('next')).toBe(NEXT)
	})
})

describe('appleName', () => {
	it('joins first and last name', () => {
		expect(appleName('{"name":{"firstName":" Djeeta ","lastName":"Grancypher"}}')).toBe(
			'Djeeta Grancypher'
		)
		expect(appleName('{"name":{"firstName":"Gran"}}')).toBe('Gran')
	})

	it('returns null when there is no usable name', () => {
		expect(appleName(null)).toBeNull()
		expect(appleName('not json')).toBeNull()
		expect(appleName('{"email":"x@example.com"}')).toBeNull()
		expect(appleName('{"name":{"firstName":"  "}}')).toBeNull()
	})
})
