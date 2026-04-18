import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('$app/environment', () => ({ dev: false }))
vi.mock('$env/static/public', () => ({ PUBLIC_SIERO_API_URL: 'http://localhost:3000' }))

const mockSetAccountCookie = vi.fn()
const mockSetRefreshCookie = vi.fn()
const mockClearAuthCookies = vi.fn()
const mockGetRefreshFromCookies = vi.fn()

vi.mock('$lib/auth/cookies', () => ({
	setAccountCookie: (...args: unknown[]) => mockSetAccountCookie(...args),
	setRefreshCookie: (...args: unknown[]) => mockSetRefreshCookie(...args),
	clearAuthCookies: (...args: unknown[]) => mockClearAuthCookies(...args),
	getRefreshFromCookies: (...args: unknown[]) => mockGetRefreshFromCookies(...args)
}))

function createMockCookies() {
	return {
		set: vi.fn(),
		get: vi.fn(),
		delete: vi.fn()
	}
}

const validRefreshResponse = {
	access_token: 'new-access',
	token_type: 'Bearer' as const,
	expires_in: 60 * 60 * 24 * 30, // 30 days
	refresh_token: 'new-refresh',
	created_at: 1_700_000_000,
	user: { id: 'u1', username: 'grug', role: 0 }
}

async function callRefresh(fetchFn: typeof fetch, cookies = createMockCookies()) {
	const { POST } = await import('../+server')
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const response = await (POST as any)({
		cookies: cookies as unknown as import('@sveltejs/kit').Cookies,
		fetch: fetchFn
	})
	return { response, cookies }
}

beforeEach(() => {
	vi.clearAllMocks()
	mockGetRefreshFromCookies.mockReturnValue('existing-refresh')
})

describe('POST /auth/refresh', () => {
	it('returns 401 when no refresh cookie is present', async () => {
		mockGetRefreshFromCookies.mockReturnValue(null)
		const fetchFn = vi.fn()

		const { response } = await callRefresh(fetchFn as unknown as typeof fetch)

		expect(response.status).toBe(401)
		expect(fetchFn).not.toHaveBeenCalled()
	})

	it('clears auth cookies when upstream returns 401', async () => {
		const fetchFn = vi.fn().mockResolvedValue({ ok: false, status: 401 })

		const { response } = await callRefresh(fetchFn as unknown as typeof fetch)

		expect(response.status).toBe(401)
		expect(mockClearAuthCookies).toHaveBeenCalledTimes(1)
	})

	it('writes account cookie with expires_at on successful refresh', async () => {
		const fetchFn = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => validRefreshResponse
		})

		await callRefresh(fetchFn as unknown as typeof fetch)

		expect(mockSetAccountCookie).toHaveBeenCalledTimes(1)
		const [, account, opts] = mockSetAccountCookie.mock.calls[0]!
		const expectedExpiry = new Date(
			(validRefreshResponse.created_at + validRefreshResponse.expires_in) * 1000
		)

		expect(account).toMatchObject({
			userId: 'u1',
			username: 'grug',
			token: 'new-access',
			role: 0,
			expires_at: expectedExpiry.toISOString()
		})
		expect(typeof account.expires_at).toBe('string')
		expect(opts).toMatchObject({ secure: true, expires: expectedExpiry })
	})

	it('writes refresh cookie without an expires tied to the access token', async () => {
		const fetchFn = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => validRefreshResponse
		})

		await callRefresh(fetchFn as unknown as typeof fetch)

		// The refresh cookie's lifetime is managed inside setRefreshCookie via
		// maxAge, not via expires tied to the access token — otherwise the
		// browser drops the refresh cookie at the moment it's needed.
		const [, refreshToken, opts] = mockSetRefreshCookie.mock.calls[0]!
		expect(refreshToken).toBe('new-refresh')
		expect(opts).toEqual({ secure: true })
	})

	it('returns 502 on upstream non-401 failure without clearing cookies', async () => {
		const fetchFn = vi.fn().mockResolvedValue({ ok: false, status: 503 })

		const { response } = await callRefresh(fetchFn as unknown as typeof fetch)

		expect(response.status).toBe(502)
		expect(mockClearAuthCookies).not.toHaveBeenCalled()
		expect(mockSetAccountCookie).not.toHaveBeenCalled()
	})
})
