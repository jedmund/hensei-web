import { describe, expect, it, vi } from 'vitest'
import { createMockCookies } from './mockCookies'

const privateEnv: Record<string, string | undefined> = {
	DISCORD_CLIENT_ID: 'discord-id',
	DISCORD_CLIENT_SECRET: 'discord-secret',
	GOOGLE_CLIENT_ID: 'google-id',
	GOOGLE_CLIENT_SECRET: 'google-secret',
	APPLE_SERVICES_ID: 'team.granblue.web',
	APPLE_TEAM_ID: 'TEAMID',
	APPLE_KEY_ID: 'KEYID',
	APPLE_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\\nAAAA\\n-----END PRIVATE KEY-----'
}
const publicEnv: Record<string, string | undefined> = {
	PUBLIC_SOCIAL_LOGIN_PROVIDERS: 'discord,google,apple'
}

vi.mock('$env/dynamic/private', () => ({ env: privateEnv }))
vi.mock('$env/dynamic/public', () => ({ env: publicEnv }))
vi.mock('$app/environment', () => ({ dev: false }))
vi.mock('$lib/api/adapters/config', () => ({ getApiBaseUrl: () => 'http://api.test/api/v1' }))
vi.mock('$lib/auth/session', () => ({ establishSession: vi.fn() }))

const startRoute = await import('../../../../routes/auth/[provider=socialProvider]/+server')
const callbackRoute = await import(
	'../../../../routes/auth/[provider=socialProvider]/callback/+server'
)
const { applePrivateKeyBytes, isProviderAvailable } = await import('../clients')

interface Thrown {
	status: number
	location?: string
}

async function thrown(fn: () => unknown): Promise<Thrown> {
	try {
		await fn()
	} catch (e) {
		return e as Thrown
	}
	throw new Error('expected the handler to throw a redirect or error')
}

function startEvent(path: string, { authenticated = false } = {}) {
	const jar = createMockCookies()
	const url = new URL(path, 'https://granblue.team')
	const provider = url.pathname.split('/')[2]
	const event = {
		params: { provider },
		url,
		cookies: jar.cookies,
		locals: {
			session: {
				isAuthenticated: authenticated,
				account: authenticated ? { token: 'session-token' } : null
			}
		}
	}
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return { jar, run: () => thrown(() => startRoute.GET(event as any)) }
}

describe('GET /auth/{provider}', () => {
	it('sets Lax state and PKCE cookies for Discord and redirects to Discord', async () => {
		const { jar, run } = startEvent('/auth/discord?next=/teams/explore')
		const result = await run()
		expect(result.status).toBe(302)

		const location = new URL(result.location ?? '')
		expect(location.origin).toBe('https://discord.com')
		expect(location.searchParams.get('client_id')).toBe('discord-id')
		expect(location.searchParams.get('redirect_uri')).toBe(
			'https://granblue.team/auth/discord/callback'
		)
		expect(location.searchParams.get('code_challenge_method')).toBe('S256')
		expect(location.searchParams.get('nonce')).toBeNull()

		const state = jar.lastSet('oauth_discord_state')
		expect(location.searchParams.get('state')).toBe(state?.value)
		expect(jar.lastSet('oauth_discord_verifier')?.value).toBeTruthy()
		expect(jar.lastSet('oauth_discord_nonce')).toBeUndefined()
		expect(jar.lastSet('oauth_discord_mode')?.value).toBe('login')
		expect(jar.lastSet('oauth_discord_next')?.value).toBe('/teams/explore')

		for (const call of jar.sets) {
			expect(call.opts).toEqual({
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				secure: true,
				maxAge: 600
			})
		}
	})

	it('adds a nonce for Google', async () => {
		const { jar, run } = startEvent('/auth/google')
		const location = new URL((await run()).location ?? '')
		const nonce = jar.lastSet('oauth_google_nonce')?.value
		expect(nonce).toBeTruthy()
		expect(location.searchParams.get('nonce')).toBe(nonce)
		expect(jar.lastSet('oauth_google_verifier')?.value).toBeTruthy()
		expect(jar.lastSet('oauth_google_state')?.opts.sameSite).toBe('lax')
	})

	it("gives only Apple's flow cookies SameSite=None; Secure and asks for form_post", async () => {
		const { jar, run } = startEvent('/auth/apple')
		const location = new URL((await run()).location ?? '')
		expect(location.origin).toBe('https://appleid.apple.com')
		expect(location.searchParams.get('response_mode')).toBe('form_post')
		expect(location.searchParams.get('nonce')).toBe(jar.lastSet('oauth_apple_nonce')?.value)

		expect(jar.sets.map((c) => c.name).sort()).toEqual([
			'oauth_apple_mode',
			'oauth_apple_nonce',
			'oauth_apple_state'
		])
		for (const call of jar.sets) {
			expect(call.opts).toEqual({
				path: '/',
				httpOnly: true,
				sameSite: 'none',
				secure: true,
				maxAge: 600
			})
		}
	})

	it('records link mode for a logged-in user', async () => {
		const { jar, run } = startEvent('/auth/discord?mode=link&next=/me', { authenticated: true })
		expect((await run()).status).toBe(302)
		expect(jar.lastSet('oauth_discord_mode')?.value).toBe('link')
		expect(jar.lastSet('oauth_discord_next')?.value).toBe('/me')
	})

	it('sends link mode to the login page without a session', async () => {
		const { jar, run } = startEvent('/auth/discord?mode=link&next=/me')
		expect(await run()).toMatchObject({ status: 302, location: '/auth/login?next=%2Fme' })
		expect(jar.sets).toHaveLength(0)
	})

	it('404s for providers missing from PUBLIC_SOCIAL_LOGIN_PROVIDERS', async () => {
		publicEnv.PUBLIC_SOCIAL_LOGIN_PROVIDERS = 'discord'
		try {
			const { jar, run } = startEvent('/auth/google')
			expect((await run()).status).toBe(404)
			expect(jar.sets).toHaveLength(0)
		} finally {
			publicEnv.PUBLIC_SOCIAL_LOGIN_PROVIDERS = 'discord,google,apple'
		}
	})

	it('404s for every provider when the flag is unset', async () => {
		publicEnv.PUBLIC_SOCIAL_LOGIN_PROVIDERS = undefined
		try {
			for (const provider of ['discord', 'google', 'apple'] as const) {
				expect(isProviderAvailable(provider)).toBe(false)
			}
			expect((await startEvent('/auth/discord').run()).status).toBe(404)
		} finally {
			publicEnv.PUBLIC_SOCIAL_LOGIN_PROVIDERS = 'discord,google,apple'
		}
	})

	it('404s when a flagged provider has no credentials', async () => {
		const secret = privateEnv.DISCORD_CLIENT_SECRET
		privateEnv.DISCORD_CLIENT_SECRET = undefined
		try {
			expect((await startEvent('/auth/discord').run()).status).toBe(404)
		} finally {
			privateEnv.DISCORD_CLIENT_SECRET = secret
		}
	})
})

