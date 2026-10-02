import { describe, expect, it, vi } from 'vitest'
import { createMockCookies } from './mockCookies'

vi.mock('$lib/api/adapters/config', () => ({ getApiBaseUrl: () => 'http://api.test/api/v1' }))

const { linkPendingIdentity } = await import('../pendingLink')

const LINK_COOKIE = JSON.stringify({ ticket: 'link-ticket', provider: 'discord' })

function jsonResponse(status: number, body?: unknown) {
	return new Response(body === undefined ? null : JSON.stringify(body), { status })
}

describe('linkPendingIdentity (after a password login)', () => {
	it('does nothing without a pending link ticket', async () => {
		const jar = createMockCookies()
		const fetchFn = vi.fn()
		expect(await linkPendingIdentity(jar.cookies, fetchFn, 'new-token')).toBeNull()
		expect(fetchFn).not.toHaveBeenCalled()
	})

	it('posts the link_ticket with the new token and clears the cookie', async () => {
		const jar = createMockCookies({ social_link: LINK_COOKIE })
		const fetchFn = vi.fn().mockResolvedValue(
			jsonResponse(201, {
				provider: 'discord',
				email: 'djeeta@example.com',
				is_private_email: false,
				created_at: '2026-10-02T00:00:00Z'
			})
		)

		expect(await linkPendingIdentity(jar.cookies, fetchFn, 'new-token')).toEqual({
			linked: 'discord'
		})

		const [url, init] = fetchFn.mock.calls[0] as [string, RequestInit]
		expect(url).toBe('http://api.test/api/v1/users/me/identities')
		expect(init.method).toBe('POST')
		expect((init.headers as Record<string, string>).Authorization).toBe('Bearer new-token')
		expect(JSON.parse(String(init.body))).toEqual({ link_ticket: 'link-ticket' })
		expect(jar.store.has('social_link')).toBe(false)
	})

	it('reports identity_taken and maps an invalid ticket to expired', async () => {
		const taken = createMockCookies({ social_link: LINK_COOKIE })
		expect(
			await linkPendingIdentity(
				taken.cookies,
				vi.fn().mockResolvedValue(jsonResponse(409, { error: 'identity_taken' })),
				't'
			)
		).toEqual({ provider: 'discord', error: 'identity_taken' })
		expect(taken.store.has('social_link')).toBe(false)

		const expired = createMockCookies({ social_link: LINK_COOKIE })
		expect(
			await linkPendingIdentity(
				expired.cookies,
				vi.fn().mockResolvedValue(jsonResponse(401, { error: 'invalid_ticket' })),
				't'
			)
		).toEqual({ provider: 'discord', error: 'expired' })
	})

	it('clears the ticket even when the API is unreachable', async () => {
		const jar = createMockCookies({ social_link: LINK_COOKIE })
		expect(
			await linkPendingIdentity(jar.cookies, vi.fn().mockRejectedValue(new Error('down')), 't')
		).toEqual({ provider: 'discord', error: 'failed' })
		expect(jar.store.has('social_link')).toBe(false)
	})

	it('ignores a tampered cookie', async () => {
		const jar = createMockCookies({ social_link: '{"ticket":1,"provider":"github"}' })
		const fetchFn = vi.fn()
		expect(await linkPendingIdentity(jar.cookies, fetchFn, 't')).toBeNull()
		expect(fetchFn).not.toHaveBeenCalled()
	})
})
