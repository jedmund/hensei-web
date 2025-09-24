import type { OAuthLoginResponse } from './oauth'
import type { UserInfoResponse } from '$lib/api/resources/users'
import type { AccountCookie } from '$lib/types/AccountCookie'
import type { UserCookie } from '$lib/types/UserCookie'

export function buildCookies(oauth: OAuthLoginResponse, info: UserInfoResponse) {
	const accessTokenExpiresAt = new Date((oauth.created_at + oauth.expires_in) * 1000)

	const account: AccountCookie = {
		userId: info.id,
		username: info.username,
		token: oauth.access_token,
		role: info.role,
		expires_at: accessTokenExpiresAt.toISOString()
	}

	const user: UserCookie = {
		picture: info.avatar.picture ?? '',
		element: info.avatar.element ?? '',
		language: info.language ?? 'en',
		gender: info.gender ?? 0,
		theme: info.theme ?? 'system'
	}

	return { account, user, accessTokenExpiresAt, refresh: oauth.refresh_token }
}
