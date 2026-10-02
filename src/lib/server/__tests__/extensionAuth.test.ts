import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockCookies } from '../socialAuth/__tests__/mockCookies'

const privateEnv: Record<string, string | undefined> = {}

vi.mock('$env/dynamic/private', () => ({ env: privateEnv }))
vi.mock('$env/dynamic/public', () => ({ env: {} }))
vi.mock('$app/environment', () => ({ dev: false }))
vi.mock('$lib/api/adapters/config', () => ({ getApiBaseUrl: () => 'http://api.test/api/v1' }))

const { configuredExtensionIds, isAllowedRedirectUri, parseExtensionAuthRequest } = await import(
	'../extensionAuth'
)
const pageRoute = await import('../../../routes/auth/extension/+page.server')
const codeRoute = await import('../../../routes/auth/extension/code/+server')

const ID = 'abcdefghijklmnopabcdefghijklmnop'
const DEV_ID = 'ponmlkjihgfedcbaponmlkjihgfedcba'
const REDIRECT = `https://${ID}.chromiumapp.org/`
const CHALLENGE = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM'

const VALID = {
	redirect_uri: REDIRECT,
	code_challenge: CHALLENGE,
	code_challenge_method: 'S256',
	state: 'state-123'
}

function query(overrides: Record<string, string | null> = {}): URLSearchParams {
	const params = new URLSearchParams()
	for (const [key, value] of Object.entries({ ...VALID, ...overrides })) {
		if (value !== null) params.set(key, value)
	}
	return params
}

interface Thrown {
	status: number
	location?: string
	body?: { message: string }
}

async function thrown(fn: () => unknown): Promise<Thrown> {
	try {
		await fn()
	} catch (e) {
		return e as Thrown
	}
	throw new Error('expected the handler to throw a redirect or error')
}

function session(authenticated: boolean) {
	return {
		isAuthenticated: authenticated,
		account: authenticated
			? { token: 'session-token', username: 'djeeta', userId: 'u1', role: 1 }
			: null,
		user: null
	}
}

beforeEach(() => {
	privateEnv.EXTENSION_IDS = `${ID}, ${DEV_ID}`
	vi.restoreAllMocks()
	vi.spyOn(console, 'warn').mockImplementation(() => {})
})

describe('redirect_uri allowlist', () => {
	const ids = [ID]

	it('accepts exactly https://<id>.chromiumapp.org/ for a listed ID', () => {
		expect(isAllowedRedirectUri(REDIRECT, ids)).toBe(true)
	})

	it.each([
		['a wrong host', `https://${ID}.chromiumapp.org.evil.example/`],
		['another domain', `https://${ID}.example.org/`],
		['a subdomain of the redirect host', `https://x.${ID}.chromiumapp.org/`],
		['an http scheme', `http://${ID}.chromiumapp.org/`],
		['no trailing slash', `https://${ID}.chromiumapp.org`],
		['an ID not in the list', `https://${DEV_ID}.chromiumapp.org/`],
		['an extra path', `https://${ID}.chromiumapp.org/callback`],
		['a query', `https://${ID}.chromiumapp.org/?next=x`],
		['a fragment', `https://${ID}.chromiumapp.org/#x`],
		['a port', `https://${ID}.chromiumapp.org:443/`],
		['userinfo', `https://evil@${ID}.chromiumapp.org/`],
		['upper case', `https://${ID.toUpperCase()}.chromiumapp.org/`],
		['an empty value', '']
	])('rejects %s', (_label, uri) => {
		expect(isAllowedRedirectUri(uri, ids)).toBe(false)
	})

	it('rejects everything when EXTENSION_IDS is empty or unset', () => {
		expect(configuredExtensionIds('')).toEqual([])
		expect(configuredExtensionIds(' , ')).toEqual([])
		privateEnv.EXTENSION_IDS = undefined
		expect(configuredExtensionIds()).toEqual([])
		expect(parseExtensionAuthRequest(query())).toEqual({ ok: false, reason: 'redirect_uri' })
		expect(isAllowedRedirectUri(REDIRECT, [])).toBe(false)
		expect(parseExtensionAuthRequest(query(), [])).toEqual({ ok: false, reason: 'redirect_uri' })
	})

	it('reads a comma-separated EXTENSION_IDS', () => {
		expect(configuredExtensionIds(`${ID}, ${DEV_ID},`)).toEqual([ID, DEV_ID])
	})
})

