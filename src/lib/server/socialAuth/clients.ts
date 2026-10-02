import * as oauth from 'oauth4webapi'
import { env } from '$env/dynamic/private'
import { env as publicEnv } from '$env/dynamic/public'
import { parseSocialProviders, type SocialProvider } from '$lib/auth/socialProviders'

/**
 * Provider OAuth clients, built on oauth4webapi. This module builds the
 * authorization URLs and exchanges codes; everything after that (verifying
 * who the user is, issuing tokens) happens in the API, which checks the
 * assertion with the provider itself.
 *
 * Errors from oauth4webapi can carry provider response bodies. Callers log
 * only the error class, never the error itself.
 */

const SCOPES: Record<SocialProvider, string[]> = {
	discord: ['identify', 'email'],
	google: ['openid', 'email', 'profile'],
	apple: ['name', 'email']
}

/**
 * Static authorization server metadata, so sign-in never waits on a discovery
 * request. Google's and Apple's values match their published
 * /.well-known/openid-configuration; Discord isn't an OpenID provider.
 */
const SERVERS: Record<SocialProvider, oauth.AuthorizationServer> = {
	discord: {
		issuer: 'https://discord.com',
		authorization_endpoint: 'https://discord.com/oauth2/authorize',
		token_endpoint: 'https://discord.com/api/oauth2/token'
	},
	google: {
		issuer: 'https://accounts.google.com',
		authorization_endpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
		token_endpoint: 'https://oauth2.googleapis.com/token',
		id_token_signing_alg_values_supported: ['RS256']
	},
	apple: {
		issuer: 'https://appleid.apple.com',
		authorization_endpoint: 'https://appleid.apple.com/auth/authorize',
		token_endpoint: 'https://appleid.apple.com/auth/token',
		id_token_signing_alg_values_supported: ['RS256']
	}
}

/** The redirect URI registered with each provider. Never locale-prefixed. */
export function callbackUrl(origin: string, provider: SocialProvider): string {
	return `${origin}/auth/${provider}/callback`
}

/** Providers listed in PUBLIC_SOCIAL_LOGIN_PROVIDERS. */
export function enabledProviders(): SocialProvider[] {
	return parseSocialProviders(publicEnv.PUBLIC_SOCIAL_LOGIN_PROVIDERS)
}

/** Whether a provider is both switched on and has its credentials configured. */
export function isProviderAvailable(provider: SocialProvider): boolean {
	return enabledProviders().includes(provider) && hasCredentials(provider)
}

function hasCredentials(provider: SocialProvider): boolean {
	switch (provider) {
		case 'discord':
			return Boolean(env.DISCORD_CLIENT_ID && env.DISCORD_CLIENT_SECRET)
		case 'google':
			return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET)
		case 'apple':
			return Boolean(
				env.APPLE_SERVICES_ID && env.APPLE_TEAM_ID && env.APPLE_KEY_ID && env.APPLE_PRIVATE_KEY
			)
	}
}

function clientId(provider: SocialProvider): string {
	switch (provider) {
		case 'discord':
			return env.DISCORD_CLIENT_ID ?? ''
		case 'google':
			return env.GOOGLE_CLIENT_ID ?? ''
		case 'apple':
			return env.APPLE_SERVICES_ID ?? ''
	}
}

/* Apple's client secret: an ES256 JWT signed with the Sign in with Apple key. */

/**
 * Converts the Sign in with Apple key (.p8 PEM, possibly with literal "\n"
 * sequences from an env var) into PKCS#8 bytes.
 */
export function applePrivateKeyBytes(pem: string): Uint8Array<ArrayBuffer> {
	const body = pem
		.replace(/\\n/g, '\n')
		.replace(/-----BEGIN PRIVATE KEY-----/, '')
		.replace(/-----END PRIVATE KEY-----/, '')
		.replace(/\s+/g, '')
	return new Uint8Array(Buffer.from(body, 'base64'))
}

const base64url = (data: string | Uint8Array) => Buffer.from(data).toString('base64url')

/** Apple allows up to six months; one hour keeps a leaked secret short-lived. */
const APPLE_SECRET_LIFETIME = 60 * 60
/** Reuse a secret only while it has at least this long left. */
const APPLE_SECRET_REFRESH_MARGIN = 10 * 60

let appleSecretCache: { secret: string; expiresAt: number; keyFingerprint: string } | null = null

export async function createAppleClientSecret(
	{
		teamId,
		keyId,
		servicesId,
		privateKeyPem
	}: { teamId: string; keyId: string; servicesId: string; privateKeyPem: string },
	now = Math.floor(Date.now() / 1000)
): Promise<{ secret: string; expiresAt: number }> {
	const key = await crypto.subtle.importKey(
		'pkcs8',
		applePrivateKeyBytes(privateKeyPem),
		{ name: 'ECDSA', namedCurve: 'P-256' },
		false,
		['sign']
	)
	const expiresAt = now + APPLE_SECRET_LIFETIME
	const header = base64url(JSON.stringify({ alg: 'ES256', kid: keyId, typ: 'JWT' }))
	const payload = base64url(
		JSON.stringify({
			iss: teamId,
			iat: now,
			exp: expiresAt,
			aud: 'https://appleid.apple.com',
			sub: servicesId
		})
	)
	// WebCrypto's ECDSA signature is already the raw r||s form JWS expects.
	const signature = await crypto.subtle.sign(
		{ name: 'ECDSA', hash: 'SHA-256' },
		key,
		new TextEncoder().encode(`${header}.${payload}`)
	)
	return { secret: `${header}.${payload}.${base64url(new Uint8Array(signature))}`, expiresAt }
}

