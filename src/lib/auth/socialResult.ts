import { isSocialProvider, type SocialProvider } from './socialProviders'

/**
 * Query params the social login flow uses to report back to the page the
 * user lands on: the login page for sign-in errors, or the page the settings
 * modal was opened from for linking.
 */

export const SOCIAL_ERROR_PARAM = 'social_error'
export const SOCIAL_LINKED_PARAM = 'social_linked'
export const SOCIAL_PROVIDER_PARAM = 'social_provider'
/** Asks the navigation to open the settings modal on the Account section. */
export const OPEN_SETTINGS_PARAM = 'settings'

export const SOCIAL_ERROR_CODES = [
	'failed',
	'cancelled',
	'rate_limited',
	'expired',
	'identity_taken',
	'provider_already_linked'
] as const

export type SocialErrorCode = (typeof SOCIAL_ERROR_CODES)[number]

export function isSocialErrorCode(value: unknown): value is SocialErrorCode {
	return typeof value === 'string' && (SOCIAL_ERROR_CODES as readonly string[]).includes(value)
}

/** Appends params to a same-site path, keeping any query it already has. */
export function withParams(path: string, params: Record<string, string>): string {
	const url = new URL(path, 'http://localhost')
	for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value)
	return `${url.pathname}${url.search}${url.hash}`
}

export interface SettingsReturn {
	linked: SocialProvider | null
	error: SocialErrorCode | null
	provider: SocialProvider | null
}

/** Reads a "return to settings" result from a URL, or null if there is none. */
export function readSettingsReturn(url: URL): SettingsReturn | null {
	if (url.searchParams.get(OPEN_SETTINGS_PARAM) !== 'account') return null
	const linked = url.searchParams.get(SOCIAL_LINKED_PARAM)
	const error = url.searchParams.get(SOCIAL_ERROR_PARAM)
	const provider = url.searchParams.get(SOCIAL_PROVIDER_PARAM)
	return {
		linked: isSocialProvider(linked) ? linked : null,
		error: isSocialErrorCode(error) ? error : null,
		provider: isSocialProvider(provider) ? provider : isSocialProvider(linked) ? linked : null
	}
}

/** Strips the settings-return params so a reload doesn't reopen the modal. */
export function stripSettingsReturn(url: URL): URL {
	const clean = new URL(url)
	for (const key of [
		OPEN_SETTINGS_PARAM,
		SOCIAL_LINKED_PARAM,
		SOCIAL_ERROR_PARAM,
		SOCIAL_PROVIDER_PARAM
	]) {
		clean.searchParams.delete(key)
	}
	return clean
}
