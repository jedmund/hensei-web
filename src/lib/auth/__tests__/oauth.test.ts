import { describe, it, expect, vi } from 'vitest'

vi.mock('$env/static/public', () => ({ PUBLIC_SIERO_API_URL: 'http://localhost:3000' }))

const { passwordGrantLogin } = await import('../oauth')

const loginBody = { email: 'grug@cave.dev', password: 'rock123', grant_type: 'password' as const }

describe('passwordGrantLogin', () => {
	it('returns parsed response on success', async () => {
		const mockResponse = {
			access_token: 'tok-1',
			token_type: 'Bearer',
			expires_in: 3600,
			refresh_token: 'ref-1',
			created_at: 1700000000,
			user: { id: 'u1', username: 'grug', role: 0 }
		}

		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => mockResponse
		})

		const result = await passwordGrantLogin(mockFetch, loginBody)

		expect(result).toEqual(mockResponse)
		expect(mockFetch).toHaveBeenCalledWith(
			'http://localhost:3000/oauth/token',
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(loginBody)
			}
		)
	})

	it('throws "unauthorized" on 401', async () => {
		const mockFetch = vi.fn().mockResolvedValue({
			ok: false,
			status: 401
		})

		await expect(passwordGrantLogin(mockFetch, loginBody)).rejects.toThrow('unauthorized')
	})

	it('throws formatted error on other failures', async () => {
		const mockFetch = vi.fn().mockResolvedValue({
			ok: false,
			status: 500
		})

		await expect(passwordGrantLogin(mockFetch, loginBody)).rejects.toThrow('oauth_error_500')
	})
})
