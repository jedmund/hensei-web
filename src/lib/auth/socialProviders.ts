/**
 * Social login providers shared by the server routes and the UI.
 *
 * PUBLIC_SOCIAL_LOGIN_PROVIDERS (e.g. "discord,google") is the feature flag:
 * only the providers it lists get buttons and start routes. Unset or empty
 * means social login is off.
 */

export const SOCIAL_PROVIDERS = ['discord', 'google', 'apple'] as const

export type SocialProvider = (typeof SOCIAL_PROVIDERS)[number]

/** Brand names are never translated. */
export const SOCIAL_PROVIDER_LABELS: Record<SocialProvider, string> = {
	discord: 'Discord',
	google: 'Google',
	apple: 'Apple'
}

export function isSocialProvider(value: unknown): value is SocialProvider {
	return typeof value === 'string' && (SOCIAL_PROVIDERS as readonly string[]).includes(value)
}

/**
 * Parses the comma-separated flag into known providers, in the order listed,
 * without duplicates. Unknown names are ignored.
 */
export function parseSocialProviders(raw: string | null | undefined): SocialProvider[] {
	if (!raw) return []
	const providers: SocialProvider[] = []
	for (const part of raw.split(',')) {
		const name = part.trim().toLowerCase()
		if (isSocialProvider(name) && !providers.includes(name)) providers.push(name)
	}
	return providers
}
