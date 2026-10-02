import type { RequestHandler } from '@sveltejs/kit'
import { json } from '@sveltejs/kit'
import { dev } from '$app/environment'
import { z } from 'zod'
import { passwordGrantLogin } from '$lib/auth/oauth'
import { establishSession } from '$lib/auth/session'

const LoginSchema = z.object({
	email: z.string().email(),
	password: z.string().min(8),
	grant_type: z.literal('password')
})

export const POST: RequestHandler = async ({ request, cookies, fetch }) => {
	const raw = await request.json().catch(() => ({}))
	const parsed = LoginSchema.safeParse(raw)
	if (!parsed.success) {
		const details = parsed.error.flatten((i) => i.message)
		return json({ error: 'Validation error', details }, { status: 400 })
	}

	try {
		const oauth = await passwordGrantLogin(fetch, parsed.data)

		// Use secure cookies in production (dev flag handles this correctly behind proxies)
		const { info, accessTokenExpiresAt } = await establishSession(cookies, oauth, { secure: !dev })

		// Return access token for client-side storage
		return json({
			success: true,
			user: { username: info.username, avatar: info.avatar },
			access_token: oauth.access_token,
			expires_in: oauth.expires_in,
			expires_at: accessTokenExpiresAt.toISOString()
		})
	} catch (e: unknown) {
		const err = e as Record<string, unknown>
		if (dev) console.error('[Login] Error:', e)
		if (dev) console.error('[Login] Error message:', err?.message)
		if (dev) console.error('[Login] Error stack:', err?.stack)

		if (String(err?.message) === 'unauthorized') {
			return json({ error: 'Invalid email or password' }, { status: 401 })
		}

		return json({ error: 'Failed to login' }, { status: 502 })
	}
}
