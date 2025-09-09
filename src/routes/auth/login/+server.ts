import type { RequestHandler } from '@sveltejs/kit'
import { json } from '@sveltejs/kit'
import { z } from 'zod'
import { passwordGrantLogin } from '$lib/auth/oauth'
import { users } from '$lib/api/resources/users'
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

		const info = await users.info(fetch, oauth.user.username, {
			headers: {
				Authorization: `Bearer ${oauth.access_token}`
			}
		})

		const { account, user, accessTokenExpiresAt, refresh } = buildCookies(oauth, info)

		const secure = url.protocol === 'https:'
		setAccountCookie(cookies, account, { secure, expires: accessTokenExpiresAt })
		setUserCookie(cookies, user, { secure, expires: accessTokenExpiresAt })
		setRefreshCookie(cookies, refresh, { secure, expires: accessTokenExpiresAt })

		return json({ success: true, user: { username: info.username, avatar: info.avatar } })
	} catch (e: any) {
		if (String(e?.message) === 'unauthorized') {
			return json({ error: 'Invalid email or password' }, { status: 401 })
		}

		return json({ error: 'Failed to login' }, { status: 502 })
	}
}
