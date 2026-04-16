import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockClearAuthCookies = vi.fn()

vi.mock('$lib/auth/cookies', () => ({
	clearAuthCookies: (...args: unknown[]) => mockClearAuthCookies(...args)
}))

function createMockCookies() {
	return {
		set: vi.fn(),
		get: vi.fn(),
		delete: vi.fn()
	}
}

beforeEach(() => {
	vi.clearAllMocks()
})

describe('POST /auth/logout', () => {
	it('clears all auth cookies (account, user, refresh)', async () => {
		const cookies = createMockCookies()
		const { POST } = await import('../+server')

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const response = await (POST as any)({
			cookies: cookies as unknown as import('@sveltejs/kit').Cookies
		})

		expect(response.status).toBe(200)
		expect(mockClearAuthCookies).toHaveBeenCalledTimes(1)
		expect(mockClearAuthCookies).toHaveBeenCalledWith(cookies)
	})
})
