import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockClearAuthCookies = vi.fn()
const mockSetAccountCookie = vi.fn()
const mockGetAccountFromCookies = vi.fn()

vi.mock('$app/environment', () => ({ dev: false }))
vi.mock('$lib/api/adapters/config', () => ({ getApiBaseUrl: () => 'https://api.test/v1' }))
vi.mock('$lib/auth/cookies', () => ({
	clearAuthCookies: (...args: unknown[]) => mockClearAuthCookies(...args),
	setAccountCookie: (...args: unknown[]) => mockSetAccountCookie(...args),
	getAccountFromCookies: (...args: unknown[]) => mockGetAccountFromCookies(...args)
}))

const cookies = { set: vi.fn(), get: vi.fn(), delete: vi.fn() }
const signedIn = { session: { isAuthenticated: true } }

function apiResponse(status: number, body?: unknown) {
	return new Response(body === undefined ? null : JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json' }
	})
}

function jsonRequest(body: unknown) {
	return new Request('http://localhost/api/account/deletion', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body)
	})
}

beforeEach(() => {
	vi.clearAllMocks()
})

describe('POST /api/account/deletion', () => {
	it('schedules the deletion and signs the user out', async () => {
		const fetch = vi
			.fn()
			.mockResolvedValue(apiResponse(200, { deletion_scheduled_at: '2026-11-01T00:00:00Z' }))
		const { POST } = await import('../+server')

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const response = await (POST as any)({
			cookies,
			fetch,
			locals: signedIn,
			request: jsonRequest({ password: 'hunter22' })
		})

		expect(fetch).toHaveBeenCalledWith('https://api.test/v1/users/me/deletion', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ password: 'hunter22' })
		})
		expect(response.status).toBe(200)
		expect(await response.json()).toEqual({ deletionScheduledAt: '2026-11-01T00:00:00Z' })
		expect(mockClearAuthCookies).toHaveBeenCalledWith(cookies)
	})

	it('passes on a wrong password and keeps the session', async () => {
		const fetch = vi.fn().mockResolvedValue(apiResponse(422, { error: 'invalid_password' }))
		const { POST } = await import('../+server')

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const response = await (POST as any)({
			cookies,
			fetch,
			locals: signedIn,
			request: jsonRequest({ password: 'nope' })
		})

		expect(response.status).toBe(422)
		expect(await response.json()).toEqual({ error: 'invalid_password' })
		expect(mockClearAuthCookies).not.toHaveBeenCalled()
	})

	it('rejects signed-out requests without calling the API', async () => {
		const fetch = vi.fn()
		const { POST } = await import('../+server')

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const response = await (POST as any)({
			cookies,
			fetch,
			locals: { session: { isAuthenticated: false } },
			request: jsonRequest({ password: 'x' })
		})

		expect(response.status).toBe(401)
		expect(fetch).not.toHaveBeenCalled()
	})
})

describe('DELETE /api/account/deletion', () => {
	it('cancels the deletion and clears it from the account cookie', async () => {
		const fetch = vi.fn().mockResolvedValue(apiResponse(204))
		mockGetAccountFromCookies.mockReturnValue({
			userId: 'u1',
			username: 'grug',
			token: 'tok',
			role: 1,
			expires_at: '2026-12-01T00:00:00.000Z',
			deletionScheduledAt: '2026-11-01T00:00:00Z'
		})
		const { DELETE } = await import('../+server')

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const response = await (DELETE as any)({ cookies, fetch, locals: signedIn })

		expect(fetch).toHaveBeenCalledWith('https://api.test/v1/users/me/deletion', {
			method: 'DELETE'
		})
		expect(response.status).toBe(200)
		expect(mockSetAccountCookie).toHaveBeenCalledWith(
			cookies,
			expect.objectContaining({ userId: 'u1', deletionScheduledAt: null }),
			{ secure: true, expires: new Date('2026-12-01T00:00:00.000Z') }
		)
	})

	it('leaves the cookie alone when the API fails', async () => {
		const fetch = vi.fn().mockResolvedValue(apiResponse(500, {}))
		const { DELETE } = await import('../+server')

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const response = await (DELETE as any)({ cookies, fetch, locals: signedIn })

		expect(response.status).toBe(502)
		expect(mockSetAccountCookie).not.toHaveBeenCalled()
	})
})
