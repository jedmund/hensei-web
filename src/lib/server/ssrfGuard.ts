import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'

/**
 * Guards server-side fetches of user-supplied URLs (e.g. link previews) so
 * they can't reach loopback, private-network or Railway-internal services.
 *
 * DNS is resolved before each request and every redirect hop is re-checked.
 * The fetch itself resolves again, so a DNS-rebinding host could still slip
 * through between the check and the request; this blocks the direct cases.
 */

export class BlockedUrlError extends Error {
	constructor(reason: string) {
		super(`Blocked URL: ${reason}`)
		this.name = 'BlockedUrlError'
	}
}

type Resolver = (hostname: string) => Promise<string[]>

const defaultResolver: Resolver = async (hostname) =>
	(await lookup(hostname, { all: true, verbatim: true })).map((entry) => entry.address)

const BLOCKED_HOST_SUFFIXES = ['.internal', '.local', '.localhost']
const ALLOWED_PORTS = new Set(['', '80', '443'])

function ipv4Octets(ip: string): number[] | null {
	const parts = ip.split('.')
	if (parts.length !== 4) return null
	const octets = parts.map((p) => (/^\d{1,3}$/.test(p) ? Number(p) : NaN))
	return octets.every((o) => o >= 0 && o <= 255) ? octets : null
}

function isPrivateIpv4(ip: string): boolean {
	const o = ipv4Octets(ip)
	if (!o) return true
	const [a, b] = o as [number, number, number, number]
	return (
		a === 0 || // "this" network
		a === 10 ||
		a === 127 ||
		(a === 100 && b >= 64 && b <= 127) || // CGNAT
		(a === 169 && b === 254) || // link-local / cloud metadata
		(a === 172 && b >= 16 && b <= 31) ||
		(a === 192 && b === 0 && o[2] === 0) ||
		(a === 192 && b === 168) ||
		(a === 198 && (b === 18 || b === 19)) || // benchmarking
		a >= 224 // multicast and reserved
	)
}

/** Expands an IPv6 address into 8 hextets, or null if it can't be parsed. */
function ipv6Hextets(ip: string): number[] | null {
	let address = ip.toLowerCase().split('%')[0] ?? ''
	// Embedded IPv4 tail (e.g. ::ffff:127.0.0.1)
	const v4Match = address.match(/^(.*:)(\d+\.\d+\.\d+\.\d+)$/)
	if (v4Match) {
		const o = ipv4Octets(v4Match[2] ?? '')
		if (!o) return null
		address = `${v4Match[1]}${((o[0]! << 8) | o[1]!).toString(16)}:${((o[2]! << 8) | o[3]!).toString(16)}`
	}
	const halves = address.split('::')
	if (halves.length > 2) return null
	const head = halves[0] ? halves[0].split(':') : []
	const tail = halves.length === 2 && halves[1] ? halves[1].split(':') : []
	const missing = 8 - head.length - tail.length
	if (halves.length === 1 ? missing !== 0 : missing < 1) return null
	const groups = [...head, ...Array(halves.length === 2 ? missing : 0).fill('0'), ...tail]
	const values = groups.map((g) => (/^[0-9a-f]{1,4}$/.test(g) ? parseInt(g, 16) : NaN))
	return values.every((v) => !Number.isNaN(v)) ? values : null
}

function isPrivateIpv6(ip: string): boolean {
	const h = ipv6Hextets(ip)
	if (!h) return true
	const embeddedV4 = () => `${h[6]! >> 8}.${h[6]! & 0xff}.${h[7]! >> 8}.${h[7]! & 0xff}`

	if (h.slice(0, 7).every((v) => v === 0) && (h[7] === 0 || h[7] === 1)) return true // :: and ::1
	if (h.slice(0, 5).every((v) => v === 0) && h[5] === 0xffff) return isPrivateIpv4(embeddedV4()) // IPv4-mapped
	if (h[0] === 0x64 && h[1] === 0xff9b) return isPrivateIpv4(embeddedV4()) // NAT64
	if ((h[0]! & 0xfe00) === 0xfc00) return true // unique local fc00::/7
	if ((h[0]! & 0xffc0) === 0xfe80) return true // link-local fe80::/10
	if ((h[0]! & 0xff00) === 0xff00) return true // multicast
	return false
}

/** True for loopback, private, link-local, CGNAT, multicast and other non-public addresses. */
export function isPrivateAddress(ip: string): boolean {
	const version = isIP(ip)
	if (version === 4) return isPrivateIpv4(ip)
	if (version === 6) return isPrivateIpv6(ip)
	return true
}

/**
 * Parses `raw` and throws BlockedUrlError unless it is an http(s) URL on a
 * default port whose host resolves only to public addresses.
 */
export async function assertPublicHttpUrl(
	raw: string | URL,
	resolve: Resolver = defaultResolver
): Promise<URL> {
	let url: URL
	try {
		url = new URL(raw)
	} catch {
		throw new BlockedUrlError('invalid URL')
	}

	if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new BlockedUrlError('protocol')
	if (!ALLOWED_PORTS.has(url.port)) throw new BlockedUrlError('port')
	if (url.username || url.password) throw new BlockedUrlError('credentials')

	const hostname = url.hostname
		.replace(/^\[|\]$/g, '')
		.replace(/\.$/, '')
		.toLowerCase()
	if (hostname === 'localhost' || BLOCKED_HOST_SUFFIXES.some((s) => hostname.endsWith(s))) {
		throw new BlockedUrlError('host')
	}

	let addresses: string[]
	if (isIP(hostname)) {
		addresses = [hostname]
	} else {
		try {
			addresses = await resolve(hostname)
		} catch {
			throw new BlockedUrlError('unresolvable host')
		}
	}

	if (addresses.length === 0 || addresses.some(isPrivateAddress)) {
		throw new BlockedUrlError('non-public address')
	}
	return url
}

/**
 * fetch() for user-supplied URLs: validates the URL and each redirect target
 * with assertPublicHttpUrl, following at most `maxRedirects` redirects.
 */
export async function fetchPublicUrl(
	raw: string,
	init: RequestInit = {},
	{
		maxRedirects = 3,
		resolve = defaultResolver
	}: { maxRedirects?: number; resolve?: Resolver } = {}
): Promise<Response> {
	let current = await assertPublicHttpUrl(raw, resolve)

	for (let hop = 0; ; hop++) {
		const res = await fetch(current, { ...init, redirect: 'manual' })
		const location = res.headers.get('location')
		if (res.status < 300 || res.status >= 400 || !location) return res

		if (hop >= maxRedirects) throw new BlockedUrlError('too many redirects')
		await res.body?.cancel()
		current = await assertPublicHttpUrl(new URL(location, current), resolve)
	}
}
