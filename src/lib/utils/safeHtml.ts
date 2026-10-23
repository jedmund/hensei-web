const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'mailto:'])
const WEB_PROTOCOLS = new Set(['http:', 'https:'])

export function escapeHtml(input: unknown): string {
	if (typeof input !== 'string') return ''
	return input
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;')
}

/**
 * Returns an href safe to interpolate into an `<a href="…">` attribute.
 * Allow-list: absolute http(s)/mailto URLs, in-page anchors, root-relative paths.
 * Anything else (javascript:, data:, vbscript:, protocol-relative //, etc.) returns '#'.
 * The returned value is HTML-attribute-escaped.
 */
export function safeHref(raw: unknown): string {
	if (typeof raw !== 'string') return '#'
	const trimmed = raw.trim()
	if (!trimmed) return '#'

	if (trimmed.startsWith('#')) return escapeHtml(trimmed)
	if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return escapeHtml(trimmed)

	try {
		const url = new URL(trimmed)
		if (SAFE_PROTOCOLS.has(url.protocol)) return escapeHtml(url.toString())
	} catch {
		// not a parseable absolute URL
	}

	return '#'
}

/**
 * True for an absolute http(s) URL. Uses the WHATWG parser, so obfuscated
 * schemes (embedded tabs/newlines, mixed case) are judged as browsers see them.
 */
export function isHttpUrl(raw: unknown): boolean {
	if (typeof raw !== 'string' || !raw.trim()) return false
	try {
		return WEB_PROTOCOLS.has(new URL(raw.trim()).protocol)
	} catch {
		return false
	}
}
