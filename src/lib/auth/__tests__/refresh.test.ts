import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('$app/environment', () => ({ dev: false }))
vi.mock('$env/static/public', () => ({ PUBLIC_SIERO_API_URL: 'http://localhost:3000' }))

const mockSetAccountCookie = vi.fn()
const mockSetRefreshCookie = vi.fn()
const mockClearAuthCookies = vi.fn()
const mockGetRefreshFromCookies = vi.fn()

vi.mock('../cookies', () => ({
	setAccountCookie: (...args: unknown[]) => mockSetAccountCookie(...args),
	setRefreshCookie: (...args: unknown[]) => mockSetRefreshCookie(...args),
	clearAuthCookies: (...args: unknown[]) => mockClearAuthCookies(...args),
	getRefreshFromCookies: (...args: unknown[]) => mockGetRefreshFromCookies(...args)
}))

const { performRefresh } = await import('../refresh')

function createMockCookies() {
	return {
		set: vi.fn(),
		get: vi.fn(),
		delete: vi.fn()
	} as unknown as import('@sveltejs/kit').Cookies
}

const validRefreshResponse = {
	access_token: 'new-access',
	token_type: 'Bearer' as const,
	expires_in: 60 * 60 * 24 * 30,
	refresh_token: 'new-refresh',
	created_at: 1_700_000_000,
	user: { id: 'u1', username: 'grug', role: 0 }
}

beforeEach(() => {
	vi.clearAllMocks()
	mockGetRefreshFromCookies.mockReturnValue('existing-refresh')
})

describe('performRefresh', () => {
	it('returns no_refresh_token when the cookie is missing', async () => {
		mockGetRefreshFromCookies.mockReturnValue(null)
		const fetchFn = vi.fn()

		const result = await performRefresh(createMockCookies(), fetchFn as unknown as typeof fetch)

		expect(result).toEqual({ ok: false, reason: 'no_refresh_token' })
		expect(fetchFn).not.toHaveBeenCalled()
		expect(mockClearAuthCookies).not.toHaveBeenCalled()
	})

	it('clears cookies and returns refresh_unauthorized on 401', async () => {
		const fetchFn = vi.fn().mockResolvedValue({ ok: false, status: 401 })

		const result = await performRefresh(createMockCookies(), fetchFn as unknown as typeof fetch)

		expect(result).toEqual({ ok: false, reason: 'refresh_unauthorized' })
		expect(mockClearAuthCookies).toHaveBeenCalledTimes(1)
	})

	it('returns refresh_failed without clearing cookies on upstream 5xx', async () => {
		const fetchFn = vi.fn().mockResolvedValue({ ok: false, status: 503 })

		const result = await performRefresh(createMockCookies(), fetchFn as unknown as typeof fetch)

		expect(result).toEqual({ ok: false, reason: 'refresh_failed' })
		expect(mockClearAuthCookies).not.toHaveBeenCalled()
		expect(mockSetAccountCookie).not.toHaveBeenCalled()
	})

	it('writes account cookie with access-token expiry and refresh cookie decoupled from it', async () => {
		const fetchFn = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => validRefreshResponse
		})

		const result = await performRefresh(createMockCookies(), fetchFn as unknown as typeof fetch)

		if (!result.ok) throw new Error('expected success')

		const expectedExpiry = new Date(
			(validRefreshResponse.created_at + validRefreshResponse.expires_in) * 1000
		)
		expect(result.accessTokenExpiresAt).toEqual(expectedExpiry)
		expect(result.data).toBe(validRefreshResponse)

		const [, account, accountOpts] = mockSetAccountCookie.mock.calls[0]!
		expect(account).toMatchObject({
			userId: 'u1',
			username: 'grug',
			token: 'new-access',
			role: 0,
			expires_at: expectedExpiry.toISOString()
		})
		expect(accountOpts).toMatchObject({ secure: true, expires: expectedExpiry })

		// The refresh cookie must NOT carry the access-token expiry, otherwise
		// the browser drops it at the exact moment we need it to refresh.
		const [, refreshToken, refreshOpts] = mockSetRefreshCookie.mock.calls[0]!
		expect(refreshToken).toBe('new-refresh')
		expect(refreshOpts).toEqual({ secure: true })
	})

	it('sends grant_type=refresh_token to the OAuth token endpoint', async () => {
		const fetchFn = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => validRefreshResponse
		})

		await performRefresh(createMockCookies(), fetchFn as unknown as typeof fetch)

		expect(fetchFn).toHaveBeenCalledWith(
			'http://localhost:3000/oauth/token',
			expect.objectContaining({
				method: 'POST',
				body: JSON.stringify({
					refresh_token: 'existing-refresh',
					grant_type: 'refresh_token'
				})
			})
		)
	})
})
