import type { Cookies } from '@sveltejs/kit'
import type { AccountCookie } from '$lib/types/AccountCookie'
import type { UserCookie } from '$lib/types/UserCookie'

export const ACCOUNT_COOKIE = 'account'
export const USER_COOKIE = 'user'
export const REFRESH_COOKIE = 'refresh'
const SIXTY_DAYS = 60 * 60 * 24 * 60

export function setAccountCookie(
	cookies: Cookies,
	data: AccountCookie,
	{ secure, expires }: { secure: boolean; expires: Date }
) {
	cookies.set(ACCOUNT_COOKIE, JSON.stringify(data), {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure,
		expires,
		maxAge: SIXTY_DAYS
	})
}

export function setUserCookie(
	cookies: Cookies,
	data: UserCookie,
	{ secure, expires }: { secure: boolean; expires: Date }
) {
	cookies.set(USER_COOKIE, JSON.stringify(data), {
		path: '/',
		httpOnly: false,
		sameSite: 'lax',
		secure,
		expires,
		maxAge: SIXTY_DAYS
	})
}

export function setRefreshCookie(cookies: Cookies, data: string, { secure }: { secure: boolean }) {
	// Refresh cookie lifetime must outlive the access token so we can
	// exchange it for a new pair once the access token expires. Tying
	// its expiry to the access token (as we did in #835) left users
	// with no refresh cookie at the 30-day boundary → refresh loop.
	cookies.set(REFRESH_COOKIE, data, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure,
		maxAge: SIXTY_DAYS
	})
}

export function getAccountFromCookies(cookies: Cookies): AccountCookie | null {
	const raw = cookies.get(ACCOUNT_COOKIE)
	if (!raw) return null
	try {
		const parsed = JSON.parse(raw) as Record<string, unknown>
		if (typeof parsed.token !== 'string' || typeof parsed.userId !== 'string') return null
		if (parsed.expires_at !== undefined && typeof parsed.expires_at !== 'string') return null
		if (typeof parsed.role !== 'number') return null
		return parsed as unknown as AccountCookie
	} catch {
		return null
	}
}

export function getUserFromCookies(cookies: Cookies): UserCookie | null {
	const raw = cookies.get(USER_COOKIE)
	if (!raw) return null
	try {
		const parsed = JSON.parse(raw) as Record<string, unknown>
		if (typeof parsed.language !== 'string') return null
		if (parsed.element !== undefined && typeof parsed.element !== 'string') return null
		if (parsed.theme !== undefined && typeof parsed.theme !== 'string') return null
		return parsed as unknown as UserCookie
	} catch {
		return null
	}
}

export function getRefreshFromCookies(cookies: Cookies): string | null {
	return cookies.get(REFRESH_COOKIE) ?? null
}

export function clearAuthCookies(cookies: Cookies) {
	cookies.delete(ACCOUNT_COOKIE, { path: '/' })
	cookies.delete(USER_COOKIE, { path: '/' })
	cookies.delete(REFRESH_COOKIE, { path: '/' })
}
