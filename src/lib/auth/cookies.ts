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

export function setRefreshCookie(
	cookies: Cookies,
	data: string,
	{ secure, expires }: { secure: boolean; expires?: Date }
) {
	cookies.set(REFRESH_COOKIE, data, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure,
		...(expires ? { expires } : {})
	})
}

export function getAccountFromCookies(cookies: Cookies): AccountCookie | null {
	const raw = cookies.get(ACCOUNT_COOKIE)
	if (!raw) return null
	try {
		return JSON.parse(raw) as AccountCookie
	} catch {
		return null
	}
}

export function getUserFromCookies(cookies: Cookies): UserCookie | null {
	const raw = cookies.get(USER_COOKIE)
	if (!raw) return null
	try {
		return JSON.parse(raw) as UserCookie
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
