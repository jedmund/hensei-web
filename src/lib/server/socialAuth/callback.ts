import type { Cookies } from '@sveltejs/kit'
import { timingSafeEqual } from 'node:crypto'
import type { OAuthLoginResponse } from '$lib/auth/oauth'
import type { SocialProvider } from '$lib/auth/socialProviders'
import {
	OPEN_SETTINGS_PARAM,
	SOCIAL_ERROR_PARAM,
	SOCIAL_LINKED_PARAM,
	SOCIAL_PROVIDER_PARAM,
	withParams,
	type SocialErrorCode
} from '$lib/auth/socialResult'
import { safeRedirectPath } from '$lib/utils/safeRedirect'
import { linkIdentity, signInWithProvider } from './api'
import {
	clearFlowCookies,
	clearLinkTicket,
	clearSignupTicket,
	readFlowCookies,
	setLinkTicketCookie,
	setSignupTicketCookie
} from './cookies'

export const LOGIN_PATH = '/auth/login'
export const USERNAME_STEP_PATH = '/auth/choose-username'
const DEFAULT_NEXT = '/me'

export interface CallbackParams {
	code: string | null
	state: string | null
	/** Set when the user cancelled or the provider refused. */
	error: string | null
	/** Apple's first-sign-in `user` JSON. */
	user: string | null
}

export interface CallbackContext {
	provider: SocialProvider
	origin: string
	params: CallbackParams
	cookies: Cookies
	/** SvelteKit's fetch, so handleFetch adds the internal API headers. */
	fetch: typeof fetch
	/** The current session's access token, for link mode. */
	sessionToken: string | null
	secure: boolean
}

export interface CallbackDeps {
	exchangeCode: (
		provider: SocialProvider,
		origin: string,
		code: string,
		codeVerifier: string | null
	) => Promise<string>
	establishSession: (
		cookies: Cookies,
		oauth: OAuthLoginResponse,
		opts: { secure: boolean }
	) => Promise<unknown>
}

function statesMatch(expected: string, actual: string): boolean {
	const a = Buffer.from(expected)
	const b = Buffer.from(actual)
	return a.length === b.length && timingSafeEqual(a, b)
}

/**
 * Apple sends `{ name: { firstName, lastName }, email }` as JSON on the first
 * sign-in only. Returns the display name to pass to the API, if any.
 */
export function appleName(userJson: string | null): string | null {
	if (!userJson) return null
	try {
		const parsed = JSON.parse(userJson) as { name?: { firstName?: unknown; lastName?: unknown } }
		const parts = [parsed.name?.firstName, parsed.name?.lastName]
			.filter((p): p is string => typeof p === 'string')
			.map((p) => p.trim())
			.filter(Boolean)
		return parts.length > 0 ? parts.join(' ').slice(0, 100) : null
	} catch {
		return null
	}
}

const loginError = (code: SocialErrorCode) => withParams(LOGIN_PATH, { [SOCIAL_ERROR_PARAM]: code })

function settingsReturn(
	next: string | null,
	provider: SocialProvider,
	result: { linked: true } | { error: SocialErrorCode }
): string {
	const params: Record<string, string> = {
		[OPEN_SETTINGS_PARAM]: 'account',
		[SOCIAL_PROVIDER_PARAM]: provider
	}
	if ('linked' in result) params[SOCIAL_LINKED_PARAM] = provider
	else params[SOCIAL_ERROR_PARAM] = result.error
	return withParams(safeRedirectPath(next, '/'), params)
}

/** Logs only the error's class: Arctic's errors can carry provider response bodies. */
function logFailure(step: string, provider: SocialProvider, e: unknown) {
	const kind = e instanceof Error ? e.constructor.name : typeof e
	console.warn(`[social-auth] ${step} failed for ${provider}: ${kind}`)
}

/**
 * Handles a provider callback and returns where to redirect the browser.
 *
 * The flow cookies are always cleared first, so a callback can't be replayed
 * and a failed attempt starts over cleanly.
 */
export async function handleSocialCallback(
	ctx: CallbackContext,
	deps: CallbackDeps
): Promise<string> {
	const { provider, params, cookies, secure } = ctx

	const flow = readFlowCookies(cookies, provider)
	clearFlowCookies(cookies, provider, { secure })

	if (!flow || !params.state || !statesMatch(flow.state, params.state)) {
		return loginError('failed')
	}

	const fail = (code: SocialErrorCode) =>
		flow.mode === 'link' ? settingsReturn(flow.next, provider, { error: code }) : loginError(code)

	if (params.error) return fail('cancelled')
	if (!params.code) return fail('failed')

	let assertion: string
	try {
		assertion = await deps.exchangeCode(provider, ctx.origin, params.code, flow.codeVerifier)
	} catch (e) {
		logFailure('code exchange', provider, e)
		return fail('failed')
	}

	if (flow.mode === 'link') {
		if (!ctx.sessionToken) return loginError('expired')
		let result: Awaited<ReturnType<typeof linkIdentity>>
		try {
			result = await linkIdentity(
				ctx.fetch,
				{ provider, assertion, nonce: flow.nonce },
				ctx.sessionToken
			)
		} catch (e) {
			logFailure('linking', provider, e)
			return fail('failed')
		}
		if (result.kind === 'linked') return settingsReturn(flow.next, provider, { linked: true })
		const code: SocialErrorCode =
			result.code === 'identity_taken' ||
			result.code === 'provider_already_linked' ||
			result.code === 'rate_limited'
				? result.code
				: 'failed'
		return settingsReturn(flow.next, provider, { error: code })
	}

	const name = provider === 'apple' ? appleName(params.user) : null
	let result: Awaited<ReturnType<typeof signInWithProvider>>
	try {
		result = await signInWithProvider(ctx.fetch, provider, { assertion, nonce: flow.nonce, name })
	} catch (e) {
		logFailure('sign-in', provider, e)
		return loginError('failed')
	}

	switch (result.kind) {
		case 'tokens':
			try {
				await deps.establishSession(cookies, result.tokens, { secure })
			} catch (e) {
				logFailure('session setup', provider, e)
				return loginError('failed')
			}
			clearSignupTicket(cookies)
			clearLinkTicket(cookies)
			return safeRedirectPath(flow.next, DEFAULT_NEXT)
		case 'signup_required':
			clearLinkTicket(cookies)
			setSignupTicketCookie(
				cookies,
				{
					ticket: result.ticket,
					provider,
					suggestedUsername: result.suggestedUsername,
					emailRequired: result.emailRequired
				},
				{ secure }
			)
			return USERNAME_STEP_PATH
		case 'link_required':
			clearSignupTicket(cookies)
			setLinkTicketCookie(cookies, { ticket: result.ticket, provider: result.provider }, { secure })
			return LOGIN_PATH
		case 'failed':
			return loginError(result.reason === 'rate_limited' ? 'rate_limited' : 'failed')
	}
}
