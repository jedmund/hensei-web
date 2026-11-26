/**
 * The API mounts its routes at /api/v1 in development and /v1 in production.
 * Development APIs run on the developer's machine or local network, so a local
 * host means /api/v1 and anything else is treated as a deployed API.
 */
export function apiPathFor(baseUrl: string): '/v1' | '/api/v1' {
	let hostname: string
	try {
		hostname = new URL(baseUrl).hostname.toLowerCase()
	} catch {
		return '/api/v1'
	}
	return isLocalHost(hostname) ? '/api/v1' : '/v1'
}

function isLocalHost(hostname: string): boolean {
	const host = hostname.replace(/^\[|\]$/g, '')
	if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) return true
	if (host === '::1') return true
	if (/^f[cd][0-9a-f]{2}:/.test(host) || /^fe80:/.test(host)) return true

	const octets = host.split('.').map(Number)
	if (octets.length !== 4 || octets.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
		return false
	}
	const [a, b] = octets as [number, number, number, number]
	return (
		a === 127 ||
		a === 10 ||
		a === 0 ||
		(a === 172 && b >= 16 && b <= 31) ||
		(a === 192 && b === 168) ||
		(a === 169 && b === 254)
	)
}
