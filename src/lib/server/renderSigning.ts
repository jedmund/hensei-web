/**
 * HMAC signing for public render URLs.
 *
 * Crawler-facing og:image URLs are signed server-side using a shared secret.
 * The signature covers the template name, all relevant params, and a version
 * stamp so that an attacker can't forge a URL that points the renderer at
 * arbitrary content or another user's identity.
 */

import { createHmac, timingSafeEqual } from 'node:crypto'
import { env } from '$env/dynamic/private'

/** Query-string keys reserved by the signing layer; never used for content. */
const SIGNATURE_PARAM = 'sig'
export const VERSION_PARAM = 'v'

function getSecret(): string {
	const secret = env.RENDER_HMAC_SECRET
	if (!secret) {
		throw new Error(
			'RENDER_HMAC_SECRET is not set. Configure it in the environment before signing or verifying render URLs.'
		)
	}
	return secret
}

/**
 * Build the canonical string fed to HMAC. Params are sorted by key so the same
 * logical request always produces the same signature regardless of the order
 * the caller passes things in.
 */
function canonicalize(
	template: string,
	params: Record<string, string>,
	version: string | number
): string {
	const kvPairs = Object.entries(params)
		.filter(([, v]) => v !== undefined && v !== null && v !== '')
		.map(([k, v]) => `${k}=${v}`)
		.sort()
	return [template, kvPairs.join('&'), `v=${version}`].join('|')
}

/**
 * Generate an HMAC-SHA256 signature for a template + params + version triple.
 * Returns the hex-encoded digest.
 */
export function signRenderRequest(
	template: string,
	params: Record<string, string>,
	version: string | number
): string {
	const canonical = canonicalize(template, params, version)
	return createHmac('sha256', getSecret()).update(canonical).digest('hex')
}

/**
 * Verify a signature in constant time. Returns true only when the provided
 * signature matches the regenerated one.
 *
 * Callers must pass the same `params` map they would use to sign (so anything
 * that affects the rendered output must be in there).
 */
export function verifyRenderRequest(
	template: string,
	params: Record<string, string>,
	version: string | number,
	signature: string
): boolean {
	const expected = signRenderRequest(template, params, version)
	if (expected.length !== signature.length) return false
	try {
		return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'))
	} catch {
		// Buffer.from on bad hex returns shorter than expected → timingSafeEqual throws.
		return false
	}
}

/**
 * Append signing query params (`v` + `sig`) to a URL. Mutates a URLSearchParams
 * via `set` so it overwrites any existing values.
 */
export function appendRenderSignature(
	url: URL,
	template: string,
	params: Record<string, string>,
	version: string | number
): URL {
	const signed = new URL(url.toString())
	signed.searchParams.set(VERSION_PARAM, String(version))
	signed.searchParams.set(SIGNATURE_PARAM, signRenderRequest(template, params, version))
	return signed
}

/**
 * Pull the `sig` and `v` params out of a URL's query string. Both must be
 * present for a request to be considered signed.
 */
export function extractRenderSignature(searchParams: URLSearchParams): {
	signature: string | null
	version: string | null
} {
	return {
		signature: searchParams.get(SIGNATURE_PARAM),
		version: searchParams.get(VERSION_PARAM)
	}
}
