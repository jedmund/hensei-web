import { dev } from '$app/environment'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { getAccountFromCookies, setAccountCookie, setUserCookie } from '$lib/auth/cookies'
import type { UserCookie } from '$lib/types/UserCookie'

export const POST: RequestHandler = async ({ cookies, request, locals }) => {
	if (!locals.session?.isAuthenticated) {
		return json({ error: 'Unauthorized' }, { status: 401 })
	}

	try {
		const body = (await request.json()) as UserCookie & { username?: string }

		// Calculate expiry date (60 days from now)
		const expires = new Date()
		expires.setDate(expires.getDate() + 60)

		// If a username was provided, update the account cookie too
		if (body.username) {
			const account = getAccountFromCookies(cookies)
			if (account) {
				setAccountCookie(
					cookies,
					{ ...account, username: body.username },
					{
						secure: true,
						expires
					}
				)
			}
		}

		// Strip username before storing as user cookie (it doesn't belong there)
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { username: _, ...userCookie } = body

		// Set the user cookie with the updated data
		setUserCookie(cookies, userCookie, {
			secure: true,
			expires
		})

		// Sync PARAGLIDE_LOCALE cookie with the language preference
		if (userCookie.language && userCookie.language !== 'en') {
			if (cookies.get('PARAGLIDE_LOCALE') !== userCookie.language) {
				cookies.set('PARAGLIDE_LOCALE', userCookie.language, {
					path: '/',
					httpOnly: false,
					sameSite: 'lax',
					secure: !dev,
					maxAge: 34560000
				})
			}
		} else if (cookies.get('PARAGLIDE_LOCALE')) {
			cookies.delete('PARAGLIDE_LOCALE', { path: '/' })
		}

		return json({ success: true })
	} catch (error) {
		if (dev) console.error('Failed to update settings cookie:', error)
		return json({ error: 'Failed to update settings' }, { status: 500 })
	}
}
