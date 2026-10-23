const BASE = 'http://localhost'

/**
 * Returns `next` if it is a same-site path (e.g. a `?next=` param after login),
 * otherwise `fallback`. Blocks absolute and protocol-relative URLs, plus
 * backslashes and control characters that browsers normalize into `//host`.
 */
export function safeRedirectPath(next: string | null | undefined, fallback = '/me'): string {
	if (!next || !next.startsWith('/') || next.startsWith('//')) return fallback
	// eslint-disable-next-line no-control-regex
	if (/[\\\x00-\x1f\x7f]/.test(next)) return fallback

	try {
		const url = new URL(next, BASE)
		if (url.origin !== BASE) return fallback
		return `${url.pathname}${url.search}${url.hash}`
	} catch {
		return fallback
	}
}
