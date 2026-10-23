import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

const privateEnv: Record<string, string | undefined> = {
	DISCORD_CLIENT_ID: 'discord-id',
	DISCORD_CLIENT_SECRET: 'discord-secret',
	GOOGLE_CLIENT_ID: 'google-id',
	GOOGLE_CLIENT_SECRET: 'google-secret',
	APPLE_SERVICES_ID: 'team.granblue.web',
	APPLE_TEAM_ID: 'TEAMID',
	APPLE_KEY_ID: 'KEYID'
}

vi.mock('$env/dynamic/private', () => ({ env: privateEnv }))
vi.mock('$env/dynamic/public', () => ({
	env: { PUBLIC_SOCIAL_LOGIN_PROVIDERS: 'discord,google,apple' }
}))

const { createAppleClientSecret, createAuthorization, exchangeCode, resetAppleClientSecretCache } =
	await import('../clients')

const ORIGIN = 'https://granblue.team'
let appleKeys: CryptoKeyPair

beforeAll(async () => {
	appleKeys = (await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, [
		'sign',
		'verify'
	])) as CryptoKeyPair
	const pkcs8 = Buffer.from(await crypto.subtle.exportKey('pkcs8', appleKeys.privateKey))
	// Stored the way Railway variables usually hold it: one line with literal \n.
	privateEnv.APPLE_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----\\n${pkcs8.toString('base64')}\\n-----END PRIVATE KEY-----`
})

afterEach(() => {
	vi.unstubAllGlobals()
	resetAppleClientSecretCache()
})

const decode = (part: string) => JSON.parse(Buffer.from(part, 'base64url').toString())

/** An ID token with the given claims. The signature is never checked here (the API checks it). */
function idToken(claims: Record<string, unknown>) {
	const header = Buffer.from(JSON.stringify({ alg: 'RS256', kid: 'k1' })).toString('base64url')
	const payload = Buffer.from(JSON.stringify(claims)).toString('base64url')
	return `${header}.${payload}.c2lnbmF0dXJl`
}

function stubTokenEndpoint(body: Record<string, unknown>) {
	const fetchMock = vi.fn(
		async () =>
			new Response(JSON.stringify(body), {
				status: 200,
				headers: { 'content-type': 'application/json' }
			})
	)
	vi.stubGlobal('fetch', fetchMock)
	return {
		fetchMock,
		request: (i = 0) => {
			const [url, init] = fetchMock.mock.calls[i] as unknown as [string | URL, RequestInit]
			return { url: String(url), body: new URLSearchParams(String(init.body)) }
		}
	}
}

describe('createAuthorization', () => {
	it('uses PKCE (S256) for Discord and Google, a nonce for Google and Apple', async () => {
		const discord = await createAuthorization('discord', ORIGIN)
		expect(discord.url.origin + discord.url.pathname).toBe('https://discord.com/oauth2/authorize')
		expect(discord.url.searchParams.get('code_challenge_method')).toBe('S256')
		expect(discord.url.searchParams.get('code_challenge')).toBeTruthy()
		expect(discord.url.searchParams.get('scope')).toBe('identify email')
		expect(discord.nonce).toBeNull()

		const google = await createAuthorization('google', ORIGIN)
		expect(google.url.searchParams.get('code_challenge_method')).toBe('S256')
		expect(google.url.searchParams.get('nonce')).toBe(google.nonce)
		expect(google.url.searchParams.get('scope')).toBe('openid email profile')
		expect(google.url.searchParams.get('redirect_uri')).toBe(`${ORIGIN}/auth/google/callback`)

		const apple = await createAuthorization('apple', ORIGIN)
		expect(apple.codeVerifier).toBeNull()
		expect(apple.url.searchParams.get('code_challenge')).toBeNull()
		expect(apple.url.searchParams.get('nonce')).toBe(apple.nonce)
		expect(apple.url.searchParams.get('response_mode')).toBe('form_post')
		expect(apple.url.searchParams.get('client_id')).toBe('team.granblue.web')
	})
})

describe('exchangeCode', () => {
	it('Discord: sends the PKCE verifier and returns the access token', async () => {
		const endpoint = stubTokenEndpoint({ access_token: 'discord-access', token_type: 'Bearer' })
		expect(await exchangeCode('discord', ORIGIN, 'the-code', 'the-verifier', null)).toBe(
			'discord-access'
		)

		const { url, body } = endpoint.request()
		expect(url).toBe('https://discord.com/api/oauth2/token')
		expect(body.get('grant_type')).toBe('authorization_code')
		expect(body.get('code')).toBe('the-code')
		expect(body.get('code_verifier')).toBe('the-verifier')
		expect(body.get('redirect_uri')).toBe(`${ORIGIN}/auth/discord/callback`)
		expect(body.get('client_id')).toBe('discord-id')
		expect(body.get('client_secret')).toBe('discord-secret')
	})

	const googleClaims = (nonce: string) => ({
		iss: 'https://accounts.google.com',
		aud: 'google-id',
		sub: '1234',
		iat: Math.floor(Date.now() / 1000),
		exp: Math.floor(Date.now() / 1000) + 600,
		nonce
	})

	it('Google: validates the ID token nonce and returns the raw ID token', async () => {
		const token = idToken(googleClaims('the-nonce'))
		const endpoint = stubTokenEndpoint({
			access_token: 'google-access',
			token_type: 'Bearer',
			id_token: token
		})
		expect(await exchangeCode('google', ORIGIN, 'the-code', 'the-verifier', 'the-nonce')).toBe(
			token
		)
		expect(endpoint.request().url).toBe('https://oauth2.googleapis.com/token')
		expect(endpoint.request().body.get('code_verifier')).toBe('the-verifier')
	})

	it('Google: rejects an ID token with a different nonce', async () => {
		stubTokenEndpoint({
			access_token: 'google-access',
			token_type: 'Bearer',
			id_token: idToken(googleClaims('someone-elses-nonce'))
		})
		await expect(
			exchangeCode('google', ORIGIN, 'the-code', 'the-verifier', 'the-nonce')
		).rejects.toThrow()
	})

	it('Google: rejects an ID token for another client', async () => {
		stubTokenEndpoint({
			access_token: 'google-access',
			token_type: 'Bearer',
			id_token: idToken({ ...googleClaims('the-nonce'), aud: 'other-app' })
		})
		await expect(
			exchangeCode('google', ORIGIN, 'the-code', 'the-verifier', 'the-nonce')
		).rejects.toThrow()
	})

	it('Google: rejects a response without an ID token', async () => {
		stubTokenEndpoint({ access_token: 'google-access', token_type: 'Bearer' })
		await expect(
			exchangeCode('google', ORIGIN, 'the-code', 'the-verifier', 'the-nonce')
		).rejects.toThrow()
	})

	it('Apple: authenticates with a signed client secret, no PKCE, and reuses the secret', async () => {
		const token = idToken({
			iss: 'https://appleid.apple.com',
			aud: 'team.granblue.web',
			sub: '000123.abc',
			iat: Math.floor(Date.now() / 1000),
			exp: Math.floor(Date.now() / 1000) + 600,
			nonce: 'the-nonce'
		})
		const endpoint = stubTokenEndpoint({
			access_token: 'apple-access',
			token_type: 'Bearer',
			id_token: token
		})

		expect(await exchangeCode('apple', ORIGIN, 'the-code', null, 'the-nonce')).toBe(token)
		await exchangeCode('apple', ORIGIN, 'the-code', null, 'the-nonce')

		const first = endpoint.request(0)
		expect(first.url).toBe('https://appleid.apple.com/auth/token')
		expect(first.body.get('code_verifier')).toBeNull()
		expect(first.body.get('client_id')).toBe('team.granblue.web')
		const secret = first.body.get('client_secret') ?? ''
		expect(decode(secret.split('.')[1] ?? '')).toMatchObject({
			iss: 'TEAMID',
			sub: 'team.granblue.web'
		})
		expect(endpoint.request(1).body.get('client_secret')).toBe(secret)
	})
})

describe('createAppleClientSecret', () => {
	it('signs an ES256 JWT that verifies with the key and expires within an hour', async () => {
		const now = 1_800_000_000
		const { secret, expiresAt } = await createAppleClientSecret(
			{
				teamId: 'TEAMID',
				keyId: 'KEYID',
				servicesId: 'team.granblue.web',
				privateKeyPem: privateEnv.APPLE_PRIVATE_KEY ?? ''
			},
			now
		)
		const [header, payload, signature] = secret.split('.') as [string, string, string]

		expect(decode(header)).toEqual({ alg: 'ES256', kid: 'KEYID', typ: 'JWT' })
		expect(decode(payload)).toEqual({
			iss: 'TEAMID',
			iat: now,
			exp: now + 3600,
			aud: 'https://appleid.apple.com',
			sub: 'team.granblue.web'
		})
		expect(expiresAt).toBe(now + 3600)

		const valid = await crypto.subtle.verify(
			{ name: 'ECDSA', hash: 'SHA-256' },
			appleKeys.publicKey,
			Buffer.from(signature, 'base64url'),
			new TextEncoder().encode(`${header}.${payload}`)
		)
		expect(valid).toBe(true)
	})
})
