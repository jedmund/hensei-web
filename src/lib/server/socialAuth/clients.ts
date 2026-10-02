import { Apple, Discord, Google, generateCodeVerifier, generateState } from 'arctic'
import { env } from '$env/dynamic/private'
import { env as publicEnv } from '$env/dynamic/public'
import { parseSocialProviders, type SocialProvider } from '$lib/auth/socialProviders'

/**
 * Provider OAuth clients. Arctic builds the authorization URLs and exchanges
 * codes; everything after that (verifying who the user is, issuing tokens)
 * happens in the API, which checks the assertion with the provider itself.
 */

const SCOPES: Record<SocialProvider, string[]> = {
	discord: ['identify', 'email'],
	google: ['openid', 'email', 'profile'],
	apple: ['name', 'email']
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

/**
 * Converts the Sign in with Apple key (.p8 PEM, possibly with literal "\n"
 * sequences from an env var) into the PKCS#8 bytes Arctic expects.
 */
export function applePrivateKeyBytes(pem: string): Uint8Array {
	const body = pem
		.replace(/\\n/g, '\n')
		.replace(/-----BEGIN PRIVATE KEY-----/, '')
		.replace(/-----END PRIVATE KEY-----/, '')
		.replace(/\s+/g, '')
	return new Uint8Array(Buffer.from(body, 'base64'))
}

function discordClient(origin: string) {
	return new Discord(
		env.DISCORD_CLIENT_ID ?? '',
		env.DISCORD_CLIENT_SECRET ?? '',
		callbackUrl(origin, 'discord')
	)
}

function googleClient(origin: string) {
	return new Google(
		env.GOOGLE_CLIENT_ID ?? '',
		env.GOOGLE_CLIENT_SECRET ?? '',
		callbackUrl(origin, 'google')
	)
}

function appleClient(origin: string) {
	return new Apple(
		env.APPLE_SERVICES_ID ?? '',
		env.APPLE_TEAM_ID ?? '',
		env.APPLE_KEY_ID ?? '',
		applePrivateKeyBytes(env.APPLE_PRIVATE_KEY ?? ''),
		callbackUrl(origin, 'apple')
	)
}

export interface AuthorizationRequest {
	url: URL
	state: string
	/** PKCE verifier. Null for Apple: Arctic's Apple client has no PKCE support. */
	codeVerifier: string | null
	/** Checked by the API against the ID token. Null for Discord, which has no ID token. */
	nonce: string | null
}

export function createAuthorization(
	provider: SocialProvider,
	origin: string
): AuthorizationRequest {
	const state = generateState()

	switch (provider) {
		case 'discord': {
			const codeVerifier = generateCodeVerifier()
			const url = discordClient(origin).createAuthorizationURL(state, codeVerifier, SCOPES.discord)
			return { url, state, codeVerifier, nonce: null }
		}
		case 'google': {
			const codeVerifier = generateCodeVerifier()
			const nonce = generateState()
			const url = googleClient(origin).createAuthorizationURL(state, codeVerifier, SCOPES.google)
			url.searchParams.set('nonce', nonce)
			return { url, state, codeVerifier, nonce }
		}
		case 'apple': {
			const nonce = generateState()
			const url = appleClient(origin).createAuthorizationURL(state, SCOPES.apple)
			// Apple requires form_post whenever name or email is requested.
			url.searchParams.set('response_mode', 'form_post')
			url.searchParams.set('nonce', nonce)
			return { url, state, codeVerifier: null, nonce }
		}
	}
}

/**
 * Exchanges an authorization code for the assertion the API verifies: the ID
 * token for Google and Apple, the access token for Discord.
 */
export async function exchangeCode(
	provider: SocialProvider,
	origin: string,
	code: string,
	codeVerifier: string | null
): Promise<string> {
	switch (provider) {
		case 'discord': {
			const tokens = await discordClient(origin).validateAuthorizationCode(code, codeVerifier)
			return tokens.accessToken()
		}
		case 'google': {
			const tokens = await googleClient(origin).validateAuthorizationCode(code, codeVerifier ?? '')
			return tokens.idToken()
		}
		case 'apple': {
			const tokens = await appleClient(origin).validateAuthorizationCode(code)
			return tokens.idToken()
		}
	}
}
