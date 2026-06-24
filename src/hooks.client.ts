import { env } from '$env/dynamic/public'
import { handleErrorWithSentry, init } from '@sentry/sveltekit'
import { SENTRY_DENY_URLS, SENTRY_IGNORE_ERRORS, SENTRY_TRACES_SAMPLE_RATE } from '$lib/sentry'

// Only initialize when a DSN is configured. With no DSN (dev/test, or before
// it's set in an environment) the SDK never starts, so there's nothing to
// send and no noise.
if (env.PUBLIC_SENTRY_DSN) {
	init({
		dsn: env.PUBLIC_SENTRY_DSN,
		environment: env.PUBLIC_SENTRY_ENVIRONMENT || 'production',
		tracesSampleRate: SENTRY_TRACES_SAMPLE_RATE,
		ignoreErrors: SENTRY_IGNORE_ERRORS,
		denyUrls: SENTRY_DENY_URLS
	})
}

// Reports uncaught client errors to Sentry, then falls through to SvelteKit's
// default (which renders +error.svelte). No-op when the SDK isn't initialized.
export const handleError = handleErrorWithSentry()
