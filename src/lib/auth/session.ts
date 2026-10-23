import type { Cookies } from '@sveltejs/kit'
import type { OAuthLoginResponse } from './oauth'
import { userAdapter, type UserInfo } from '$lib/api/adapters/user.adapter'
import { buildCookies } from './map'
import { setAccountCookie, setRefreshCookie, setUserCookie } from './cookies'

/**
 * Turns a token body (the shape `POST /oauth/token` returns) into the web
 * session: account, user and refresh cookies plus the locale cookie. Shared by
 * password login, password signup and every social login path so they can't
 * drift apart.
 */
export async function establishSession(
	cookies: Cookies,
	oauth: OAuthLoginResponse,
	{ secure }: { secure: boolean }
): Promise<{ info: UserInfo; accessTokenExpiresAt: Date }> {
	const info = await userAdapter.getInfo(oauth.user.username, {
		headers: {
			Authorization: `Bearer ${oauth.access_token}`
		}
	})
	const { account, user, accessTokenExpiresAt, refresh } = buildCookies(oauth, info)

	setAccountCookie(cookies, account, { secure, expires: accessTokenExpiresAt })
	setUserCookie(cookies, user, { secure, expires: accessTokenExpiresAt })
	setRefreshCookie(cookies, refresh, { secure })

	// Sync locale cookie so Paraglide renders the correct language
	if (user.language && user.language !== 'en') {
		cookies.set('PARAGLIDE_LOCALE', user.language, {
			path: '/',
			httpOnly: false,
			sameSite: 'lax',
			secure,
			maxAge: 34560000
		})
	} else {
		cookies.delete('PARAGLIDE_LOCALE', { path: '/' })
	}

	return { info, accessTokenExpiresAt }
}
