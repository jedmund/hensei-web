import { describe, it, expect, vi } from 'vitest'
import {
	setAccountCookie,
	setUserCookie,
	setRefreshCookie,
	getAccountFromCookies,
	getUserFromCookies,
	getRefreshFromCookies,
	clearAuthCookies,
	ACCOUNT_COOKIE,
	USER_COOKIE,
	REFRESH_COOKIE
} from '../cookies'
import type { AccountCookie } from '$lib/types/AccountCookie'
import type { UserCookie } from '$lib/types/UserCookie'

function createMockCookies() {
	const store = new Map<string, string>()
	const setCalls: Array<{ name: string; value: string; opts: Record<string, unknown> }> = []
	const deleteCalls: Array<{ name: string; opts: Record<string, unknown> }> = []

	return {
		set: vi.fn((name: string, value: string, opts: Record<string, unknown>) => {
			store.set(name, value)
			setCalls.push({ name, value, opts })
		}),
		get: vi.fn((name: string) => store.get(name)),
		delete: vi.fn((name: string, opts: Record<string, unknown>) => {
			store.delete(name)
			deleteCalls.push({ name, opts })
		}),
		setCalls,
		deleteCalls,
		store
	}
}

const mockAccount: AccountCookie = {
	userId: 'u1',
	username: 'grug',
	token: 'tok-1',
	role: 0,
	expires_at: '2025-01-01T00:00:00Z'
}

const mockUser: UserCookie = {
	picture: 'avatar.jpg',
	element: 'fire',
	language: 'en',
	gender: 1,
	theme: 'dark'
}

describe('setAccountCookie', () => {
	it('sets httpOnly cookie with correct options', () => {
		const cookies = createMockCookies()
		const expires = new Date('2025-03-01')

		setAccountCookie(cookies as unknown as import('@sveltejs/kit').Cookies, mockAccount, {
			secure: true,
			expires
		})

		expect(cookies.set).toHaveBeenCalledWith(
			ACCOUNT_COOKIE,
			JSON.stringify(mockAccount),
			expect.objectContaining({
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				secure: true,
				expires,
				maxAge: 60 * 60 * 24 * 60
			})
		)
	})
})

describe('setUserCookie', () => {
	it('sets non-httpOnly cookie (readable by client)', () => {
		const cookies = createMockCookies()
		const expires = new Date('2025-03-01')

		setUserCookie(cookies as unknown as import('@sveltejs/kit').Cookies, mockUser, {
			secure: false,
			expires
		})

		expect(cookies.set).toHaveBeenCalledWith(
			USER_COOKIE,
			JSON.stringify(mockUser),
			expect.objectContaining({
				httpOnly: false,
				secure: false
			})
		)
	})
})

describe('setRefreshCookie', () => {
	it('sets httpOnly cookie with refresh token', () => {
		const cookies = createMockCookies()

		setRefreshCookie(cookies as unknown as import('@sveltejs/kit').Cookies, 'ref-tok', {
			secure: true
		})

		expect(cookies.set).toHaveBeenCalledWith(
			REFRESH_COOKIE,
			'ref-tok',
			expect.objectContaining({
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				secure: true
			})
		)
	})

	it('uses a 60-day maxAge so the refresh cookie outlives the access token', () => {
		const cookies = createMockCookies()

		setRefreshCookie(cookies as unknown as import('@sveltejs/kit').Cookies, 'ref-tok', {
			secure: true
		})

		expect(cookies.setCalls[0]!.opts.maxAge).toBe(60 * 60 * 24 * 60)
	})

	it('does not tie the refresh cookie lifetime to an access token expires Date', () => {
		const cookies = createMockCookies()

		setRefreshCookie(cookies as unknown as import('@sveltejs/kit').Cookies, 'ref-tok', {
			secure: true
		})

		// Regression for the 30-day loop: if we re-introduce an expires tied to
		// accessTokenExpiresAt, the refresh cookie gets dropped the moment the
		// access token dies and the user can't refresh.
		expect(cookies.setCalls[0]!.opts).not.toHaveProperty('expires')
	})
})

