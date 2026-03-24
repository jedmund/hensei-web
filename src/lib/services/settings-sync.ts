import { users } from '$lib/api/resources/users'
import { themeStore, type ThemePreference } from '$lib/stores/theme.svelte'
import { invalidateAll } from '$app/navigation'
import type { UserCookie } from '$lib/types/UserCookie'

/**
 * Persist a theme change to DB + user cookie, then apply client-side.
 * No reload needed for theme changes.
 */
export async function syncTheme(
	userId: string,
	currentUserCookie: UserCookie,
	newTheme: ThemePreference
) {
	await users.update(userId, { theme: newTheme })

	const updatedCookie: UserCookie = { ...currentUserCookie, theme: newTheme }
	await fetch('/api/settings', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(updatedCookie)
	})

	themeStore.setTheme(newTheme)
}

/**
 * Persist a language change to DB + user cookie, then reload.
 * The /api/settings endpoint syncs PARAGLIDE_LOCALE automatically.
 */
export async function syncLanguage(
	userId: string,
	currentUserCookie: UserCookie,
	newLanguage: string
) {
	await users.update(userId, { language: newLanguage })

	const updatedCookie: UserCookie = { ...currentUserCookie, language: newLanguage }
	await fetch('/api/settings', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(updatedCookie)
	})

	await invalidateAll()
	window.location.reload()
}
