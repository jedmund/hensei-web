import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockCookies } from '$lib/server/socialAuth/__tests__/mockCookies'

vi.mock('$env/dynamic/private', () => ({ env: {} }))
vi.mock('$env/dynamic/public', () => ({ env: {} }))
vi.mock('$app/environment', () => ({ dev: false }))
vi.mock('$lib/api/adapters/config', () => ({ getApiBaseUrl: () => 'http://api.test/api/v1' }))

const signUpWithTicket = vi.fn()
const establishSession = vi.fn()
vi.mock('$lib/server/socialAuth/api', () => ({
	signUpWithTicket: (...args: unknown[]) => signUpWithTicket(...args)
}))
vi.mock('$lib/auth/session', () => ({
	establishSession: (...args: unknown[]) => establishSession(...args)
}))

const loginPage = await import('../login/+page.server')
const usernamePage = await import('../choose-username/+page.server')

const NEXT = '/auth/extension?redirect_uri=https%3A%2F%2Fabc.chromiumapp.org%2F&state=s'

interface Thrown {
	status: number
	location?: string
}

async function thrown(fn: () => unknown): Promise<Thrown> {
	try {
		await fn()
	} catch (e) {
		return e as Thrown
	}
	throw new Error('expected a redirect')
}

function formRequest(fields: Record<string, string>) {
	const body = new FormData()
	for (const [k, v] of Object.entries(fields)) body.set(k, v)
	return new Request('https://granblue.team/auth/login', { method: 'POST', body })
}

beforeEach(() => {
	vi.clearAllMocks()
})

describe('password login: next', () => {
	function loginEvent(next: string | null) {
		const url = new URL('https://granblue.team/auth/login')
		if (next !== null) url.searchParams.set('next', next)
		const fetchFn = vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ success: true }), {
				status: 200,
				headers: { 'content-type': 'application/json' }
			})
		)
		return {
			request: formRequest({ email: 'djeeta@example.com', password: 'password123' }),
			fetch: fetchFn,
			url
		}
	}

	it('returns to a same-site next after signing in', async () => {
		const result = await thrown(() =>
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			loginPage.actions.default!(loginEvent(NEXT) as any)
		)
		expect(result).toMatchObject({ status: 303, location: NEXT })
	})

	it('ignores an off-site next', async () => {
		for (const next of ['https://evil.example/', '//evil.example/x', '/\\evil.example']) {
			const result = await thrown(() =>
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				loginPage.actions.default!(loginEvent(next) as any)
			)
			expect(result).toMatchObject({ status: 303, location: '/me' })
		}
	})
})

describe('username step: next', () => {
	function usernameEvent(next?: string) {
		const jar = createMockCookies({
			social_signup: JSON.stringify({
				ticket: 'signup-ticket',
				provider: 'discord',
				suggestedUsername: 'djeeta',
				emailRequired: false,
				...(next ? { next } : {})
			})
		})
		return {
			request: formRequest({ username: 'djeeta' }),
			cookies: jar.cookies,
			fetch: vi.fn()
		}
	}

	it('lands on the next saved with the signup ticket', async () => {
		signUpWithTicket.mockResolvedValue({ kind: 'tokens', tokens: {} })
		establishSession.mockResolvedValue({})
		const result = await thrown(() =>
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			usernamePage.actions.default!(usernameEvent(NEXT) as any)
		)
		expect(result).toMatchObject({ status: 303, location: NEXT })
	})

	it('falls back to /me without a next', async () => {
		signUpWithTicket.mockResolvedValue({ kind: 'tokens', tokens: {} })
		establishSession.mockResolvedValue({})
		const result = await thrown(() =>
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			usernamePage.actions.default!(usernameEvent() as any)
		)
		expect(result).toMatchObject({ status: 303, location: '/me' })
	})

	it('keeps next when the ticket has expired', async () => {
		signUpWithTicket.mockResolvedValue({ kind: 'invalid_ticket' })
		const result = await thrown(() =>
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			usernamePage.actions.default!(usernameEvent(NEXT) as any)
		)
		const location = new URL(result.location ?? '', 'https://granblue.team')
		expect(location.pathname).toBe('/auth/login')
		expect(location.searchParams.get('next')).toBe(NEXT)
	})
})
