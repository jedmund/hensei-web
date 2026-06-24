// Shared Sentry options for the SvelteKit client and server SDKs.
//
// Kept quiet by default: performance traces are sampled, and benign
// browser/network noise is dropped. Session Replay is intentionally not
// enabled. The SDK is only initialized when PUBLIC_SENTRY_DSN is set (see the
// client/server hooks), so dev/test stay silent without any extra gating.

export const SENTRY_TRACES_SAMPLE_RATE = 0.1

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
	'The operation was aborted.'
]

// Browser-extension frames that inject errors we can't act on. Client-only
// (matched against frame URLs via denyUrls).
export const SENTRY_DENY_URLS: RegExp[] = [
	/^chrome-extension:\/\//,
	/^moz-extension:\/\//,
	/extensions\//i
]
