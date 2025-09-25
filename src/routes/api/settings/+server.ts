import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { setUserCookie } from '$lib/auth/cookies'
import type { UserCookie } from '$lib/types/UserCookie'

export const POST: RequestHandler = async ({ cookies, request }) => {
	try {
		const userCookie = await request.json() as UserCookie

		// Calculate expiry date (60 days from now)
		const expires = new Date()
		expires.setDate(expires.getDate() + 60)

		// Set the user cookie with the updated data
		setUserCookie(cookies, userCookie, {
			secure: true,
			expires
		})

		return json({ success: true })
	} catch (error) {
		console.error('Failed to update settings cookie:', error)
		return json({ error: 'Failed to update settings' }, { status: 500 })
	}
}