import type { Handle } from '@sveltejs/kit'

/**
 * Per-client-IP rate limits for server routes that call out on a visitor's
 * behalf (auth forms proxied to the API, link previews).
 *
 * The API sees these requests from this server's IP, so per-visitor limits
 * have to live here. Counters are in memory, per instance.
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

/**
 * The visitor's IP as recorded by Railway's edge proxy: the rightmost
 * X-Forwarded-For entry (clients can prepend values but not append). Returns
 * null for requests that didn't come through the edge, such as SvelteKit's
 * internal fetches from form actions.
 */
export function edgeClientIp(request: Request): string | null {
	const forwarded = request.headers.get('x-forwarded-for')
	if (!forwarded) return null
	const last = forwarded.split(',').pop()?.trim()
	return last || null
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
	}
]

export function rateLimitResponse(
	request: Request,
	pathname: string,
	rules: Rule[] = RATE_LIMIT_RULES
): Response | null {
	const rule = rules.find((r) => r.methods.includes(request.method) && r.path.test(pathname))
	if (!rule) return null

	const ip = edgeClientIp(request)
	if (!ip) return null

	if (rule.limiter.hit(`${rule.name}:${ip}`)) return null
	return new Response(JSON.stringify({ error: 'Too many requests. Please try again later.' }), {
		status: 429,
		headers: { 'Content-Type': 'application/json', 'Retry-After': '60' }
	})
}

export const handleRateLimit: Handle = async ({ event, resolve }) =>
	rateLimitResponse(event.request, event.url.pathname) ?? resolve(event)
