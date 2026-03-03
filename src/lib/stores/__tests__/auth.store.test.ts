/**
 * Auth store tests
 *
 * Tests the Svelte writable-based auth store.
 * Mocks $app/environment (browser flag), $env/static/public,
 * and global fetch for refresh flow testing.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { get } from 'svelte/store'

// Mock SvelteKit modules before importing the store
vi.mock('$app/environment', () => ({ browser: true }))
vi.mock('$env/static/public', () => ({ PUBLIC_SIERO_API_URL: 'http://localhost:3000' }))

// Dynamic import so mocks are in place first
const { authStore } = await import('../auth.store')

// ============================================================================
// Setup
// ============================================================================

beforeEach(() => {
	authStore.clearAuth()
	vi.restoreAllMocks()
})

afterEach(() => {
	vi.restoreAllMocks()
})

// ============================================================================
// setAuth
// ============================================================================

describe('setAuth', () => {
	it('sets token, user, and computes expiresAt', () => {
		const user = { id: 'u1', username: 'grug' }
		const before = Date.now()

		authStore.setAuth('tok-123', user, 3600)

		const state = get(authStore)
		expect(state.accessToken).toBe('tok-123')
		expect(state.user).toEqual(user)
		expect(state.isAuthenticated).toBe(true)
		expect(state.isRefreshing).toBe(false)

		// expiresAt should be ~1 hour from now
		const expiresMs = state.expiresAt!.getTime()
		expect(expiresMs).toBeGreaterThanOrEqual(before + 3600 * 1000 - 100)
		expect(expiresMs).toBeLessThanOrEqual(Date.now() + 3600 * 1000 + 100)
	})

	it('sets refreshToken to null (managed via httpOnly cookie)', () => {
		authStore.setAuth('tok', { id: 'u1', username: 'grug' }, 60)

		expect(get(authStore).refreshToken).toBeNull()
	})
})

// ============================================================================
// clearAuth
// ============================================================================

describe('clearAuth', () => {
	it('resets all state', () => {
		authStore.setAuth('tok', { id: 'u1', username: 'grug' }, 3600)
		authStore.clearAuth()

		const state = get(authStore)
		expect(state.accessToken).toBeNull()
		expect(state.user).toBeNull()
		expect(state.expiresAt).toBeNull()
		expect(state.isAuthenticated).toBe(false)
		expect(state.isRefreshing).toBe(false)
	})
})

// ============================================================================
// getToken
// ============================================================================

describe('getToken', () => {
	it('returns token when not expired', () => {
		authStore.setAuth('valid-tok', { id: 'u1', username: 'grug' }, 3600)

		expect(authStore.getToken()).toBe('valid-tok')
	})

	it('returns null when no token set', () => {
		expect(authStore.getToken()).toBeNull()
	})

	it('returns null when token is expired', async () => {
		authStore.setAuth('old-tok', { id: 'u1', username: 'grug' }, -1)

		// Stub window + fetch so the async refresh side effect doesn't explode
		;(globalThis as any).window = { location: { href: '' } }
		vi.spyOn(globalThis, 'fetch').mockResolvedValue(
			new Response(
				JSON.stringify({ access_token: 'x', user: { id: 'u1', username: 'grug' }, expires_in: 60 }),
				{ status: 200 }
			)
		)

		expect(authStore.getToken()).toBeNull()

		// Let the fire-and-forget refresh() settle
		await vi.waitFor(() => expect(get(authStore).isRefreshing).toBe(false))

		delete (globalThis as any).window
	})
})

// ============================================================================
// initFromServer
// ============================================================================

describe('initFromServer', () => {
	it('hydrates from SSR data', () => {
		const user = { id: 'u1', username: 'grug' }
		const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString()

		authStore.initFromServer('ssr-tok', user, expiresAt)

		const state = get(authStore)
		expect(state.accessToken).toBe('ssr-tok')
		expect(state.user).toEqual(user)
		expect(state.isAuthenticated).toBe(true)
		expect(state.expiresAt).toBeInstanceOf(Date)
	})

	it('resets when params are null', () => {
		authStore.setAuth('tok', { id: 'u1', username: 'grug' }, 3600)
		authStore.initFromServer(null, null, null)

		const state = get(authStore)
		expect(state.accessToken).toBeNull()
		expect(state.isAuthenticated).toBe(false)
	})

	it('resets when only some params are null', () => {
		authStore.initFromServer('tok', null, null)

		expect(get(authStore).isAuthenticated).toBe(false)
	})
})

// ============================================================================
// refresh
// ============================================================================

describe('refresh', () => {
	it('calls /auth/refresh with credentials', async () => {
		const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
			new Response(
				JSON.stringify({
					access_token: 'new-tok',
					user: { id: 'u1', username: 'grug' },
					expires_in: 3600
				}),
				{ status: 200 }
			)
		)

		authStore.setAuth('old-tok', { id: 'u1', username: 'grug' }, 3600)
		await authStore.refresh()

		expect(mockFetch).toHaveBeenCalledWith('/auth/refresh', {
			method: 'POST',
			credentials: 'include',
			headers: { 'Content-Type': 'application/json' }
		})
	})

	it('updates state on successful refresh', async () => {
		vi.spyOn(globalThis, 'fetch').mockResolvedValue(
			new Response(
				JSON.stringify({
					access_token: 'refreshed-tok',
					user: { id: 'u1', username: 'refreshed-grug' },
					expires_in: 7200
				}),
				{ status: 200 }
			)
		)

		const result = await authStore.refresh()

		expect(result).toBe(true)
		expect(get(authStore).accessToken).toBe('refreshed-tok')
	})

	it('clears auth and redirects on failure', async () => {
		vi.spyOn(globalThis, 'fetch').mockResolvedValue(
			new Response('', { status: 401 })
		)

		// Stub window for Node environment
		const fakeLocation = { href: '' }
		;(globalThis as any).window = { location: fakeLocation }

		const result = await authStore.refresh()

		expect(result).toBe(false)
		expect(get(authStore).isAuthenticated).toBe(false)
		expect(fakeLocation.href).toBe('/auth/login')

		delete (globalThis as any).window
	})

	it('deduplicates concurrent refresh calls', async () => {
		let fetchCount = 0
		vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
			fetchCount++
			// Small delay to simulate network
			await new Promise(r => setTimeout(r, 10))
			return new Response(
				JSON.stringify({
					access_token: 'deduped-tok',
					user: { id: 'u1', username: 'grug' },
					expires_in: 3600
				}),
				{ status: 200 }
			)
		})

		// Fire three concurrent refreshes
		const [r1, r2, r3] = await Promise.all([
			authStore.refresh(),
			authStore.refresh(),
			authStore.refresh()
		])

		// All should succeed
		expect(r1).toBe(true)
		expect(r2).toBe(true)
		expect(r3).toBe(true)

		// But only one fetch call should have been made
		expect(fetchCount).toBe(1)
	})
})

// ============================================================================
// checkAndRefresh
// ============================================================================

describe('checkAndRefresh', () => {
	it('returns null when no token is set', async () => {
		const result = await authStore.checkAndRefresh()
		expect(result).toBeNull()
	})

	it('returns token when not near expiry', async () => {
		authStore.setAuth('fresh-tok', { id: 'u1', username: 'grug' }, 3600)

		const result = await authStore.checkAndRefresh()
		expect(result).toBe('fresh-tok')
	})

	it('triggers refresh when within 5 minutes of expiry', async () => {
		// Set token that expires in 2 minutes (within the 5-minute window)
		authStore.setAuth('expiring-tok', { id: 'u1', username: 'grug' }, 120)

		vi.spyOn(globalThis, 'fetch').mockResolvedValue(
			new Response(
				JSON.stringify({
					access_token: 'renewed-tok',
					user: { id: 'u1', username: 'grug' },
					expires_in: 3600
				}),
				{ status: 200 }
			)
		)

		const result = await authStore.checkAndRefresh()

		expect(result).toBe('renewed-tok')
		expect(get(authStore).accessToken).toBe('renewed-tok')
	})

	it('returns null when refresh fails', async () => {
		// Token expiring in 1 minute (within the 5-minute refresh window)
		authStore.setAuth('dying-tok', { id: 'u1', username: 'grug' }, 60)

		vi.spyOn(globalThis, 'fetch').mockResolvedValue(
			new Response('', { status: 401 })
		)

		const fakeLocation = { href: '' }
		;(globalThis as any).window = { location: fakeLocation }

		const result = await authStore.checkAndRefresh()

		expect(result).toBeNull()
		expect(get(authStore).isAuthenticated).toBe(false)

		delete (globalThis as any).window
	})
})

// ============================================================================
// getToken recovery
// ============================================================================

describe('getToken recovery', () => {
	it('returns new token after refresh triggered by expired getToken', async () => {
		// Set an expired token
		authStore.setAuth('expired-tok', { id: 'u1', username: 'grug' }, -1)

		;(globalThis as any).window = { location: { href: '' } }
		vi.spyOn(globalThis, 'fetch').mockResolvedValue(
			new Response(
				JSON.stringify({
					access_token: 'recovered-tok',
					user: { id: 'u1', username: 'grug' },
					expires_in: 3600
				}),
				{ status: 200 }
			)
		)

		// First call returns null (expired)
		expect(authStore.getToken()).toBeNull()

		// Wait for the fire-and-forget refresh to complete
		await vi.waitFor(() => expect(get(authStore).isRefreshing).toBe(false))

		// Now getToken should return the refreshed token
		expect(authStore.getToken()).toBe('recovered-tok')

		delete (globalThis as any).window
	})
})
