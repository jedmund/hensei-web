import type { Handle } from '@sveltejs/kit'
import { timingSafeEqual } from 'node:crypto'
import { isIP } from 'node:net'
import { env } from '$env/dynamic/private'
import { isPrivateAddress } from '$lib/server/ssrfGuard'

/**
 * Per-client-IP rate limits for server routes that call out on a visitor's
 * behalf (auth forms proxied to the API, link previews and their images), plus
 * the anonymous CSP violation report endpoint.
 *
 * The API sees these requests from this server's IP, so per-visitor limits
 * have to live here (hooks.server.ts also forwards the visitor's IP to the API
 * for its own limits). Counters are in memory, per instance.
 */

export interface RateLimiter {
	/** Records a hit for `key`; returns false once the limit is exceeded. */
	hit(key: string, now?: number): boolean
}

const MAX_KEYS = 10_000

export function createRateLimiter({
	limit,
	windowMs
}: {
	limit: number
	windowMs: number
}): RateLimiter {
	const windows = new Map<string, { count: number; resetAt: number }>()

	return {
		hit(key, now = Date.now()) {
			let entry = windows.get(key)
			if (!entry || entry.resetAt <= now) {
				if (windows.size >= MAX_KEYS) {
					for (const [k, v] of windows) if (v.resetAt <= now) windows.delete(k)
					if (windows.size >= MAX_KEYS) windows.clear()
				}
				entry = { count: 0, resetAt: now + windowMs }
				windows.set(key, entry)
			}
			entry.count += 1
			return entry.count <= limit
		}
	}
}

/** Strips brackets and ports from a forwarded address ("[::1]:80", "1.2.3.4:5678"). */
function normalizeAddress(raw: string): string {
	const value = raw.trim()
	const bracketed = value.match(/^\[([^\]]+)\](?::\d+)?$/)
	if (bracketed?.[1]) return bracketed[1]
	const v4WithPort = value.match(/^(\d+\.\d+\.\d+\.\d+):\d+$/)
	return v4WithPort?.[1] ?? value
}

function publicAddress(raw: string | null | undefined): string | null {
	if (!raw) return null
	const ip = normalizeAddress(raw)
	return isIP(ip) && !isPrivateAddress(ip) ? ip : null
}

/**
 * The visitor's IP as seen by Railway's edge, or null for requests that didn't
 * come through it (such as SvelteKit's internal fetches from form actions).
 *
 * Like Rails' remote_ip: walk X-Forwarded-For from the right and take the
 * first public address. Proxies append after the client's entry, so internal
 * hops (private/CGNAT addresses) are skipped and values a client prepends are
 * never reached. Falls back to X-Real-IP when X-Forwarded-For has none.
 */
export function edgeClientIp(request: Request): string | null {
	const hops = (request.headers.get('x-forwarded-for') ?? '').split(',')
	for (let i = hops.length - 1; i >= 0; i--) {
		const ip = publicAddress(hops[i])
		if (ip) return ip
	}
	return publicAddress(request.headers.get('x-real-ip'))
}

export interface OriginSecrets {
	current?: string | undefined
	previous?: string | undefined
}

function configuredOriginSecrets(): OriginSecrets {
	return {
		current: env.CLOUDFLARE_ORIGIN_SECRET,
		previous: env.CLOUDFLARE_ORIGIN_SECRET_PREVIOUS
	}
}

function secureEquals(a: string, b: string): boolean {
	const left = Buffer.from(a)
	const right = Buffer.from(b)
	return left.length === right.length && timingSafeEqual(left, right)
}

const WARN_INTERVAL_MS = 60_000
let lastMismatchWarning = 0

/**
 * Whether a request is trusted as having come through Cloudflare. Always true
 * when no origin secret is configured; otherwise X-Origin-Auth (added by a
 * Cloudflare Transform Rule) must match the current or previous secret.
 */
function fromCloudflare(request: Request, secrets: OriginSecrets): boolean {
	const expected = [secrets.current, secrets.previous].filter((s): s is string => !!s)
	if (expected.length === 0) return true

	const provided = request.headers.get('x-origin-auth')
	if (provided && expected.some((secret) => secureEquals(provided, secret))) return true

	const now = Date.now()
	if (now - lastMismatchWarning > WARN_INTERVAL_MS) {
		lastMismatchWarning = now
		console.warn('[client_ip] origin secret mismatch; falling back to forwarded address')
	}
	return false
}

/**
 * The visitor's real IP. Behind Cloudflare and Railway's edge, only Cloudflare's
 * CF-Connecting-IP carries it (X-Forwarded-For ends in rotating edge proxy
 * addresses), so prefer that when the request is trusted as coming from
 * Cloudflare, then fall back to edgeClientIp. Null for internal requests.
 */
export function clientIp(
	request: Request,
	secrets: OriginSecrets = configuredOriginSecrets()
): string | null {
	const cloudflareIp = publicAddress(request.headers.get('cf-connecting-ip'))
	if (cloudflareIp && fromCloudflare(request, secrets)) return cloudflareIp
	return edgeClientIp(request)
}

interface Rule {
	name: string
	methods: string[]
	path: RegExp
	limiter: RateLimiter
}

const MINUTE = 60_000

// Paths may carry a locale prefix (e.g. /ja/auth/login).
const route = (path: string) => new RegExp(`^(?:/[a-z]{2})?${path}/?$`)

export const RATE_LIMIT_RULES: Rule[] = [
	{
		name: 'login',
		methods: ['POST'],
		path: route('/auth/login'),
		limiter: createRateLimiter({ limit: 10, windowMs: MINUTE })
	},
	{
		name: 'signup',
		methods: ['POST'],
		path: route('/auth/(?:signup|register)'),
		limiter: createRateLimiter({ limit: 5, windowMs: MINUTE })
	},
	{
		name: 'password-reset',
		methods: ['POST'],
		path: route('/auth/(?:forgot-password|reset-password)'),
		limiter: createRateLimiter({ limit: 5, windowMs: MINUTE })
	},
	{
		name: 'link-preview',
		methods: ['GET'],
		path: route('/api/og'),
		limiter: createRateLimiter({ limit: 30, windowMs: MINUTE })
	},
	{
		name: 'link-preview-image',
		methods: ['GET'],
		path: route('/api/og/image'),
		limiter: createRateLimiter({ limit: 60, windowMs: MINUTE })
	},
	{
		name: 'csp-report',
		methods: ['POST'],
		path: route('/api/csp-report'),
		limiter: createRateLimiter({ limit: 30, windowMs: MINUTE })
	}
]

export function rateLimitResponse(
	request: Request,
	pathname: string,
	rules: Rule[] = RATE_LIMIT_RULES
): Response | null {
	const rule = rules.find((r) => r.methods.includes(request.method) && r.path.test(pathname))
	if (!rule) return null

	const ip = clientIp(request)
	if (!ip) return null

	if (rule.limiter.hit(`${rule.name}:${ip}`)) return null
	return new Response(JSON.stringify({ error: 'Too many requests. Please try again later.' }), {
		status: 429,
		headers: { 'Content-Type': 'application/json', 'Retry-After': '60' }
	})
}

export const handleRateLimit: Handle = async ({ event, resolve }) =>
	rateLimitResponse(event.request, event.url.pathname) ?? resolve(event)
