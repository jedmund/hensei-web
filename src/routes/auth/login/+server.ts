import type { RequestHandler } from '@sveltejs/kit'
import { json } from '@sveltejs/kit'
import { z } from 'zod'
import { passwordGrantLogin } from '$lib/auth/oauth'
import { UserAdapter } from '$lib/api/adapters'
import { buildCookies } from '$lib/auth/map'
import { setAccountCookie, setUserCookie, setRefreshCookie } from '$lib/auth/cookies'

const LoginSchema = z.object({
	email: z.string().email(),
	password: z.string().min(8),
	grant_type: z.literal('password')
})

export const POST: RequestHandler = async ({ request, cookies, url, fetch }) => {
	const raw = await request.json().catch(() => ({}))
	const parsed = LoginSchema.safeParse(raw)
	if (!parsed.success) {
		const details = parsed.error.flatten((i) => i.message)
		return json({ error: 'Validation error', details }, { status: 400 })
	}

	try {
		const oauth = await passwordGrantLogin(fetch, parsed.data)

		// Create a UserAdapter instance and pass the auth token
		const userAdapter = new UserAdapter()
		const info = await userAdapter.getInfo(oauth.user.username, {
			headers: {
				Authorization: `Bearer ${oauth.access_token}`
			}
		})

		const { account, user, accessTokenExpiresAt, refresh } = buildCookies(oauth, info)

		const secure = url.protocol === 'https:'
		setAccountCookie(cookies, account, { secure, expires: accessTokenExpiresAt })
		setUserCookie(cookies, user, { secure, expires: accessTokenExpiresAt })
		setRefreshCookie(cookies, refresh, { secure, expires: accessTokenExpiresAt })

		// Return access token for client-side storage
		return json({
			success: true,
			user: { username: info.username, avatar: info.avatar },
			access_token: oauth.access_token,
			expires_in: oauth.expires_in,
			expires_at: accessTokenExpiresAt.toISOString()
		})
	} catch (e: any) {
		if (String(e?.message) === 'unauthorized') {
			return json({ error: 'Invalid email or password' }, { status: 401 })
		}

		return json({ error: 'Failed to login' }, { status: 502 })
	}
}
