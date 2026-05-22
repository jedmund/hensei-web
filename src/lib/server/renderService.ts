/**
 * Server-side image rendering via headless Chromium.
 *
 * A single Chromium process is kept warm across requests; each render spins up
 * a fresh context (cheap) inside that process. The browser idle-teardowns after
 * a quiet period so we don't pin ~300MB of RAM when nobody is hitting us.
 *
 * Outbound network from inside the browser is restricted via an allowlist —
 * this is the SSRF defense. Without it, a malicious `<img>` in any card
 * component would be enough to fetch AWS metadata, internal services, etc.
 */

import type { Browser, BrowserContext, Page } from 'playwright'
import { env } from '$env/dynamic/private'

/** How long the warm browser sits idle before we tear it down. */
const IDLE_TEARDOWN_MS = 10 * 60 * 1000

/**
 * Hostnames the rendered page is allowed to fetch resources from. Anything
 * else (including link-local + loopback) is blocked. Add new origins here as
 * cards start pulling assets from new CDNs.
 */
function buildAllowlist(): Set<string> {
	const allowed = new Set<string>()
	// Granblue CDN — character/weapon/summon imagery
	allowed.add('prd-game-a-granbluefantasy.akamaized.net')
	allowed.add('prd-game-a1-granbluefantasy.akamaized.net')

	// Our own static assets and SSR routes are served from PUBLIC_ORIGIN. In
	// dev this is the same host that's rendering, in prod it's granblue.team.
	const publicOrigin = env.PUBLIC_RENDER_ORIGIN ?? 'http://localhost:5174'
	try {
		allowed.add(new URL(publicOrigin).hostname)
	} catch {
		// PUBLIC_RENDER_ORIGIN was malformed — ignore; the page won't load.
	}

	// Allow the configured image CDN (PUBLIC_SIERO_IMG_URL) if set.
	const imgUrl = env.PUBLIC_SIERO_IMG_URL
	if (imgUrl) {
		try {
			allowed.add(new URL(imgUrl).hostname)
		} catch {
			// not a URL — probably empty string in dev
		}
	}
	return allowed
}

let browserPromise: Promise<Browser> | null = null
let idleTimer: ReturnType<typeof setTimeout> | null = null

async function launchBrowser(): Promise<Browser> {
	const { chromium } = await import('playwright')
	return chromium.launch({
		headless: true,
		// `--no-sandbox` is required when running in many container environments
		// (Railway included). The browser is only ever shown a server-rendered
		// page from our own origin, so the sandbox loss is acceptable.
		args: ['--no-sandbox', '--disable-dev-shm-usage']
	})
}

async function getBrowser(): Promise<Browser> {
	if (!browserPromise) {
		browserPromise = launchBrowser()
	}
	resetIdleTimer()
	return browserPromise
}

function resetIdleTimer(): void {
	if (idleTimer) clearTimeout(idleTimer)
	idleTimer = setTimeout(() => {
		teardown().catch((err) => {
			console.error('[renderService] idle teardown failed:', err)
		})
	}, IDLE_TEARDOWN_MS)
}

/** Tear down the warm browser. Idempotent; safe to call from shutdown hooks. */
export async function teardown(): Promise<void> {
	if (idleTimer) {
		clearTimeout(idleTimer)
		idleTimer = null
	}
	const browser = browserPromise ? await browserPromise.catch(() => null) : null
	browserPromise = null
	if (browser) {
		await browser.close().catch((err) => {
			console.error('[renderService] browser close failed:', err)
		})
	}
}

/**
 * Intercept every outbound request:
 * - drop anything not in the allowlist (SSRF defense),
 * - attach the internal-secret header **only** to requests bound for our own
 *   origin, never to allowlisted third-party CDNs.
 */
async function applyNetworkAllowlist(
	context: BrowserContext,
	allowlist: Set<string>,
	internalHostname: string,
	internalSecret: string
): Promise<void> {
	await context.route('**/*', (route) => {
		const url = new URL(route.request().url())
		if (!allowlist.has(url.hostname)) {
			route.abort('blockedbyclient').catch(() => {})
			return
		}
		if (url.hostname === internalHostname) {
			const headers = { ...route.request().headers(), 'x-render-secret': internalSecret }
			route.continue({ headers }).catch(() => {
				/* navigation may have moved on already */
			})
			return
		}
		route.continue().catch(() => {})
	})
}

export type RenderFormat = 'png' | 'jpeg'

export interface RenderOptions {
	/** Internal SSR path the renderer should screenshot, e.g. `/_render/...`. */
	path: string
	/** Output viewport. Output image dimensions match. */
	viewport: { width: number; height: number }
	/**
	 * CSS selector for the element to screenshot. Defaults to `main > *:first-child`
	 * so cards can be wrapped in a `<main>` without page chrome leaking in.
	 */
	selector?: string
	/** Soft cap on a single render's wall time. Default 15s. */
	timeoutMs?: number
	/** Output format. Defaults to PNG. */
	format?: RenderFormat
	/** JPEG quality (1–100). Ignored when `format` is `png`. Default 88. */
	jpegQuality?: number
}

/**
 * Render an internal SSR path to an image buffer (PNG or JPEG).
 *
 * Callers MUST pass an internal path (loopback / same-origin), never a URL
 * that comes from request input — the registry is the only sanctioned source.
 *
 * The function adds the `X-Render-Secret` header on its own so the locked-down
 * `_render` layout will accept the request.
 */
export async function renderToImage(opts: RenderOptions): Promise<Buffer> {
	const {
		path,
		viewport,
		selector = 'main > *:first-child',
		timeoutMs = 15_000,
		format = 'png',
		jpegQuality = 88
	} = opts

	const secret = env.RENDER_INTERNAL_SECRET
	if (!secret) {
		throw new Error(
			'RENDER_INTERNAL_SECRET is not set. The render service cannot authenticate against the internal _render routes.'
		)
	}

	const origin = env.PUBLIC_RENDER_ORIGIN ?? 'http://localhost:5174'
	const url = `${origin.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`
	const internalHostname = new URL(origin).hostname

	const browser = await getBrowser()
	const context = await browser.newContext({
		viewport,
		deviceScaleFactor: 2 // sharp output on retina-class displays
	})

	let page: Page | null = null
	try {
		await applyNetworkAllowlist(context, buildAllowlist(), internalHostname, secret)
		page = await context.newPage()
		await page.goto(url, { waitUntil: 'networkidle', timeout: timeoutMs })
		const locator = page.locator(selector).first()
		const buffer =
			format === 'jpeg'
				? await locator.screenshot({ type: 'jpeg', quality: jpegQuality, timeout: timeoutMs })
				: await locator.screenshot({ type: 'png', timeout: timeoutMs })
		return buffer
	} finally {
		await context.close().catch(() => {})
		resetIdleTimer()
	}
}