describe('getAccountFromCookies', () => {
	it('parses stored account cookie', () => {
		const cookies = createMockCookies()
		cookies.store.set(ACCOUNT_COOKIE, JSON.stringify(mockAccount))

		const result = getAccountFromCookies(cookies as unknown as import('@sveltejs/kit').Cookies)
		expect(result).toEqual(mockAccount)
	})

	it('returns null when cookie missing', () => {
		const cookies = createMockCookies()
		expect(getAccountFromCookies(cookies as unknown as import('@sveltejs/kit').Cookies)).toBeNull()
	})

	it('returns null on invalid JSON', () => {
		const cookies = createMockCookies()
		cookies.store.set(ACCOUNT_COOKIE, '{broken')

		expect(getAccountFromCookies(cookies as unknown as import('@sveltejs/kit').Cookies)).toBeNull()
	})

	it('returns null when token is not a string', () => {
		const cookies = createMockCookies()
		cookies.store.set(ACCOUNT_COOKIE, JSON.stringify({ ...mockAccount, token: 123 }))

		expect(getAccountFromCookies(cookies as unknown as import('@sveltejs/kit').Cookies)).toBeNull()
	})

	it('returns null when userId is not a string', () => {
		const cookies = createMockCookies()
		cookies.store.set(ACCOUNT_COOKIE, JSON.stringify({ ...mockAccount, userId: null }))

		expect(getAccountFromCookies(cookies as unknown as import('@sveltejs/kit').Cookies)).toBeNull()
	})

	it('returns null when expires_at is not a string', () => {
		const cookies = createMockCookies()
		cookies.store.set(ACCOUNT_COOKIE, JSON.stringify({ ...mockAccount, expires_at: 12345 }))

		expect(getAccountFromCookies(cookies as unknown as import('@sveltejs/kit').Cookies)).toBeNull()
	})

	it('returns null when role is not a number', () => {
		const cookies = createMockCookies()
		cookies.store.set(ACCOUNT_COOKIE, JSON.stringify({ ...mockAccount, role: 'admin' }))

		expect(getAccountFromCookies(cookies as unknown as import('@sveltejs/kit').Cookies)).toBeNull()
	})

	it('accepts account without expires_at', () => {
		const cookies = createMockCookies()
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { expires_at: _, ...accountWithoutExpiry } = mockAccount
		cookies.store.set(ACCOUNT_COOKIE, JSON.stringify(accountWithoutExpiry))

		const result = getAccountFromCookies(cookies as unknown as import('@sveltejs/kit').Cookies)
		expect(result).toEqual(accountWithoutExpiry)
	})
})

describe('getUserFromCookies', () => {
	it('parses stored user cookie', () => {
		const cookies = createMockCookies()
		cookies.store.set(USER_COOKIE, JSON.stringify(mockUser))

		const result = getUserFromCookies(cookies as unknown as import('@sveltejs/kit').Cookies)
		expect(result).toEqual(mockUser)
	})

	it('returns null when cookie missing', () => {
		const cookies = createMockCookies()
		expect(getUserFromCookies(cookies as unknown as import('@sveltejs/kit').Cookies)).toBeNull()
	})

	it('returns null when language is not a string', () => {
		const cookies = createMockCookies()
		cookies.store.set(USER_COOKIE, JSON.stringify({ ...mockUser, language: 42 }))

		expect(getUserFromCookies(cookies as unknown as import('@sveltejs/kit').Cookies)).toBeNull()
	})

	it('returns null when element is not a string', () => {
		const cookies = createMockCookies()
		cookies.store.set(USER_COOKIE, JSON.stringify({ ...mockUser, element: 123 }))

		expect(getUserFromCookies(cookies as unknown as import('@sveltejs/kit').Cookies)).toBeNull()
	})

	it('returns null when theme is not a string', () => {
		const cookies = createMockCookies()
		cookies.store.set(USER_COOKIE, JSON.stringify({ ...mockUser, theme: true }))

		expect(getUserFromCookies(cookies as unknown as import('@sveltejs/kit').Cookies)).toBeNull()
	})

	it('accepts user with optional fields missing', () => {
		const cookies = createMockCookies()
		const minimalUser = {
			picture: 'pic.jpg',
			element: 'wind',
			language: 'ja',
			gender: 0,
			theme: 'light'
		}
		cookies.store.set(USER_COOKIE, JSON.stringify(minimalUser))

		const result = getUserFromCookies(cookies as unknown as import('@sveltejs/kit').Cookies)
		expect(result).toEqual(minimalUser)
	})
})

describe('getRefreshFromCookies', () => {
	it('returns stored refresh token', () => {
		const cookies = createMockCookies()
		cookies.store.set(REFRESH_COOKIE, 'ref-tok')

		expect(getRefreshFromCookies(cookies as unknown as import('@sveltejs/kit').Cookies)).toBe(
			'ref-tok'
		)
	})

	it('returns null when cookie missing', () => {
		const cookies = createMockCookies()
		expect(getRefreshFromCookies(cookies as unknown as import('@sveltejs/kit').Cookies)).toBeNull()
	})
})

describe('clearAuthCookies', () => {
	it('deletes all three auth cookies', () => {
		const cookies = createMockCookies()

		clearAuthCookies(cookies as unknown as import('@sveltejs/kit').Cookies)

		expect(cookies.delete).toHaveBeenCalledTimes(3)
		expect(cookies.delete).toHaveBeenCalledWith(ACCOUNT_COOKIE, { path: '/' })
		expect(cookies.delete).toHaveBeenCalledWith(USER_COOKIE, { path: '/' })
		expect(cookies.delete).toHaveBeenCalledWith(REFRESH_COOKIE, { path: '/' })
	})
})
