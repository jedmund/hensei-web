import type { RequestHandler } from '@sveltejs/kit'
import { json } from '@sveltejs/kit'
import { OAUTH_BASE } from '$lib/config'
import {
	getRefreshFromCookies,
	setAccountCookie,
	setRefreshCookie,
	clearAuthCookies
} from '$lib/auth/cookies'

type OAuthRefreshResponse = {
	access_token: string
	token_type: 'Bearer'
	expires_in: number
	refresh_token: string
	created_at: number
	user: {
		id: string
		username: string
		role: number
	}
}

export const POST: RequestHandler = async ({ cookies, fetch, url }) => {
	const refresh = getRefreshFromCookies(cookies)
	if (!refresh) {
		return json({ error: 'no_refresh_token' }, { status: 401 })
	}

	const res = await fetch(`${OAUTH_BASE}/token`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			refresh_token: refresh,
			grant_type: 'refresh_token'
		})
	})

	if (res.status === 401) {
		clearAuthCookies(cookies)
		return json({ error: 'refresh_unauthorized' }, { status: 401 })
	}

	if (!res.ok) {
		return json({ error: 'refresh_failed' }, { status: 502 })
	}

	const data = (await res.json()) as OAuthRefreshResponse
	const secure = url.protocol === 'https:'
	const accessTokenExpiresAt = new Date((data.created_at + data.expires_in) * 1000)

	setAccountCookie(
		cookies,
		{
			userId: data.user.id,
			username: data.user.username,
			token: data.access_token,
			role: data.user.role
		},
		{
			secure,
			expires: accessTokenExpiresAt
		}
	)

	setRefreshCookie(cookies, data.refresh_token, { secure })

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
