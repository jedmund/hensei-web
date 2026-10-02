import { getApiBaseUrl } from '$lib/api/adapters/config'
import type { OAuthLoginResponse } from '$lib/auth/oauth'
import { isSocialProvider, type SocialProvider } from '$lib/auth/socialProviders'

/**
 * Calls to the API's social login endpoints (see "API contract" in
 * docs/prds/social-login-prd.md). Callers pass SvelteKit's `fetch` so
 * handleFetch adds the internal headers and the visitor's IP.
 *
 * Nothing here logs request or response bodies: they carry assertions,
 * tickets and tokens.
 */

type Fetch = typeof fetch

export type SignInResult =
	| { kind: 'tokens'; tokens: OAuthLoginResponse }
	| {
			kind: 'signup_required'
			ticket: string
			suggestedUsername: string
			emailRequired: boolean
	  }
	| { kind: 'link_required'; ticket: string; provider: SocialProvider }
	| { kind: 'failed'; reason: 'invalid_assertion' | 'not_enabled' | 'rate_limited' | 'error' }

export type LinkErrorCode =
	| 'identity_taken'
	| 'provider_already_linked'
	| 'invalid_ticket'
	| 'invalid_assertion'
	| 'rate_limited'
	| 'failed'

export type LinkResult =
	| { kind: 'linked'; provider: SocialProvider }
	| { kind: 'error'; code: LinkErrorCode }

export type SocialSignupResult =
	| { kind: 'tokens'; tokens: OAuthLoginResponse }
	| { kind: 'invalid_ticket' }
	| { kind: 'validation'; messages: string[] }
	| { kind: 'error'; status: number }

async function readJson(res: Response): Promise<Record<string, unknown>> {
	try {
		const data: unknown = await res.json()
		return data && typeof data === 'object' ? (data as Record<string, unknown>) : {}
	} catch {
		return {}
	}
}

function isTokenBody(data: Record<string, unknown>): boolean {
	const user = data.user as Record<string, unknown> | undefined
	return (
		typeof data.access_token === 'string' &&
		typeof data.refresh_token === 'string' &&
		typeof data.expires_in === 'number' &&
		typeof data.created_at === 'number' &&
		typeof user?.username === 'string'
	)
}

function postJson(fetchFn: Fetch, path: string, body: unknown, headers: HeadersInit = {}) {
	return fetchFn(`${getApiBaseUrl()}${path}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', ...headers },
		body: JSON.stringify(body)
	})
}

/** `POST /auth/:provider` */
export async function signInWithProvider(
	fetchFn: Fetch,
	provider: SocialProvider,
	params: { assertion: string; nonce?: string | null; name?: string | null }
): Promise<SignInResult> {
	const body: Record<string, string> = { assertion: params.assertion }
	if (params.nonce) body.nonce = params.nonce
	if (params.name) body.name = params.name

	const res = await postJson(fetchFn, `/auth/${provider}`, body)
	if (res.status === 401) return { kind: 'failed', reason: 'invalid_assertion' }
	if (res.status === 404) return { kind: 'failed', reason: 'not_enabled' }
	if (res.status === 429) return { kind: 'failed', reason: 'rate_limited' }
	if (res.status !== 200) return { kind: 'failed', reason: 'error' }

	const data = await readJson(res)
	if (data.status === 'signup_required' && typeof data.ticket === 'string') {
		return {
			kind: 'signup_required',
			ticket: data.ticket,
			suggestedUsername: typeof data.suggested_username === 'string' ? data.suggested_username : '',
			emailRequired: data.email_required === true
		}
	}
	if (data.status === 'link_required' && typeof data.ticket === 'string') {
		return {
			kind: 'link_required',
			ticket: data.ticket,
			provider: isSocialProvider(data.provider) ? data.provider : provider
		}
	}
	if (isTokenBody(data)) return { kind: 'tokens', tokens: data as unknown as OAuthLoginResponse }
	return { kind: 'failed', reason: 'error' }
}

/**
 * `POST /users/me/identities`, either with a `link_ticket` (after a password
 * login) or with a fresh provider assertion (linking from settings).
 * `token` is the session to link to.
 */
export async function linkIdentity(
	fetchFn: Fetch,
	body:
		| { link_ticket: string }
		| { provider: SocialProvider; assertion: string; nonce?: string | null },
	token: string
): Promise<LinkResult> {
	const payload: Record<string, string> = {}
	if ('link_ticket' in body) {
		payload.link_ticket = body.link_ticket
	} else {
		payload.provider = body.provider
		payload.assertion = body.assertion
		if (body.nonce) payload.nonce = body.nonce
	}

	const res = await postJson(fetchFn, '/users/me/identities', payload, {
		Authorization: `Bearer ${token}`
	})
	const data = await readJson(res)

	if (res.status === 201 && isSocialProvider(data.provider)) {
		return { kind: 'linked', provider: data.provider }
	}
	if (res.status === 429) return { kind: 'error', code: 'rate_limited' }
	if (res.status === 401 || res.status === 409) {
		const code = data.error
		if (
			code === 'identity_taken' ||
			code === 'provider_already_linked' ||
			code === 'invalid_ticket' ||
			code === 'invalid_assertion'
		) {
			return { kind: 'error', code }
		}
	}
	return { kind: 'error', code: 'failed' }
}

/** `POST /users` with a `signup_ticket` */
export async function signUpWithTicket(
	fetchFn: Fetch,
	ticket: string,
	user: { username: string; email?: string | undefined }
): Promise<SocialSignupResult> {
	const userBody: Record<string, string> = { username: user.username }
	if (user.email) userBody.email = user.email

	const res = await postJson(fetchFn, '/users', { signup_ticket: ticket, user: userBody })
	const data = await readJson(res)

	if (res.status === 201 && isTokenBody(data)) {
		return { kind: 'tokens', tokens: data as unknown as OAuthLoginResponse }
	}
	if (res.status === 401) return { kind: 'invalid_ticket' }
	if (res.status === 422) {
		const messages = Array.isArray(data.messages)
			? data.messages.filter((msg): msg is string => typeof msg === 'string')
			: []
		return { kind: 'validation', messages }
	}
	return { kind: 'error', status: res.status }
}
