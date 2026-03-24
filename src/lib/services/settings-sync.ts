import { users } from '$lib/api/resources/users'
import { themeStore, type ThemePreference } from '$lib/stores/theme.svelte'
import { invalidateAll } from '$app/navigation'
import { localizeHref, deLocalizeHref } from '$lib/paraglide/runtime'
import type { UserCookie } from '$lib/types/UserCookie'

/**
 * Persist a theme change to DB + user cookie, then apply client-side.
 * No reload needed for theme changes.
 *
 * The caller applies the theme optimistically before calling this,
 * so on failure we revert to previousTheme.
 */
export async function syncTheme(
	userId: string,
	currentUserCookie: UserCookie,
	newTheme: ThemePreference,
	previousTheme: ThemePreference
) {
	try {
		await users.update(userId, { theme: newTheme })

		const updatedCookie: UserCookie = { ...currentUserCookie, theme: newTheme }
		const response = await fetch('/api/settings', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(updatedCookie)
		})

		if (!response.ok) {
			throw new Error(`/api/settings returned ${response.status}`)
		}

		themeStore.setTheme(newTheme)
	} catch (err) {
		console.error('Failed to persist theme:', err)
		themeStore.setTheme(previousTheme)
	}
}

/**
 * Persist a language change to DB + user cookie, then reload.
 * The /api/settings endpoint syncs PARAGLIDE_LOCALE automatically.
 *
 * On failure, does not reload — the page stays in the current language.
 */
export async function syncLanguage(
	userId: string,
	currentUserCookie: UserCookie,
	newLanguage: string
) {
	try {
		await users.update(userId, { language: newLanguage })

		const updatedCookie: UserCookie = { ...currentUserCookie, language: newLanguage }
		const response = await fetch('/api/settings', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(updatedCookie)
		})

		if (!response.ok) {
			throw new Error(`/api/settings returned ${response.status}`)
		}

		await invalidateAll()

		// Navigate to the re-localized URL so the locale prefix is correct
		// (e.g. /ja/teams → /teams when switching to English)
		const basePath = deLocalizeHref(
			window.location.pathname + window.location.search + window.location.hash
		)
		const newPath = localizeHref(basePath, { locale: newLanguage })
		window.location.href = newPath
	} catch (err) {
		console.error('Failed to persist language:', err)
	}
}
