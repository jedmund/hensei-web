/**
 * Mock for $lib/stores/auth.store.svelte
 * Used in adapter tests to avoid Svelte runes dependency
 */

export const authStore = {
	accessToken: null,
	refreshToken: null,
	user: null,
	expiresAt: null,
	isRefreshing: false,
	isAuthenticated: false,
	setTokens() {},
	setUser() {},
	clear() {},
	get isExpired() {
		return true
	}
}
