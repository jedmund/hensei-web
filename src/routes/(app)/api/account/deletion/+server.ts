import { dev } from '$app/environment'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { getApiBaseUrl } from '$lib/api/adapters/config'
import { clearAuthCookies, getAccountFromCookies, setAccountCookie } from '$lib/auth/cookies'

// Errors the API returns that the settings dialog shows to the user.
const KNOWN_ERRORS = new Set(['invalid_password', 'password_required'])

/**
 * Requests account deletion. The API signs the user out everywhere, so the
 * session cookies go too; the cancel banner shows on their next login.
 */
export const POST: RequestHandler = async ({ cookies, request, fetch, locals }) => {
	if (!locals.session?.isAuthenticated) {
		return json({ error: 'unauthorized' }, { status: 401 })
	}

	const body = (await request.json().catch(() => ({}))) as { password?: unknown }
	const password = typeof body.password === 'string' ? body.password : ''

	const res = await fetch(`${getApiBaseUrl()}/users/me/deletion`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ password })
	})
	const data = (await res.json().catch(() => ({}))) as {
		error?: string
		deletion_scheduled_at?: string
	}

	if (!res.ok) {
		const error = data.error && KNOWN_ERRORS.has(data.error) ? data.error : 'failed'
		return json({ error }, { status: res.status === 429 ? 429 : 422 })
	}

	clearAuthCookies(cookies)
	return json({ deletionScheduledAt: data.deletion_scheduled_at ?? null })
}

/** Cancels a scheduled deletion and clears it from the session. */
export const DELETE: RequestHandler = async ({ cookies, fetch, locals }) => {
	if (!locals.session?.isAuthenticated) {
		return json({ error: 'unauthorized' }, { status: 401 })
	}

	const res = await fetch(`${getApiBaseUrl()}/users/me/deletion`, { method: 'DELETE' })
	if (!res.ok) {
		return json({ error: 'failed' }, { status: 502 })
	}

	const account = getAccountFromCookies(cookies)
	if (account) {
		const expires = account.expires_at
			? new Date(account.expires_at)
			: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
		setAccountCookie(cookies, { ...account, deletionScheduledAt: null }, { secure: !dev, expires })
	}

	return json({ success: true })
}
