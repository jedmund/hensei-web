import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { AccountCookie } from '$lib/types/AccountCookie'

vi.mock('$app/environment', () => ({ dev: false }))
vi.mock('$env/static/public', () => ({
	PUBLIC_SIERO_API_URL: 'http://localhost:3000'
}))
vi.mock('$lib/paraglide/server', () => ({
	paraglideMiddleware: (
		_req: Request,
		cb: (ctx: { request: Request; locale: string }) => unknown
	) => cb({ request: new Request('http://localhost/'), locale: 'en' })
}))
vi.mock('$lib/utils/fonts', () => ({
	generateFontFaceCSS: () => '',
	getFontPreloadLinks: () => ''
}))

const mockGetAccountFromCookies = vi.fn()
const mockGetUserFromCookies = vi.fn()
const mockGetRefreshFromCookies = vi.fn()
const mockClearAuthCookies = vi.fn()

vi.mock('$lib/auth/cookies', () => ({
	getAccountFromCookies: (...args: unknown[]) => mockGetAccountFromCookies(...args),
	getUserFromCookies: (...args: unknown[]) => mockGetUserFromCookies(...args),
	getRefreshFromCookies: (...args: unknown[]) => mockGetRefreshFromCookies(...args),
	clearAuthCookies: (...args: unknown[]) => mockClearAuthCookies(...args)
}))

const mockPerformRefresh = vi.fn()
vi.mock('$lib/auth/refresh', () => ({
	performRefresh: (...args: unknown[]) => mockPerformRefresh(...args)
}))

const { handleSession } = await import('../hooks.server')

function createMockCookies() {
	return {
		set: vi.fn(),
		get: vi.fn(),
		delete: vi.fn()
	} as unknown as import('@sveltejs/kit').Cookies
}

function createEvent(overrides: Partial<Record<string, unknown>> = {}) {
	return {
		cookies: createMockCookies(),
		fetch: vi.fn(),
		url: new URL('http://localhost/some-path'),
		request: new Request('http://localhost/some-path'),
		locals: {} as Record<string, unknown>,
		...overrides
	} as unknown as Parameters<typeof handleSession>[0]['event']
}

const healthyAccount: AccountCookie = {
	userId: 'u1',
	username: 'grug',
	token: 'valid-token',
	role: 0,
	expires_at: '2030-01-01T00:00:00.000Z'
}

// A cookie written by the pre-#835 refresh endpoint: token present,
// expires_at missing.
const brokenAccount: AccountCookie = {
	userId: 'u1',
	username: 'grug',
	token: 'valid-but-stuck-token',
	role: 0
} as AccountCookie

const healedAccount: AccountCookie = {
	userId: 'u1',
	username: 'grug',
	token: 'fresh-token',
	role: 0,
	expires_at: '2030-02-01T00:00:00.000Z'
}

beforeEach(() => {
	vi.clearAllMocks()
	mockGetUserFromCookies.mockReturnValue(null)
	mockGetRefreshFromCookies.mockReturnValue('valid-refresh-cookie')
})

