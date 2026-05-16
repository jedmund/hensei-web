/**
 * Guard for the internal `_render/*` route family.
 *
 * These routes render bare card components meant only for the Playwright
 * service to screenshot. They have no nav, no auth, and may surface data
 * with weaker isolation than the public-facing app, so we hide them behind a
 * shared-secret header. Direct browser hits return 404 — not 403 — so we
 * don't even hint at the routes' existence.
 */

import { error } from '@sveltejs/kit'
import { env } from '$env/dynamic/private'
import type { LayoutServerLoad } from './$types'

const LOOPBACK_HOSTS = new Set(['127.0.0.1', '::1', 'localhost'])

export const load: LayoutServerLoad = async ({ request, getClientAddress }) => {
	const expected = env.RENDER_INTERNAL_SECRET
	if (!expected) {
		// Failing closed if the secret isn't configured: this prevents the route
		// from being accidentally open in environments that forgot to set it.
		throw error(404, 'Not Found')
	}

	const provided = request.headers.get('x-render-secret')
	if (provided && provided === expected) {
		return {}
	}

	// Loopback fallback so a developer can manually open the route in a browser
	// during development without juggling headers. Disabled in production.
	if (process.env.NODE_ENV !== 'production') {
		const clientAddr = (() => {
			try {
				return getClientAddress()
			} catch {
				return ''
			}
		})()
		if (LOOPBACK_HOSTS.has(clientAddr)) {
			return {}
		}
	}

	throw error(404, 'Not Found')
}
