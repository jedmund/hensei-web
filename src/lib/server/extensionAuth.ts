import { env } from '$env/dynamic/private'
import { getApiBaseUrl } from '$lib/api/adapters/config'

/**
 * Logging in to the browser extension through the site (see "Extension login
 * contract" in docs/prds/social-login-prd.md).
 *
 * The extension opens /auth/extension with chrome.identity.launchWebAuthFlow.
 * After the user confirms, the browser is sent to the extension's
 * chromiumapp.org redirect URL with a one-time code, which the extension
 * exchanges with the API (PKCE).
 *
 * Nothing here logs the code, the challenge or tokens.
 */

export interface ExtensionAuthRequest {
	redirectUri: string
	codeChallenge: string
	codeChallengeMethod: 'S256'
	state: string
}

export type ExtensionAuthParseResult =
	| { ok: true; request: ExtensionAuthRequest }
	| { ok: false; reason: 'redirect_uri' | 'code_challenge' | 'code_challenge_method' | 'state' }

/** The params the page and the code endpoint take, in the contract's order. */
export const EXTENSION_AUTH_PARAMS = [
	'redirect_uri',
	'code_challenge',
	'code_challenge_method',
	'state'
] as const

// base64url(SHA-256(verifier)) without padding is always 43 characters.
const CODE_CHALLENGE = /^[A-Za-z0-9_-]{43}$/
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\x00-\x1f\x7f-\x9f]/
const MAX_STATE_LENGTH = 128

/** Extension IDs from EXTENSION_IDS (comma-separated). Empty when unset. */
export function configuredExtensionIds(raw: string | undefined = env.EXTENSION_IDS): string[] {
	return (raw ?? '')
		.split(',')
		.map((id) => id.trim())
		.filter(Boolean)
}

/**
 * Whether `uri` is exactly `https://<id>.chromiumapp.org/` for an allowed
 * extension ID. An exact string match, so no other scheme, host, port, path,
 * query or fragment gets through.
 */
export function isAllowedRedirectUri(uri: string, extensionIds: string[]): boolean {
	return extensionIds.some((id) => uri === `https://${id}.chromiumapp.org/`)
}

/** A value that is present exactly once, or null. */
function single(params: URLSearchParams, name: string): string | null {
	const values = params.getAll(name)
	return values.length === 1 ? (values[0] ?? null) : null
}

/**
 * Checks the extension's request. redirect_uri is checked first: nothing
 * may ever be sent to a redirect_uri that failed this check.
 */
export function parseExtensionAuthRequest(
	params: URLSearchParams,
	extensionIds: string[] = configuredExtensionIds()
): ExtensionAuthParseResult {
	const redirectUri = single(params, 'redirect_uri')
	if (!redirectUri || !isAllowedRedirectUri(redirectUri, extensionIds)) {
		return { ok: false, reason: 'redirect_uri' }
	}

	const method = single(params, 'code_challenge_method')
	if (method !== 'S256') return { ok: false, reason: 'code_challenge_method' }

	const challenge = single(params, 'code_challenge')
	if (!challenge || !CODE_CHALLENGE.test(challenge)) return { ok: false, reason: 'code_challenge' }

	const state = single(params, 'state')
	if (!state || state.length > MAX_STATE_LENGTH || CONTROL_CHARS.test(state)) {
		return { ok: false, reason: 'state' }
	}

	return {
		ok: true,
		request: { redirectUri, codeChallenge: challenge, codeChallengeMethod: 'S256', state }
	}
}

/** The checked request as query params, e.g. for the code endpoint's body. */
export function extensionAuthParams(request: ExtensionAuthRequest): Record<string, string> {
	return {
		redirect_uri: request.redirectUri,
		code_challenge: request.codeChallenge,
		code_challenge_method: request.codeChallengeMethod,
		state: request.state
	}
}

/** `redirect_uri?code=…&state=…` */
export function successRedirect(request: ExtensionAuthRequest, code: string): string {
	const url = new URL(request.redirectUri)
	url.searchParams.set('code', code)
	url.searchParams.set('state', request.state)
	return url.toString()
}

/** `redirect_uri?error=access_denied&state=…` */
export function cancelRedirect(request: ExtensionAuthRequest): string {
	const url = new URL(request.redirectUri)
	url.searchParams.set('error', 'access_denied')
	url.searchParams.set('state', request.state)
	return url.toString()
}

export type CreateCodeResult =
	| { kind: 'created'; code: string }
	| { kind: 'unauthorized' }
	| { kind: 'rate_limited' }
	| { kind: 'failed' }

/**
 * `POST /extension_auth/codes` with the web session's token. `fetchFn` is
 * SvelteKit's fetch, so handleFetch adds the internal headers and the
 * visitor's IP.
 */
export async function createExtensionCode(
	fetchFn: typeof fetch,
	token: string,
	request: ExtensionAuthRequest
): Promise<CreateCodeResult> {
	const res = await fetchFn(`${getApiBaseUrl()}/extension_auth/codes`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
		body: JSON.stringify({
			code_challenge: request.codeChallenge,
			code_challenge_method: request.codeChallengeMethod
		})
	})

	if (res.status === 401) return { kind: 'unauthorized' }
	if (res.status === 429) return { kind: 'rate_limited' }
	if (res.status !== 201) return { kind: 'failed' }

	let data: unknown
	try {
		data = await res.json()
	} catch {
		return { kind: 'failed' }
	}
	const code = (data as { code?: unknown } | null)?.code
	if (typeof code !== 'string' || code.length === 0) return { kind: 'failed' }
	return { kind: 'created', code }
}