describe('handleSession', () => {
	it('does not attempt healing when the account cookie has expires_at', async () => {
		mockGetAccountFromCookies.mockReturnValue(healthyAccount)
		const event = createEvent()
		const resolve = vi.fn().mockResolvedValue(new Response('ok'))

		await handleSession({ event, resolve } as Parameters<typeof handleSession>[0])

		expect(mockPerformRefresh).not.toHaveBeenCalled()
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		expect((event.locals as any).session.account).toBe(healthyAccount)
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		expect((event.locals as any).auth.expiresAt).toBe(healthyAccount.expires_at)
	})

	it('heals a broken cookie silently via performRefresh', async () => {
		// First read returns the broken cookie; after healing, re-read
		// returns the fresh one.
		mockGetAccountFromCookies.mockReturnValueOnce(brokenAccount).mockReturnValueOnce(healedAccount)
		mockPerformRefresh.mockResolvedValue({
			ok: true,
			data: {},
			accessTokenExpiresAt: new Date(healedAccount.expires_at!)
		})

		const event = createEvent()
		const resolve = vi.fn().mockResolvedValue(new Response('ok'))

		await handleSession({ event, resolve } as Parameters<typeof handleSession>[0])

		expect(mockPerformRefresh).toHaveBeenCalledTimes(1)
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const session = (event.locals as any).session
		expect(session.account).toBe(healedAccount)
		expect(session.isAuthenticated).toBe(true)
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		expect((event.locals as any).auth.accessToken).toBe(healedAccount.token)
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		expect((event.locals as any).auth.expiresAt).toBe(healedAccount.expires_at)
	})

	it('drops session state when the upstream refresh is unauthorized', async () => {
		mockGetAccountFromCookies.mockReturnValue(brokenAccount)
		mockGetUserFromCookies.mockReturnValue({ language: 'en' })
		mockPerformRefresh.mockResolvedValue({
			ok: false,
			reason: 'refresh_unauthorized'
		})

		const event = createEvent()
		const resolve = vi.fn().mockResolvedValue(new Response('ok'))

		await handleSession({ event, resolve } as Parameters<typeof handleSession>[0])

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const session = (event.locals as any).session
		expect(session.account).toBeNull()
		expect(session.user).toBeNull()
		expect(session.isAuthenticated).toBe(false)
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		expect((event.locals as any).auth).toBeNull()
	})

	it('leaves the broken cookie alone on transient refresh failure', async () => {
		mockGetAccountFromCookies.mockReturnValue(brokenAccount)
		mockPerformRefresh.mockResolvedValue({ ok: false, reason: 'refresh_failed' })

		const event = createEvent()
		const resolve = vi.fn().mockResolvedValue(new Response('ok'))

		await handleSession({ event, resolve } as Parameters<typeof handleSession>[0])

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const session = (event.locals as any).session
		// We don't clear — the user can retry on the next request.
		expect(session.account).toBe(brokenAccount)
		// expiresAt is still empty, so the client will still refuse to hydrate
		// — but at least we didn't log them out during a Rails outage.
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		expect((event.locals as any).auth.expiresAt).toBe('')
	})

	it('does nothing special for an unauthenticated visitor', async () => {
		mockGetAccountFromCookies.mockReturnValue(null)
		mockGetRefreshFromCookies.mockReturnValue(null)

		const event = createEvent()
		const resolve = vi.fn().mockResolvedValue(new Response('ok'))

		await handleSession({ event, resolve } as Parameters<typeof handleSession>[0])

		expect(mockPerformRefresh).not.toHaveBeenCalled()
		expect(mockClearAuthCookies).not.toHaveBeenCalled()
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		expect((event.locals as any).session.isAuthenticated).toBe(false)
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		expect((event.locals as any).auth).toBeNull()
	})

	it('clears stale account cookie when the refresh cookie is gone', async () => {
		// Post-#835 shape: account cookie looks fine (has expires_at) but the
		// browser has already purged the refresh cookie because it was pinned
		// to the same expiry. Without this branch, SSR keeps rehydrating the
		// client into a /auth/refresh → 401 → redirect → SSR loop.
		mockGetAccountFromCookies.mockReturnValue(healthyAccount)
		mockGetRefreshFromCookies.mockReturnValue(null)

		const event = createEvent()
		const resolve = vi.fn().mockResolvedValue(new Response('ok'))

		await handleSession({ event, resolve } as Parameters<typeof handleSession>[0])

		expect(mockClearAuthCookies).toHaveBeenCalledTimes(1)
		expect(mockPerformRefresh).not.toHaveBeenCalled()
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const session = (event.locals as any).session
		expect(session.account).toBeNull()
		expect(session.user).toBeNull()
		expect(session.isAuthenticated).toBe(false)
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		expect((event.locals as any).auth).toBeNull()
	})

	it('does not clear cookies when both account and refresh are present', async () => {
		mockGetAccountFromCookies.mockReturnValue(healthyAccount)
		mockGetRefreshFromCookies.mockReturnValue('refresh-token-still-alive')

		const event = createEvent()
		const resolve = vi.fn().mockResolvedValue(new Response('ok'))

		await handleSession({ event, resolve } as Parameters<typeof handleSession>[0])

		expect(mockClearAuthCookies).not.toHaveBeenCalled()
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		expect((event.locals as any).session.account).toBe(healthyAccount)
	})
})
