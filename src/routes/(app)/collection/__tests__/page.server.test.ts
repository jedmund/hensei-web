import { describe, it, expect } from 'vitest'
import { isRedirect } from '@sveltejs/kit'
import { load } from '../+page.server'

type LoadEvent = Parameters<typeof load>[0]

function callLoad(session: App.Locals['session']) {
	return load({ locals: { session } } as unknown as LoadEvent)
}

const account = {
	userId: 'user-1',
	username: 'jedmund',
	token: 'token',
	role: 1,
	expires_at: '2099-01-01T00:00:00.000Z',
	deletionScheduledAt: null
}

// Mirrors buildCookies: the user cookie carries no username
const user = { picture: '', element: '', language: 'en', gender: 0, theme: 'system' }

describe('collection page server load', () => {
	it('redirects a signed-in user to their own collection', async () => {
		let thrown: unknown
		try {
			await callLoad({ account, user, isAuthenticated: true })
		} catch (e) {
			thrown = e
		}

		expect(isRedirect(thrown)).toBe(true)
		expect(thrown).toMatchObject({ status: 302, location: '/jedmund/collection' })
	})

	it('does not redirect a signed-out visitor', async () => {
		await expect(
			callLoad({ account: null, user: null, isAuthenticated: false })
		).resolves.toBeUndefined()
	})
})