describe('parseExtensionAuthRequest', () => {
	const ids = [ID]

	it('accepts a well-formed request', () => {
		expect(parseExtensionAuthRequest(query(), ids)).toEqual({
			ok: true,
			request: {
				redirectUri: REDIRECT,
				codeChallenge: CHALLENGE,
				codeChallengeMethod: 'S256',
				state: 'state-123'
			}
		})
	})

	it.each([
		['a missing redirect_uri', { redirect_uri: null }, 'redirect_uri'],
		['a missing method', { code_challenge_method: null }, 'code_challenge_method'],
		['the plain method', { code_challenge_method: 'plain' }, 'code_challenge_method'],
		['a lower-case method', { code_challenge_method: 's256' }, 'code_challenge_method'],
		['a missing challenge', { code_challenge: null }, 'code_challenge'],
		['a short challenge', { code_challenge: CHALLENGE.slice(1) }, 'code_challenge'],
		['a long challenge', { code_challenge: `${CHALLENGE}A` }, 'code_challenge'],
		['a padded challenge', { code_challenge: `${CHALLENGE.slice(1)}=` }, 'code_challenge'],
		[
			'a base64 (not url) challenge',
			{ code_challenge: `+${CHALLENGE.slice(1)}` },
			'code_challenge'
		],
		['a missing state', { state: null }, 'state'],
		['an empty state', { state: '' }, 'state'],
		['a state over 128 characters', { state: 'a'.repeat(129) }, 'state'],
		['a state with a newline', { state: 'abc\ndef' }, 'state'],
		['a state with a NUL', { state: 'abc\u0000' }, 'state']
	] as const)('rejects %s', (_label, overrides, reason) => {
		expect(parseExtensionAuthRequest(query(overrides), ids)).toEqual({ ok: false, reason })
	})

	it('accepts a 128-character state', () => {
		expect(parseExtensionAuthRequest(query({ state: 'a'.repeat(128) }), ids).ok).toBe(true)
	})

	it('rejects a repeated param', () => {
		const params = query()
		params.append('redirect_uri', `https://${DEV_ID}.chromiumapp.org/`)
		expect(parseExtensionAuthRequest(params, [ID, DEV_ID])).toEqual({
			ok: false,
			reason: 'redirect_uri'
		})
		const states = query()
		states.append('state', 'other')
		expect(parseExtensionAuthRequest(states, ids)).toEqual({ ok: false, reason: 'state' })
	})

	it('checks redirect_uri before anything else', () => {
		const result = parseExtensionAuthRequest(
			query({ redirect_uri: 'https://evil.example/', state: null, code_challenge: null }),
			ids
		)
		expect(result).toEqual({ ok: false, reason: 'redirect_uri' })
	})
})

describe('GET /auth/extension', () => {
	function load(params: URLSearchParams, { authenticated = true } = {}) {
		const url = new URL(`https://granblue.team/auth/extension?${params}`)
		const setHeaders = vi.fn()
		const event = { url, locals: { session: session(authenticated) }, setHeaders }
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return { url, setHeaders, run: () => pageRoute.load(event as any) }
	}

	it('renders an error page and never redirects for a bad redirect_uri', async () => {
		for (const authenticated of [true, false]) {
			const t = load(query({ redirect_uri: 'https://evil.example/' }), { authenticated })
			const result = await thrown(t.run)
			expect(result.status).toBe(400)
			expect(result.location).toBeUndefined()
		}
	})

	it('renders an error page for other bad params, even when logged out', async () => {
		const t = load(query({ code_challenge_method: 'plain' }), { authenticated: false })
		const result = await thrown(t.run)
		expect(result.status).toBe(400)
		expect(result.location).toBeUndefined()
	})

	it('renders an error page when EXTENSION_IDS is empty', async () => {
		privateEnv.EXTENSION_IDS = ''
		const result = await thrown(load(query()).run)
		expect(result.status).toBe(400)
	})

	it('sends a logged-out user to log in, coming back to this exact URL', async () => {
		const t = load(query())
		const anonymous = load(query(), { authenticated: false })
		const result = await thrown(anonymous.run)
		expect(result.status).toBe(302)
		const location = new URL(result.location ?? '', 'https://granblue.team')
		expect(location.pathname).toBe('/auth/login')
		expect(location.searchParams.get('next')).toBe(`${t.url.pathname}${t.url.search}`)
	})

	it('shows the confirmation to a logged-in user, with the cancel URL', async () => {
		const t = load(query())
		const data = (await t.run()) as Record<string, unknown>
		expect(data.username).toBe('djeeta')
		expect(data.params).toEqual(VALID)
		expect(t.setHeaders).toHaveBeenCalledWith({ 'cache-control': 'no-store' })
	})

	it('cancel goes to redirect_uri with error=access_denied and the state', async () => {
		const data = (await load(query({ state: 'a b&c' })).run()) as { cancelUrl: string }
		const cancel = new URL(data.cancelUrl)
		expect(`${cancel.origin}${cancel.pathname}`).toBe(REDIRECT)
		expect(cancel.searchParams.get('error')).toBe('access_denied')
		expect(cancel.searchParams.get('state')).toBe('a b&c')
		expect(cancel.searchParams.get('code')).toBeNull()
	})
})

