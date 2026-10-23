import type { HandleServerError } from '@sveltejs/kit'

/**
 * Logs an uncaught server error, like Sentry's default handler, except for
 * 4xx errors. Those are client mistakes (mostly bots probing for paths such as
 * /.git/config), which Sentry already doesn't report; logging a full stack for
 * each one floods the logs past Railway's rate limit and drops real lines.
 * Railway's HTTP logs still record every request and its status.
 */
export const logServerError: HandleServerError = ({ error, status }) => {
	if (status >= 400 && status < 500) return

	let e: unknown = error
	while (e instanceof Error) {
		if (e.stack) console.error(e.stack)
		e = e.cause
	}
	if (e) console.error(String(e))
}
