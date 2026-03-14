import { getLocale } from '$lib/paraglide/runtime.js'
import type { LocalizedName } from '$lib/types/api/entities'

export type AppLocale = 'en' | 'ja'

/**
 * Get the current app locale as a typed value.
 */
export function appLocale(): AppLocale {
	return getLocale() as AppLocale
}

/**
 * Get the localized display name from a LocalizedName object.
 * Falls back to English if the current locale's value is empty.
 */
export function localizedName(name: LocalizedName | Partial<LocalizedName> | string | null | undefined): string {
	if (!name) return '—'
	if (typeof name === 'string') return name

	const locale = appLocale()
	return name[locale] || name.en || name.ja || '—'
}