describe('POST /auth/extension/code', () => {
	function jsonResponse(status: number, body?: unknown) {
		return new Response(body === undefined ? null : JSON.stringify(body), {
			status,
			headers: { 'content-type': 'application/json' }
		})
	}

	function post({
		body = VALID as unknown,
		authenticated = true,
		apiResponse = jsonResponse(201, { code: 'one-time-code', expires_in: 60 }),
		contentType = 'application/json'
	}: {
		body?: unknown
		authenticated?: boolean
		apiResponse?: Response | Error
		contentType?: string
	} = {}) {
		const jar = createMockCookies()
		const fetchFn =
			apiResponse instanceof Error
				? vi.fn().mockRejectedValue(apiResponse)
				: vi.fn().mockResolvedValue(apiResponse)
		const request = new Request('https://granblue.team/auth/extension/code', {
			method: 'POST',
			headers: { 'content-type': contentType },
			body: typeof body === 'string' ? body : JSON.stringify(body)
		})
		const event = {
			request,
			locals: { session: session(authenticated) },
			cookies: jar.cookies,
			fetch: fetchFn
		}
		return {
			jar,
			fetchFn,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			run: async () => (await codeRoute.POST(event as any)) as Response
		}
	}

	it('creates a code with the session token and returns the redirect URL with code and state', async () => {
		const t = post()
		const res = await t.run()
		expect(res.status).toBe(200)
		expect(res.headers.get('cache-control')).toBe('no-store')

		const { url } = (await res.json()) as { url: string }
		const target = new URL(url)
		expect(`${target.origin}${target.pathname}`).toBe(REDIRECT)
		expect(target.searchParams.get('code')).toBe('one-time-code')
		expect(target.searchParams.get('state')).toBe('state-123')

		const [apiUrl, init] = t.fetchFn.mock.calls[0] as [string, RequestInit]
		expect(apiUrl).toBe('http://api.test/api/v1/extension_auth/codes')
		expect(init.method).toBe('POST')
		expect((init.headers as Record<string, string>).Authorization).toBe('Bearer session-token')
		expect(JSON.parse(String(init.body))).toEqual({
			code_challenge: CHALLENGE,
			code_challenge_method: 'S256'
		})
	})

	it('encodes the state into the redirect URL', async () => {
		const res = await post({ body: { ...VALID, state: 'a b&c=d' } }).run()
		const { url } = (await res.json()) as { url: string }
		expect(new URL(url).searchParams.get('state')).toBe('a b&c=d')
	})

	it('returns 401 and logs out when the API rejects the session token', async () => {
		const t = post({ apiResponse: jsonResponse(401) })
		const res = await t.run()
		expect(res.status).toBe(401)
		expect(await res.json()).toEqual({ error: 'unauthorized' })
		expect(t.jar.deletes.map((d) => d.name)).toEqual(
			expect.arrayContaining(['account', 'user', 'refresh'])
		)
	})

	it('returns 429 when the API rate-limits the user', async () => {
		const t = post({ apiResponse: jsonResponse(429) })
		const res = await t.run()
		expect(res.status).toBe(429)
		expect(await res.json()).toEqual({ error: 'rate_limited' })
		expect(t.jar.deletes).toEqual([])
	})

	it('returns 502 for API errors and malformed responses, without logging the code', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
		for (const apiResponse of [
			jsonResponse(500),
			jsonResponse(422, { error: 'invalid_request' }),
			jsonResponse(201, { expires_in: 60 }),
			jsonResponse(200, { code: 'one-time-code' }),
			new Error('network down one-time-code')
		]) {
			const res = await post({ apiResponse }).run()
			expect(res.status).toBe(502)
		}
		expect(warn.mock.calls.flat().join(' ')).not.toContain('one-time-code')
	})

	it('returns 401 without calling the API when logged out', async () => {
		const t = post({ authenticated: false })
		const res = await t.run()
		expect(res.status).toBe(401)
		expect(t.fetchFn).not.toHaveBeenCalled()
	})

	it('re-checks every param and never calls the API for a bad request', async () => {
		for (const body of [
			{ ...VALID, redirect_uri: 'https://evil.example/' },
			{ ...VALID, code_challenge: 'short' },
			{ ...VALID, code_challenge_method: 'plain' },
			{ ...VALID, state: '' },
			{ ...VALID, state: 42 },
			[VALID],
			'not json',
			null
		]) {
			const t = post({ body })
			const res = await t.run()
			expect(res.status).toBe(400)
			expect(t.fetchFn).not.toHaveBeenCalled()
		}
	})

	it('only accepts JSON', async () => {
		const t = post({ contentType: 'text/plain' })
		expect((await t.run()).status).toBe(415)
		expect(t.fetchFn).not.toHaveBeenCalled()
	})
})
