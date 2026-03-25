import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { UserCookie } from '$lib/types/UserCookie'

/**
 * Tests for POST /api/settings endpoint.
 *
 * The endpoint updates the user cookie and syncs the PARAGLIDE_LOCALE cookie.
 * The PARAGLIDE_LOCALE sync is critical — without it, language changes from
 * the toggle revert on reload because hooks.server.ts reads the stale user
 * cookie and deletes the locale cookie.
 */

// Mock $app/environment
vi.mock('$app/environment', () => ({ dev: false }))

// Mock cookie helpers — we test that the endpoint calls them correctly
const mockSetAccountCookie = vi.fn()
const mockSetUserCookie = vi.fn()
const mockGetAccountFromCookies = vi.fn()

vi.mock('$lib/auth/cookies', () => ({
	setAccountCookie: (...args: unknown[]) => mockSetAccountCookie(...args),
	setUserCookie: (...args: unknown[]) => mockSetUserCookie(...args),
	getAccountFromCookies: (...args: unknown[]) => mockGetAccountFromCookies(...args)
}))

function createMockCookies() {
	const store = new Map<string, string>()
	return {
		set: vi.fn((name: string, value: string) => store.set(name, value)),
		get: vi.fn((name: string) => store.get(name)),
		delete: vi.fn((name: string) => store.delete(name)),
		store
	}
}

const baseUser: UserCookie = {
	picture: 'pic.jpg',
	element: 'fire',
	language: 'en',
	gender: 0,
	theme: 'dark'
}

function makeRequest(body: Record<string, unknown>) {
	return new Request('http://localhost/api/settings', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body)
	})
}

beforeEach(() => {
	vi.clearAllMocks()
})

function authenticatedLocals() {
	return { session: { isAuthenticated: true } }
}

function unauthenticatedLocals() {
	return { session: { isAuthenticated: false } }
}

describe('POST /api/settings', () => {
	async function callEndpoint(
		body: Record<string, unknown>,
		cookies = createMockCookies(),
		locals = authenticatedLocals()
	) {
		const { POST } = await import('../../routes/(app)/api/settings/+server')
		const response = await POST({
			cookies: cookies as unknown as import('@sveltejs/kit').Cookies,
			request: makeRequest(body),
			locals
		} as unknown as import('@sveltejs/kit').RequestEvent)
		return { response, cookies }
	}

	it('returns 401 when unauthenticated', async () => {
		const { response } = await callEndpoint(baseUser, createMockCookies(), unauthenticatedLocals())

		expect(response.status).toBe(401)
		expect(mockSetUserCookie).not.toHaveBeenCalled()
	})

	it('sets user cookie with provided data', async () => {
		const { response } = await callEndpoint(baseUser)

		expect(response.status).toBe(200)
		expect(mockSetUserCookie).toHaveBeenCalledWith(
			expect.anything(),
			baseUser,
			expect.objectContaining({ secure: true })
		)
	})

	it('strips username before storing in user cookie', async () => {
		await callEndpoint({ ...baseUser, username: 'grug' })

		const storedCookie = mockSetUserCookie.mock.calls[0]![1] as UserCookie
		expect(storedCookie).not.toHaveProperty('username')
		expect(storedCookie.language).toBe('en')
	})

	it('updates account cookie when username is provided', async () => {
		const existingAccount = { userId: 'u1', username: 'old', token: 'tok', role: 0 }
		mockGetAccountFromCookies.mockReturnValue(existingAccount)

		await callEndpoint({ ...baseUser, username: 'newname' })

		expect(mockSetAccountCookie).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({ username: 'newname', token: 'tok' }),
			expect.anything()
		)
	})

	describe('PARAGLIDE_LOCALE sync', () => {
		it('sets PARAGLIDE_LOCALE when language is non-English', async () => {
			const cookies = createMockCookies()
			await callEndpoint({ ...baseUser, language: 'ja' }, cookies)

			expect(cookies.set).toHaveBeenCalledWith(
				'PARAGLIDE_LOCALE',
				'ja',
				expect.objectContaining({
					path: '/',
					httpOnly: false,
					sameSite: 'lax'
				})
			)
		})

		it('does not set PARAGLIDE_LOCALE when language is English', async () => {
			const cookies = createMockCookies()
			await callEndpoint({ ...baseUser, language: 'en' }, cookies)

			expect(cookies.set).not.toHaveBeenCalledWith(
				'PARAGLIDE_LOCALE',
				expect.anything(),
				expect.anything()
			)
		})

		it('deletes PARAGLIDE_LOCALE when switching back to English', async () => {
			const cookies = createMockCookies()
			// Simulate existing PARAGLIDE_LOCALE from a previous Japanese session
			cookies.store.set('PARAGLIDE_LOCALE', 'ja')

			await callEndpoint({ ...baseUser, language: 'en' }, cookies)

			expect(cookies.delete).toHaveBeenCalledWith('PARAGLIDE_LOCALE', { path: '/' })
		})

		it('skips PARAGLIDE_LOCALE set if already correct', async () => {
			const cookies = createMockCookies()
			cookies.store.set('PARAGLIDE_LOCALE', 'ja')

			await callEndpoint({ ...baseUser, language: 'ja' }, cookies)

			// Should not call set for PARAGLIDE_LOCALE since it already matches
			expect(cookies.set).not.toHaveBeenCalledWith(
				'PARAGLIDE_LOCALE',
				expect.anything(),
				expect.anything()
			)
		})

		it('does not delete PARAGLIDE_LOCALE when it does not exist and language is English', async () => {
			const cookies = createMockCookies()
			// No PARAGLIDE_LOCALE cookie exists

			await callEndpoint({ ...baseUser, language: 'en' }, cookies)

			expect(cookies.delete).not.toHaveBeenCalled()
		})
	})
})
