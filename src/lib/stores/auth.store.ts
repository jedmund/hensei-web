import { writable, get } from 'svelte/store'
import { browser } from '$app/environment'
import { PUBLIC_SIERO_API_URL } from '$env/static/public'

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

function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>({
    accessToken: null,
    refreshToken: null,
    user: null,
    expiresAt: null,
    isRefreshing: false,
    isAuthenticated: false
  })

  let refreshPromise: Promise<boolean> | null = null

  return {
    subscribe,

    setAuth: (accessToken: string, user: UserInfo, expiresIn: number) => {
      const expiresAt = new Date(Date.now() + expiresIn * 1000)
      set({
        accessToken,
        refreshToken: null, // Managed via httpOnly cookie
        user,
        expiresAt,
        isRefreshing: false,
        isAuthenticated: true
      })
    },

    clearAuth: () => {
      set({
        accessToken: null,
        refreshToken: null,
        user: null,
        expiresAt: null,
        isRefreshing: false,
        isAuthenticated: false
      })
    },

    getToken: (): string | null => {
      const state = get(authStore)

      // Check if token is expired
      if (state.expiresAt && new Date() >= state.expiresAt) {
        // Token expired, trigger refresh
        if (browser && !state.isRefreshing) {
          authStore.refresh()
        }
        return null
      }

      return state.accessToken
    },

    async refresh(): Promise<boolean> {
      // Single in-flight refresh management
      if (refreshPromise) {
        return refreshPromise
      }

      update(state => ({ ...state, isRefreshing: true }))

      refreshPromise = fetch(`/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // Include httpOnly cookie
        headers: {
          'Content-Type': 'application/json'
        }
      })
        .then(async res => {
          if (!res.ok) {
            throw new Error('Failed to refresh token')
          }

          const data = await res.json()

          // Update auth state with new token
          this.setAuth(data.access_token, data.user, data.expires_in)

          return true
        })
        .catch(error => {
          console.error('Token refresh failed:', error)
          this.clearAuth()

          // Redirect to login on refresh failure
          if (browser) {
            window.location.href = '/login'
          }

          return false
        })
        .finally(() => {
          refreshPromise = null
          update(state => ({ ...state, isRefreshing: false }))
        })

      return refreshPromise
    },

    async checkAndRefresh(): Promise<string | null> {
      const state = get(authStore)

      console.log('[AuthStore] checkAndRefresh - current state:', {
        hasToken: !!state.accessToken,
        isAuthenticated: state.isAuthenticated,
        expiresAt: state.expiresAt?.toISOString()
      })

      if (!state.accessToken) {
        console.warn('[AuthStore] checkAndRefresh - no access token')
        return null
      }

      // Check if we need to refresh (within 5 minutes of expiry)
      if (state.expiresAt) {
        const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000)

        if (fiveMinutesFromNow >= state.expiresAt) {
          const refreshed = await this.refresh()
          if (refreshed) {
            return get(authStore).accessToken
          }
        }
      }

      return state.accessToken
    },

    initFromServer: (accessToken: string | null, user: UserInfo | null, expiresAt: string | null) => {
      console.log('[AuthStore] initFromServer called with:', {
        hasToken: !!accessToken,
        hasUser: !!user,
        expiresAt
      })
      if (accessToken && user && expiresAt) {
        set({
          accessToken,
          refreshToken: null,
          user,
          expiresAt: new Date(expiresAt),
          isRefreshing: false,
          isAuthenticated: true
        })
      } else {
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          expiresAt: null,
          isRefreshing: false,
          isAuthenticated: false
        })
      }
    }
  }
}

export const authStore = createAuthStore()