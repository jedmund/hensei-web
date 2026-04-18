import type { Cookies } from '@sveltejs/kit'
import { dev } from '$app/environment'
import { PUBLIC_SIERO_API_URL } from '$env/static/public'
import {
	getRefreshFromCookies,
	setAccountCookie,
	setRefreshCookie,
	clearAuthCookies
} from './cookies'

const OAUTH_BASE = `${PUBLIC_SIERO_API_URL}/oauth`

export type OAuthRefreshResponse = {
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

export type RefreshResult =
	| { ok: true; data: OAuthRefreshResponse; accessTokenExpiresAt: Date }
	| { ok: false; reason: 'no_refresh_token' | 'refresh_unauthorized' | 'refresh_failed' }

/**
 * Exchanges the refresh cookie for a fresh access + refresh token pair and
 * writes both back as cookies. Shared by /auth/refresh and the SSR healing
 * path in hooks.server.ts.
 *
 * On a 401 from the upstream OAuth server we clear all auth cookies so the
 * user lands in a clean unauthenticated state. On other failures we leave
 * cookies alone so transient backend outages don't log everyone out.
 */
export async function performRefresh(
	cookies: Cookies,
	fetch: typeof globalThis.fetch
): Promise<RefreshResult> {
	const refresh = getRefreshFromCookies(cookies)
	if (!refresh) {
		return { ok: false, reason: 'no_refresh_token' }
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
		return { ok: false, reason: 'refresh_unauthorized' }
	}

	if (!res.ok) {
		return { ok: false, reason: 'refresh_failed' }
	}

	const data = (await res.json()) as OAuthRefreshResponse
	// Use secure cookies in production (dev flag handles this correctly behind proxies)
	const secure = !dev
	const accessTokenExpiresAt = new Date((data.created_at + data.expires_in) * 1000)

	setAccountCookie(
		cookies,
		{
			userId: data.user.id,
			username: data.user.username,
			token: data.access_token,
			role: data.user.role,
			expires_at: accessTokenExpiresAt.toISOString()
		},
		{ secure, expires: accessTokenExpiresAt }
	)

	setRefreshCookie(cookies, data.refresh_token, { secure, expires: accessTokenExpiresAt })

	return { ok: true, data, accessTokenExpiresAt }
}
