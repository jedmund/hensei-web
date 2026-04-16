import type { RequestHandler } from '@sveltejs/kit'
import { json } from '@sveltejs/kit'
import { clearAuthCookies } from '$lib/auth/cookies'

export const POST: RequestHandler = async ({ cookies }) => {
	clearAuthCookies(cookies)
	return json({ success: true })
}
