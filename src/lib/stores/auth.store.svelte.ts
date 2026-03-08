import { browser } from '$app/environment'

interface UserInfo {
	id: string
	username: string
	email?: string
	avatarUrl?: string
}

interface AuthState {
	accessToken: string | null
	refreshToken: string | null
	user: UserInfo | null
	expiresAt: Date | null
	isRefreshing: boolean
	isAuthenticated: boolean
}

class AuthStore {
	accessToken = $state<string | null>(null)
	refreshToken = $state<string | null>(null) // Always null — managed via httpOnly cookie
	user = $state<UserInfo | null>(null)
	expiresAt = $state<Date | null>(null)
	isRefreshing = $state(false)

	get isAuthenticated(): boolean {
		return !!this.accessToken && !!this.user
	}

	private refreshPromise: Promise<boolean> | null = null

	setAuth(accessToken: string, user: UserInfo, expiresIn: number) {
		this.accessToken = accessToken
		this.refreshToken = null
		this.user = user
		this.expiresAt = new Date(Date.now() + expiresIn * 1000)
		this.isRefreshing = false
	}

	clearAuth() {
		this.accessToken = null
		this.refreshToken = null
		this.user = null
		this.expiresAt = null
		this.isRefreshing = false
	}

	getToken(): string | null {
		// Check if token is expired
		if (this.expiresAt && new Date() >= this.expiresAt) {
			// Token expired, trigger refresh
			if (browser && !this.isRefreshing) {
				this.refresh()
			}
			return null
		}

		return this.accessToken
	}

	async refresh(): Promise<boolean> {
		// Single in-flight refresh management
		if (this.refreshPromise) {
			return this.refreshPromise
		}

		this.isRefreshing = true

		this.refreshPromise = fetch(`/auth/refresh`, {
			method: 'POST',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			}
		})
			.then(async (res) => {
				if (!res.ok) {
					throw new Error('Failed to refresh token')
				}

				const data = await res.json()
				this.setAuth(data.access_token, data.user, data.expires_in)
				return true
			})
			.catch((error) => {
				if (import.meta.env.DEV) console.error('Token refresh failed:', error)
				this.clearAuth()

				if (browser) {
					window.location.href = '/auth/login'
				}

				return false
			})
			.finally(() => {
				this.refreshPromise = null
				this.isRefreshing = false
			})

		return this.refreshPromise
	}

	async checkAndRefresh(): Promise<string | null> {
		if (!this.accessToken) {
			return null
		}

		// Check if we need to refresh (within 5 minutes of expiry)
		if (this.expiresAt) {
			const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000)

			if (fiveMinutesFromNow >= this.expiresAt) {
				const refreshed = await this.refresh()
				if (refreshed) {
					return this.accessToken
				}
				return null
			}
		}

		return this.accessToken
	}

	initFromServer(
		accessToken: string | null,
		user: UserInfo | null,
		expiresAt: string | null
	) {
		if (accessToken && user && expiresAt) {
			this.accessToken = accessToken
			this.refreshToken = null
			this.user = user
			this.expiresAt = new Date(expiresAt)
			this.isRefreshing = false
		} else {
			this.clearAuth()
		}
	}
}

export type { UserInfo, AuthState }
export const authStore = new AuthStore()
