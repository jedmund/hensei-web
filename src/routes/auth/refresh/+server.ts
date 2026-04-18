import type { RequestHandler } from '@sveltejs/kit'
import { json } from '@sveltejs/kit'
import { performRefresh } from '$lib/auth/refresh'

export const POST: RequestHandler = async ({ cookies, fetch }) => {
	const result = await performRefresh(cookies, fetch)

	if (!result.ok) {
		if (result.reason === 'refresh_failed') {
			return json({ error: 'refresh_failed' }, { status: 502 })
		}
		return json({ error: result.reason }, { status: 401 })
	}

	const { data, accessTokenExpiresAt } = result
	return json({
		success: true,
		username: data.user.username,
		access_token: data.access_token,
		expires_in: data.expires_in,
		expires_at: accessTokenExpiresAt.toISOString(),
		user: {
			id: data.user.id,
			username: data.user.username,
			role: data.user.role
		}
	})
}
