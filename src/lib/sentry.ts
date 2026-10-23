// Shared Sentry options for the SvelteKit client and server SDKs.
//
// Kept quiet by default: performance traces are sampled, and benign
// browser/network noise is dropped. Session Replay is intentionally not
// enabled. The SDK is only initialized when PUBLIC_SENTRY_DSN is set (see the
// client/server hooks), so dev/test stay silent without any extra gating.

// 1% keeps tracing inside Sentry's free quota. The API follows this decision
// for requests the web app traces (see its traces_sampler).
export const SENTRY_TRACES_SAMPLE_RATE = 0.01

// Expected / noisy errors that should never be reported as bugs. Matched
// against the error message; works on both client and server.
export const SENTRY_IGNORE_ERRORS: (string | RegExp)[] = [
	// Benign browser noise
	'ResizeObserver loop limit exceeded',
	'ResizeObserver loop completed with undelivered notifications.',
	'Non-Error promise rejection captured',
	// Transient network failures / user-aborted navigations and fetches
	'NetworkError when attempting to fetch resource.',
	'Failed to fetch',
	'Load failed',
	'AbortError',
	'The operation was aborted.',
	// Injected by browser extensions / third-party scripts, not our bundle
	"Can't find variable: require",
	'require is not defined',
	// A tab still running the previous deploy requests chunks that no longer
	// exist. The client reloads on vite:preloadError (hooks.client.ts).
	'Importing a module script failed.',
	'error loading dynamically imported module',
	'Failed to fetch dynamically imported module',
	'Unable to preload CSS'
]

// Drops errors that are normal app flow rather than bugs, used by each hook's
// `beforeSend` (and so it catches load auto-instrumentation captures too, not
// just handleError). Covers:
//   - requests cancelled when the user navigates away (status 0 / AbortError)
//   - expected HTTP responses surfaced from `load` (404/401/403/…). SvelteKit's
//     HttpError carries { status, body }; our ApiError carries { status }.
export function isExpectedError(err: unknown): boolean {
	if (err == null || typeof err !== 'object') return false

	const e = err as { status?: unknown; name?: unknown; message?: unknown; body?: unknown }
	const status = typeof e.status === 'number' ? e.status : undefined
	const name = typeof e.name === 'string' ? e.name : ''
	const message = typeof e.message === 'string' ? e.message : ''
	// Loads rethrow API failures as SvelteKit HttpErrors, which keep the
	// original message in body.message (a cancelled request becomes a 502).
	const body = e.body as { message?: unknown } | undefined
	const bodyMessage = typeof body?.message === 'string' ? body.message : ''

	if (status === 0 || name === 'AbortError' || /cancell?ed|abort/i.test(message)) return true
	if (/cancell?ed|abort/i.test(bodyMessage)) return true
	if (status !== undefined && status >= 400 && status < 500) return true

	return false
}

// Browser-extension frames that inject errors we can't act on. Client-only
// (matched against frame URLs via denyUrls).
export const SENTRY_DENY_URLS: RegExp[] = [
	/^chrome-extension:\/\//,
	/^moz-extension:\/\//,
	/extensions\//i
]

interface StackFrameLike {
	filename?: string
	abs_path?: string
}

interface EventLike {
	exception?: { values?: Array<{ stacktrace?: { frames?: StackFrameLike[] } }> }
}

// Errors thrown only from code pasted into the devtools console or evaluated
// by an extension: every frame is `<anonymous>`, so none of it is our bundle.
export function isInjectedScriptError(event: EventLike): boolean {
	const frames = (event.exception?.values ?? []).flatMap((v) => v.stacktrace?.frames ?? [])
	if (frames.length === 0) return false
	return frames.every((f) => (f.filename ?? f.abs_path) === '<anonymous>')
}
