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
	const setCalls: Array<{ name: string; value: string; opts: any }> = []
	const deleteCalls: Array<{ name: string; opts: any }> = []

	return {
		set: vi.fn((name: string, value: string, opts: any) => {
			store.set(name, value)
			setCalls.push({ name, value, opts })
		}),
		get: vi.fn((name: string) => store.get(name)),
		delete: vi.fn((name: string, opts: any) => {
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

		setAccountCookie(cookies as any, mockAccount, { secure: true, expires })

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

		setUserCookie(cookies as any, mockUser, { secure: false, expires })

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

		setRefreshCookie(cookies as any, 'ref-tok', { secure: true })

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

	it('includes expires when provided', () => {
		const cookies = createMockCookies()
		const expires = new Date('2025-06-01')

		setRefreshCookie(cookies as any, 'ref-tok', { secure: true, expires })

		expect(cookies.setCalls[0].opts.expires).toEqual(expires)
	})

	it('omits expires when not provided', () => {
		const cookies = createMockCookies()

		setRefreshCookie(cookies as any, 'ref-tok', { secure: true })

		expect(cookies.setCalls[0].opts).not.toHaveProperty('expires')
	})
})

describe('getAccountFromCookies', () => {
	it('parses stored account cookie', () => {
		const cookies = createMockCookies()
		cookies.store.set(ACCOUNT_COOKIE, JSON.stringify(mockAccount))

		const result = getAccountFromCookies(cookies as any)
		expect(result).toEqual(mockAccount)
	})

	it('returns null when cookie missing', () => {
		const cookies = createMockCookies()
		expect(getAccountFromCookies(cookies as any)).toBeNull()
	})

	it('returns null on invalid JSON', () => {
		const cookies = createMockCookies()
		cookies.store.set(ACCOUNT_COOKIE, '{broken')

		expect(getAccountFromCookies(cookies as any)).toBeNull()
	})
})

describe('getUserFromCookies', () => {
	it('parses stored user cookie', () => {
		const cookies = createMockCookies()
		cookies.store.set(USER_COOKIE, JSON.stringify(mockUser))

		const result = getUserFromCookies(cookies as any)
		expect(result).toEqual(mockUser)
	})

	it('returns null when cookie missing', () => {
		const cookies = createMockCookies()
		expect(getUserFromCookies(cookies as any)).toBeNull()
	})
})

describe('getRefreshFromCookies', () => {
	it('returns stored refresh token', () => {
		const cookies = createMockCookies()
		cookies.store.set(REFRESH_COOKIE, 'ref-tok')

		expect(getRefreshFromCookies(cookies as any)).toBe('ref-tok')
	})

	it('returns null when cookie missing', () => {
		const cookies = createMockCookies()
		expect(getRefreshFromCookies(cookies as any)).toBeNull()
	})
})

describe('clearAuthCookies', () => {
	it('deletes all three auth cookies', () => {
		const cookies = createMockCookies()

		clearAuthCookies(cookies as any)

		expect(cookies.delete).toHaveBeenCalledTimes(3)
		expect(cookies.delete).toHaveBeenCalledWith(ACCOUNT_COOKIE, { path: '/' })
		expect(cookies.delete).toHaveBeenCalledWith(USER_COOKIE, { path: '/' })
		expect(cookies.delete).toHaveBeenCalledWith(REFRESH_COOKIE, { path: '/' })
	})
})
