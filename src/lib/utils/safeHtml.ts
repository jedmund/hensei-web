const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'mailto:'])

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
