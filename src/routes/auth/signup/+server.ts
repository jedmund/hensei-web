import type { RequestHandler } from '@sveltejs/kit'
import { json } from '@sveltejs/kit'
import { dev } from '$app/environment'
import { z } from 'zod'
import { PUBLIC_SIERO_API_URL } from '$env/static/public'
import { passwordGrantLogin } from '$lib/auth/oauth'
import { UserAdapter } from '$lib/api/adapters/user.adapter'
import { buildCookies } from '$lib/auth/map'
import { setAccountCookie, setUserCookie, setRefreshCookie } from '$lib/auth/cookies'

const SignupSchema = z
	.object({
		username: z
			.string()
			.min(3, 'Username must be at least 3 characters')
			.max(20, 'Username must be less than 20 characters')
			.regex(
				/^[a-zA-Z0-9_-]+$/,
				'Username can only contain letters, numbers, underscores, and hyphens'
			),
		email: z.string().email('Invalid email format'),
		password: z.string().min(8, 'Password must be at least 8 characters'),
		password_confirmation: z.string()
	})
	.refine((data) => data.password === data.password_confirmation, {
		message: "Passwords don't match",
		path: ['password_confirmation']
	})

export const POST: RequestHandler = async ({ request, cookies, fetch }) => {
	const raw = await request.json().catch(() => ({}))
	const parsed = SignupSchema.safeParse(raw)

	if (!parsed.success) {
		const details = parsed.error.flatten((i) => i.message)
		return json({ error: 'Validation error', details }, { status: 400 })
	}

	const { username, email, password, password_confirmation } = parsed.data

	try {
		// 1. Create user account via API
		const signupRes = await fetch(`${PUBLIC_SIERO_API_URL}/users`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				user: {
					username,
					email,
					password,
					password_confirmation
				}
			})
		})

		if (!signupRes.ok) {
			const errorData = await signupRes.json().catch(() => ({}))

			// Handle specific API errors (username/email already taken)
			if (signupRes.status === 409 || signupRes.status === 422) {
				return json(
					{ error: errorData.error || 'Username or email already in use' },
					{ status: 409 }
				)
			}

			return json({ error: errorData.error || 'Signup failed' }, { status: signupRes.status })
		}

		// 2. Auto-login the new user
		const oauth = await passwordGrantLogin(fetch, {
			email,
			password,
			grant_type: 'password'
		})

		// 3. Get additional user info
		const userAdapter = new UserAdapter()
		const info = await userAdapter.getInfo(oauth.user.username, {
			headers: {
				Authorization: `Bearer ${oauth.access_token}`
			}
		})

		// 4. Build and set cookies
		const { account, user, accessTokenExpiresAt, refresh } = buildCookies(oauth, info)

		// Use secure cookies in production (dev flag handles this correctly behind proxies)
		const secure = !dev
		setAccountCookie(cookies, account, { secure, expires: accessTokenExpiresAt })
		setUserCookie(cookies, user, { secure, expires: accessTokenExpiresAt })
		setRefreshCookie(cookies, refresh, { secure, expires: accessTokenExpiresAt })

		// 5. Return success with user data
		return json({
			success: true,
			user: { username: info.username, avatar: info.avatar },
			access_token: oauth.access_token,
			expires_in: oauth.expires_in,
			expires_at: accessTokenExpiresAt.toISOString()
		})
	} catch (e: unknown) {
		console.error('Signup error:', e)

		if (e instanceof Error && e.message === 'unauthorized') {
			// This shouldn't happen during signup, but handle it
			return json({ error: 'Failed to authenticate after signup' }, { status: 500 })
		}

		return json({ error: 'Signup failed' }, { status: 500 })
	}
}