describe('POST /auth/apple/callback', () => {
	function postEvent(provider: string, form: Record<string, string>) {
		const jar = createMockCookies()
		const url = new URL(`/auth/${provider}/callback`, 'https://granblue.team')
		const event = {
			params: { provider },
			url,
			cookies: jar.cookies,
			request: new Request(url, { method: 'POST', body: new URLSearchParams(form) })
		}
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return { jar, run: () => callbackRoute.POST(event as any) }
	}

	it('parks the form_post params in a short-lived None cookie and continues as a GET', async () => {
		const { jar, run } = postEvent('apple', {
			code: 'apple-code',
			state: 'state-123',
			user: '{"name":{"firstName":"Djeeta"}}'
		})
		const result = await thrown(run)
		expect(result).toMatchObject({ status: 303, location: '/auth/apple/callback' })

		const cookie = jar.lastSet('oauth_apple_callback')
		expect(JSON.parse(cookie?.value ?? '')).toEqual({
			code: 'apple-code',
			state: 'state-123',
			error: null,
			user: '{"name":{"firstName":"Djeeta"}}'
		})
		expect(cookie?.opts).toEqual({
			path: '/',
			httpOnly: true,
			sameSite: 'none',
			secure: true,
			maxAge: 60
		})
	})

	it('refuses POSTs for the other providers', async () => {
		const { jar, run } = postEvent('discord', { code: 'x', state: 'y' })
		const res = (await run()) as Response
		expect(res.status).toBe(405)
		expect(jar.sets).toHaveLength(0)
	})
})

describe('GET /auth/apple/callback', () => {
	it('reads the parked params once and checks state against the Apple cookie', async () => {
		const jar = createMockCookies({
			oauth_apple_state: 'state-123',
			oauth_apple_nonce: 'nonce-xyz',
			oauth_apple_mode: 'login',
			oauth_apple_callback: JSON.stringify({
				code: 'apple-code',
				state: 'wrong-state',
				error: null,
				user: null
			})
		})
		const url = new URL('/auth/apple/callback', 'https://granblue.team')
		const event = {
			params: { provider: 'apple' },
			url,
			cookies: jar.cookies,
			fetch: vi.fn(),
			locals: { session: { account: null } }
		}
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await thrown(() => callbackRoute.GET(event as any))
		expect(result).toMatchObject({ status: 303, location: '/auth/login?social_error=failed' })
		expect(jar.store.has('oauth_apple_callback')).toBe(false)
		expect(event.fetch).not.toHaveBeenCalled()

		const deleted = jar.deletes.find((d) => d.name === 'oauth_apple_state')
		expect(deleted?.opts).toMatchObject({ sameSite: 'none', secure: true, path: '/' })
	})

	it('ignores code and state in the query string for Apple', async () => {
		const jar = createMockCookies({ oauth_apple_state: 'state-123', oauth_apple_mode: 'login' })
		const url = new URL(
			'/auth/apple/callback?code=apple-code&state=state-123',
			'https://granblue.team'
		)
		const event = {
			params: { provider: 'apple' },
			url,
			cookies: jar.cookies,
			fetch: vi.fn(),
			locals: { session: { account: null } }
		}
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await thrown(() => callbackRoute.GET(event as any))
		expect(result).toMatchObject({ status: 303, location: '/auth/login?social_error=failed' })
		expect(event.fetch).not.toHaveBeenCalled()
	})
})

describe('applePrivateKeyBytes', () => {
	it('decodes a PEM with escaped newlines', () => {
		const pem = '-----BEGIN PRIVATE KEY-----\\nAQID\\nBA==\\n-----END PRIVATE KEY-----'
		expect([...applePrivateKeyBytes(pem)]).toEqual([1, 2, 3, 4])
	})
})