async function appleClientSecret(): Promise<string> {
	const params = {
		teamId: env.APPLE_TEAM_ID ?? '',
		keyId: env.APPLE_KEY_ID ?? '',
		servicesId: env.APPLE_SERVICES_ID ?? '',
		privateKeyPem: env.APPLE_PRIVATE_KEY ?? ''
	}
	// Rotating any of these invalidates the cached secret.
	const keyFingerprint = `${params.teamId}:${params.keyId}:${params.servicesId}`
	const now = Math.floor(Date.now() / 1000)
	if (
		appleSecretCache &&
		appleSecretCache.keyFingerprint === keyFingerprint &&
		appleSecretCache.expiresAt - now > APPLE_SECRET_REFRESH_MARGIN
	) {
		return appleSecretCache.secret
	}
	const { secret, expiresAt } = await createAppleClientSecret(params, now)
	appleSecretCache = { secret, expiresAt, keyFingerprint }
	return secret
}

/** Test hook: forget the cached Apple client secret. */
export function resetAppleClientSecretCache() {
	appleSecretCache = null
}

async function clientAuth(provider: SocialProvider): Promise<oauth.ClientAuth> {
	switch (provider) {
		case 'discord':
			return oauth.ClientSecretPost(env.DISCORD_CLIENT_SECRET ?? '')
		case 'google':
			return oauth.ClientSecretPost(env.GOOGLE_CLIENT_SECRET ?? '')
		case 'apple':
			return oauth.ClientSecretPost(await appleClientSecret())
	}
}

export interface AuthorizationRequest {
	url: URL
	state: string
	/**
	 * PKCE verifier. Null for Apple: Sign in with Apple's REST API documents no
	 * code_challenge or code_verifier parameters, so Apple relies on state and nonce.
	 */
	codeVerifier: string | null
	/** Checked against the ID token here and by the API. Null for Discord, which has no ID token. */
	nonce: string | null
}

export async function createAuthorization(
	provider: SocialProvider,
	origin: string
): Promise<AuthorizationRequest> {
	const as = SERVERS[provider]
	const url = new URL(as.authorization_endpoint ?? '')
	const state = oauth.generateRandomState()

	url.searchParams.set('response_type', 'code')
	url.searchParams.set('client_id', clientId(provider))
	url.searchParams.set('redirect_uri', callbackUrl(origin, provider))
	url.searchParams.set('scope', SCOPES[provider].join(' '))
	url.searchParams.set('state', state)

	let codeVerifier: string | null = null
	if (provider !== 'apple') {
		codeVerifier = oauth.generateRandomCodeVerifier()
		url.searchParams.set('code_challenge', await oauth.calculatePKCECodeChallenge(codeVerifier))
		url.searchParams.set('code_challenge_method', 'S256')
	}

	let nonce: string | null = null
	if (provider !== 'discord') {
		nonce = oauth.generateRandomNonce()
		url.searchParams.set('nonce', nonce)
	}

	// Apple requires form_post whenever name or email is requested.
	if (provider === 'apple') url.searchParams.set('response_mode', 'form_post')

	return { url, state, codeVerifier, nonce }
}

/**
 * Exchanges an authorization code for the assertion the API verifies: the ID
 * token for Google and Apple, the access token for Discord.
 *
 * `state` has already been checked (in constant time) by the callback, so it
 * isn't checked again here. For Google and Apple, oauth4webapi validates the
 * ID token's iss, aud, exp and nonce before it's passed on.
 */
export async function exchangeCode(
	provider: SocialProvider,
	origin: string,
	code: string,
	codeVerifier: string | null,
	nonce: string | null
): Promise<string> {
	const as = SERVERS[provider]
	const client: oauth.Client = { client_id: clientId(provider) }
	const callbackParams = oauth.validateAuthResponse(
		as,
		client,
		new URLSearchParams({ code }),
		oauth.skipStateCheck
	)

	const response = await oauth.authorizationCodeGrantRequest(
		as,
		client,
		await clientAuth(provider),
		callbackParams,
		callbackUrl(origin, provider),
		codeVerifier ?? oauth.nopkce
	)

	if (provider === 'discord') {
		const tokens = await oauth.processAuthorizationCodeResponse(as, client, response)
		return tokens.access_token
	}

	if (!nonce) throw new Error('missing nonce')
	const tokens = await oauth.processAuthorizationCodeResponse(as, client, response, {
		expectedNonce: nonce,
		requireIdToken: true
	})
	if (!tokens.id_token) throw new Error('missing id_token')
	return tokens.id_token
}
