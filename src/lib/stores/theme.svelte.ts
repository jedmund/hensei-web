export type ThemePreference = 'system' | 'light' | 'dark'
export type ResolvedTheme = 'light' | 'dark'

class ThemeStore {
	#preference = $state<ThemePreference>('system')
	#resolved = $state<ResolvedTheme>('light')
	#initialized = false
	#mediaQuery: MediaQueryList | null = null

	get preference(): ThemePreference {
		return this.#preference
	}

	get resolved(): ResolvedTheme {
		return this.#resolved
	}

	/**
	 * Initialize the theme store with a preference (typically from user cookie/session)
	 * This should be called once on app startup from the root layout
	 */
	init(initial: ThemePreference = 'system') {
		if (typeof window === 'undefined') return

		if (this.#initialized) {
			// Re-apply if preference changed (e.g. after login)
			if (initial !== this.#preference) {
				this.setTheme(initial)
			}
			return
		}

		this.#initialized = true
		this.#preference = initial
		this.#resolved = this.#resolveTheme(initial)
		this.#applyTheme(this.#resolved)

		// Listen for system preference changes
		this.#mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
		this.#mediaQuery.addEventListener('change', this.#handleSystemChange)
	}

	/**
	 * Set the theme preference and apply it immediately
	 */
	setTheme(pref: ThemePreference) {
		this.#preference = pref
		this.#resolved = this.#resolveTheme(pref)
		this.#applyTheme(this.#resolved)
	}

	#resolveTheme(pref: ThemePreference): ResolvedTheme {
		if (pref === 'system') {
			return this.#getSystemTheme()
		}
		return pref
	}

	#getSystemTheme(): ResolvedTheme {
		if (typeof window === 'undefined') return 'light'
		return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
	}

	#applyTheme(theme: ResolvedTheme) {
		if (typeof document === 'undefined') return
		document.documentElement.setAttribute('data-theme', theme)
	}

	#handleSystemChange = (e: MediaQueryListEvent) => {
		if (this.#preference === 'system') {
			this.#resolved = e.matches ? 'dark' : 'light'
			this.#applyTheme(this.#resolved)
		}
	}
}

export const themeStore = new ThemeStore()
