import type { Handle } from '@sveltejs/kit'
import { dev } from '$app/environment'
import { env } from '$env/dynamic/private'

/**
 * Baseline security headers for every response. The Content-Security-Policy
 * itself comes from SvelteKit (`kit.csp` in svelte.config.js), which only sets
 * it on pages.
 */
export const SECURITY_HEADERS: Readonly<Record<string, string>> = {
	'X-Content-Type-Options': 'nosniff',
	'Referrer-Policy': 'strict-origin-when-cross-origin',
	// Older browsers; modern ones use the CSP's frame-ancestors.
	'X-Frame-Options': 'DENY',
	'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
}

const DEFAULT_HSTS_MAX_AGE = 86_400

/**
 * HSTS value, or null outside production. Starts at a day; raise
 * HSTS_MAX_AGE to a year once HTTPS-only is confirmed. No includeSubDomains
 * or preload until every subdomain is known to be HTTPS-only.
 */
export function hstsHeader(isDev: boolean, rawMaxAge: string | undefined): string | null {
	if (isDev) return null
	const parsed = Number(rawMaxAge)
	const maxAge = Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_HSTS_MAX_AGE
	return `max-age=${maxAge}`
}

export function applySecurityHeaders(response: Response, hsts: string | null): Response {
	const headers: Record<string, string> = { ...SECURITY_HEADERS }
	if (hsts) headers['Strict-Transport-Security'] = hsts

	try {
		for (const [name, value] of Object.entries(headers)) {
			if (!response.headers.has(name)) response.headers.set(name, value)
		}
	} catch {
		// Responses passed straight through from fetch() have immutable headers.
	}
	return response
}

export const handleSecurityHeaders: Handle = async ({ event, resolve }) =>
	applySecurityHeaders(await resolve(event), hstsHeader(dev, env.HSTS_MAX_AGE))
