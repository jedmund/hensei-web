import { untrack } from 'svelte'
import { page } from '$app/state'
import { replaceState } from '$app/navigation'
import {
	readSettingsReturn,
	stripSettingsReturn,
	type SettingsReturn
} from '$lib/auth/socialResult'

/**
 * Opens the settings modal on the Account section when the URL carries a
 * social linking result (after returning from a provider, or after the
 * log-in-to-link prompt), then removes those params so a reload doesn't
 * reopen it.
 */
export function useSettingsReturn(
	isAuthenticated: () => boolean,
	openSettings: (result: SettingsReturn) => void
) {
	$effect(() => {
		if (!isAuthenticated()) return
		const result = readSettingsReturn(page.url)
		if (!result) return

		untrack(() => {
			openSettings(result)
			const clean = stripSettingsReturn(page.url)
			const state = page.state
			// On first load this effect can run while the router is still
			// hydrating, when replaceState throws; wait for it to finish.
			setTimeout(() => {
				try {
					replaceState(clean, state)
				} catch {
					// Still not ready: the params stay in the URL, which is harmless.
				}
			}, 0)
		})
	})
}
