import type { Cookies } from '@sveltejs/kit'
import { isSocialProvider, type SocialProvider } from '$lib/auth/socialProviders'

/**
 * Short-lived cookies for the social login flow. All are httpOnly.
 *
 * Apple posts its callback cross-site (response_mode=form_post), and
 * SameSite=Lax cookies aren't sent with a cross-site POST, so Apple's flow
 * cookies are SameSite=None; Secure. Every other provider's stay Lax.
 */

const TEN_MINUTES = 60 * 10

export type FlowMode = 'login' | 'link'

export interface FlowCookies {
	state: string
	codeVerifier: string | null
	nonce: string | null
	mode: FlowMode
	next: string | null
}

type CookieOptions = Parameters<Cookies['set']>[2]

/** The same attributes without the lifetime, for deleting the cookie. */
function deleteOptions(opts: CookieOptions): CookieOptions {
	const copy = { ...opts }
	delete copy.maxAge
	return copy
}

const flowNames = (provider: SocialProvider) => ({
	state: `oauth_${provider}_state`,
	codeVerifier: `oauth_${provider}_verifier`,
	nonce: `oauth_${provider}_nonce`,
	mode: `oauth_${provider}_mode`,
	next: `oauth_${provider}_next`
})

export function flowCookieOptions(
	provider: SocialProvider,
	{ secure }: { secure: boolean }
): CookieOptions {
	if (provider === 'apple') {
		return { path: '/', httpOnly: true, sameSite: 'none', secure: true, maxAge: TEN_MINUTES }
	}
	return { path: '/', httpOnly: true, sameSite: 'lax', secure, maxAge: TEN_MINUTES }
}

export function setFlowCookies(
	cookies: Cookies,
	provider: SocialProvider,
	flow: FlowCookies,
	{ secure }: { secure: boolean }
) {
	const names = flowNames(provider)
	const opts = flowCookieOptions(provider, { secure })
	cookies.set(names.state, flow.state, opts)
	if (flow.codeVerifier) cookies.set(names.codeVerifier, flow.codeVerifier, opts)
	if (flow.nonce) cookies.set(names.nonce, flow.nonce, opts)
	cookies.set(names.mode, flow.mode, opts)
	if (flow.next) cookies.set(names.next, flow.next, opts)
}

/** Reads the flow cookies; null when no flow was started for this provider. */
export function readFlowCookies(cookies: Cookies, provider: SocialProvider): FlowCookies | null {
	const names = flowNames(provider)
	const state = cookies.get(names.state)
	if (!state) return null
	return {
		state,
		codeVerifier: cookies.get(names.codeVerifier) ?? null,
		nonce: cookies.get(names.nonce) ?? null,
		mode: cookies.get(names.mode) === 'link' ? 'link' : 'login',
		next: cookies.get(names.next) ?? null
	}
}

export function clearFlowCookies(
	cookies: Cookies,
	provider: SocialProvider,
	{ secure }: { secure: boolean }
) {
	const opts = deleteOptions(flowCookieOptions(provider, { secure }))
	for (const name of Object.values(flowNames(provider))) cookies.delete(name, opts)
}

/**
 * Apple's form_post callback arrives cross-site, so the session cookies
 * (SameSite=Lax) aren't sent with it. The POST handler parks the callback
 * params here and redirects to a same-site GET, which has the session.
 * Holds a single-use authorization code: read once, then deleted.
 */
export const APPLE_CALLBACK_COOKIE = 'oauth_apple_callback'

const APPLE_CALLBACK_OPTIONS: CookieOptions = {
	path: '/',
	httpOnly: true,
	sameSite: 'none',
	secure: true,
	maxAge: 60
}

export interface AppleCallbackParams {
	code: string | null
	state: string | null
	error: string | null
	/** Apple's `user` form field: JSON, sent only on the first sign-in. */
	user: string | null
}

export function setAppleCallbackCookie(cookies: Cookies, params: AppleCallbackParams) {
	cookies.set(APPLE_CALLBACK_COOKIE, JSON.stringify(params), APPLE_CALLBACK_OPTIONS)
}

export function takeAppleCallbackCookie(cookies: Cookies): AppleCallbackParams | null {
	const raw = cookies.get(APPLE_CALLBACK_COOKIE)
	if (!raw) return null
	cookies.delete(APPLE_CALLBACK_COOKIE, deleteOptions(APPLE_CALLBACK_OPTIONS))
	try {
		const parsed = JSON.parse(raw) as Record<string, unknown>
		const str = (v: unknown) => (typeof v === 'string' ? v : null)
		return {
			code: str(parsed.code),
			state: str(parsed.state),
			error: str(parsed.error),
			user: str(parsed.user)
		}
	} catch {
		return null
	}
}

/* Tickets from the API, kept while the user finishes signing up or logs in to link. */

export const SIGNUP_TICKET_COOKIE = 'social_signup'
export const LINK_TICKET_COOKIE = 'social_link'

export interface SignupTicket {
	ticket: string
	provider: SocialProvider
	suggestedUsername: string
	emailRequired: boolean
}

export interface LinkTicket {
	ticket: string
	provider: SocialProvider
}

function ticketOptions({ secure }: { secure: boolean }): CookieOptions {
	return { path: '/', httpOnly: true, sameSite: 'lax', secure, maxAge: TEN_MINUTES }
}

export function setSignupTicketCookie(
	cookies: Cookies,
	data: SignupTicket,
	{ secure }: { secure: boolean }
) {
	cookies.set(SIGNUP_TICKET_COOKIE, JSON.stringify(data), ticketOptions({ secure }))
}

export function setLinkTicketCookie(
	cookies: Cookies,
	data: LinkTicket,
	{ secure }: { secure: boolean }
) {
	cookies.set(LINK_TICKET_COOKIE, JSON.stringify(data), ticketOptions({ secure }))
}

function parseJson(raw: string | undefined): Record<string, unknown> | null {
	if (!raw) return null
	try {
		const parsed: unknown = JSON.parse(raw)
		return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null
	} catch {
		return null
	}
}

export function getSignupTicket(cookies: Cookies): SignupTicket | null {
	const data = parseJson(cookies.get(SIGNUP_TICKET_COOKIE))
	if (!data || typeof data.ticket !== 'string' || !isSocialProvider(data.provider)) return null
	return {
		ticket: data.ticket,
		provider: data.provider,
		suggestedUsername: typeof data.suggestedUsername === 'string' ? data.suggestedUsername : '',
		emailRequired: data.emailRequired === true
	}
}

export function getLinkTicket(cookies: Cookies): LinkTicket | null {
	const data = parseJson(cookies.get(LINK_TICKET_COOKIE))
	if (!data || typeof data.ticket !== 'string' || !isSocialProvider(data.provider)) return null
	return { ticket: data.ticket, provider: data.provider }
}

export function clearSignupTicket(cookies: Cookies) {
	cookies.delete(SIGNUP_TICKET_COOKIE, { path: '/' })
}

export function clearLinkTicket(cookies: Cookies) {
	cookies.delete(LINK_TICKET_COOKIE, { path: '/' })
}
