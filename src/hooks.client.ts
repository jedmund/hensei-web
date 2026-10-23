import { env } from '$env/dynamic/public'
import { handleErrorWithSentry, init } from '@sentry/sveltekit'
import { z } from 'zod'
import {
	isExpectedError,
	isInjectedScriptError,
	SENTRY_DENY_URLS,
	SENTRY_IGNORE_ERRORS,
	SENTRY_TRACES_SAMPLE_RATE
} from '$lib/sentry'

// Zod's JIT probes for `new Function`, which the Content-Security-Policy
// blocks (and reports) since it allows no eval. Validate without it.
z.config({ jitless: true })

// Only initialize when a DSN is configured. With no DSN (dev/test, or before
// it's set in an environment) the SDK never starts, so there's nothing to
// send and no noise.
if (env.PUBLIC_SENTRY_DSN) {
	init({
		dsn: env.PUBLIC_SENTRY_DSN,
		environment: env.PUBLIC_SENTRY_ENVIRONMENT || 'production',
		tracesSampleRate: SENTRY_TRACES_SAMPLE_RATE,
		ignoreErrors: SENTRY_IGNORE_ERRORS,
		denyUrls: SENTRY_DENY_URLS,
		beforeSend: (event, hint) =>
			isExpectedError(hint?.originalException) || isInjectedScriptError(event) ? null : event
	})
}

// After a deploy, a tab still running the old build asks for chunks that no
// longer exist. Reload once to pick up the new build instead of failing the
// navigation. The timestamp guard stops a reload loop if the chunk is really
// missing.
const RELOAD_KEY = 'hensei:chunk-reload-at'
window.addEventListener('vite:preloadError', (event) => {
	try {
		const last = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0)
		if (Date.now() - last < 10_000) return
		sessionStorage.setItem(RELOAD_KEY, String(Date.now()))
	} catch {
		// Without storage there's no loop guard, so let the error surface.
		return
	}
	event.preventDefault()
	window.location.reload()
})

// Reports uncaught client errors to Sentry, then falls through to SvelteKit's
// default (which renders +error.svelte). No-op when the SDK isn't initialized.
export const handleError = handleErrorWithSentry()
