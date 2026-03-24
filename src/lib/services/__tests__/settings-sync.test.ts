import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { UserCookie } from '$lib/types/UserCookie'

/**
 * Tests for settings-sync helpers.
 *
 * These test the contract that both ThemeToggle and LanguageToggle depend on:
 * every change persists to DB (users.update), then to the user cookie
 * (/api/settings), then applies client-side state.
 *
 * The ordering matters: the cookie must be updated BEFORE any reload,
 * otherwise hooks.server.ts reads stale data.
 */

// Track call order across all mocks
let callOrder: string[]

const mockUsersUpdate = vi.fn(async () => ({}))
vi.mock('$lib/api/resources/users', () => ({
	users: { update: (...args: unknown[]) => mockUsersUpdate(...args) }
}))

const mockSetTheme = vi.fn()
vi.mock('$lib/stores/theme.svelte', () => ({
	themeStore: { setTheme: (...args: unknown[]) => mockSetTheme(...args) }
}))

const mockInvalidateAll = vi.fn(async () => {})
vi.mock('$app/navigation', () => ({
	invalidateAll: () => mockInvalidateAll()
}))

// Mock Paraglide runtime — deLocalizeHref strips locale prefix, localizeHref adds it
vi.mock('$lib/paraglide/runtime', () => ({
	deLocalizeHref: (href: string) => href.replace(/^\/ja/, '') || '/',
	localizeHref: (href: string, opts?: { locale?: string }) =>
		opts?.locale === 'ja' ? `/ja${href}` : href
}))

const mockFetch = vi.fn(async () => new Response(JSON.stringify({ success: true })))

const baseUser: UserCookie = {
	picture: 'pic.jpg',
	element: 'fire',
	language: 'en',
	gender: 0,
	theme: 'system'
}

beforeEach(() => {
	callOrder = []
	vi.clearAllMocks()
	vi.stubGlobal('fetch', mockFetch)
	vi.stubGlobal('window', {
		location: { href: '', pathname: '/ja/teams', search: '', hash: '', reload: vi.fn() }
	})

	// Track ordering
	mockUsersUpdate.mockImplementation(async () => {
		callOrder.push('users.update')
		return {}
	})
	mockFetch.mockImplementation(async () => {
		callOrder.push('fetch:/api/settings')
		return new Response(JSON.stringify({ success: true }))
	})
	mockSetTheme.mockImplementation(() => {
		callOrder.push('themeStore.setTheme')
	})
	mockInvalidateAll.mockImplementation(async () => {
		callOrder.push('invalidateAll')
	})
})

afterEach(() => {
	vi.unstubAllGlobals()
})

describe('syncTheme', () => {
	it('persists to DB, updates cookie, then applies theme', async () => {
		const { syncTheme } = await import('../settings-sync')

		await syncTheme('user-1', baseUser, 'dark', 'system')

		expect(callOrder).toEqual([
			'users.update',
			'fetch:/api/settings',
			'themeStore.setTheme'
		])
	})

	it('calls users.update with the new theme', async () => {
		const { syncTheme } = await import('../settings-sync')

		await syncTheme('user-1', baseUser, 'dark', 'system')

		expect(mockUsersUpdate).toHaveBeenCalledWith('user-1', { theme: 'dark' })
	})

	it('posts updated cookie with new theme to /api/settings', async () => {
		const { syncTheme } = await import('../settings-sync')

		await syncTheme('user-1', baseUser, 'dark', 'system')

		expect(mockFetch).toHaveBeenCalledWith('/api/settings', expect.objectContaining({
			method: 'POST'
		}))

		const body = JSON.parse(mockFetch.mock.calls[0]![1].body as string)
		expect(body.theme).toBe('dark')
		// Other fields should be preserved from the original cookie
		expect(body.element).toBe('fire')
		expect(body.language).toBe('en')
	})

	it('applies theme to the store', async () => {
		const { syncTheme } = await import('../settings-sync')

		await syncTheme('user-1', baseUser, 'light', 'system')

		expect(mockSetTheme).toHaveBeenCalledWith('light')
	})

	it('reverts to previous theme on API failure', async () => {
		const { syncTheme } = await import('../settings-sync')

		mockUsersUpdate.mockRejectedValue(new Error('network error'))

		await syncTheme('user-1', baseUser, 'dark', 'light')

		expect(mockSetTheme).toHaveBeenCalledWith('light')
	})

	it('reverts to previous theme on non-ok /api/settings response', async () => {
		const { syncTheme } = await import('../settings-sync')

		mockFetch.mockImplementation(async () => {
			callOrder.push('fetch:/api/settings')
			return new Response('error', { status: 500 })
		})

		await syncTheme('user-1', baseUser, 'dark', 'light')

		expect(mockSetTheme).toHaveBeenCalledWith('light')
	})
})

describe('syncLanguage', () => {
	it('persists to DB, updates cookie, then navigates to localized URL', async () => {
		const { syncLanguage } = await import('../settings-sync')

		await syncLanguage('user-1', baseUser, 'ja')

		expect(callOrder).toEqual([
			'users.update',
			'fetch:/api/settings',
			'invalidateAll'
		])
		expect(window.location.href).toBe('/ja/teams')
	})

	it('calls users.update with the new language', async () => {
		const { syncLanguage } = await import('../settings-sync')

		await syncLanguage('user-1', baseUser, 'ja')

		expect(mockUsersUpdate).toHaveBeenCalledWith('user-1', { language: 'ja' })
	})

	it('posts updated cookie with new language to /api/settings', async () => {
		const { syncLanguage } = await import('../settings-sync')

		await syncLanguage('user-1', baseUser, 'ja')

		const body = JSON.parse(mockFetch.mock.calls[0]![1].body as string)
		expect(body.language).toBe('ja')
		expect(body.theme).toBe('system')
	})

	it('awaits DB and cookie update before navigating', async () => {
		const { syncLanguage } = await import('../settings-sync')

		// Make users.update slow to verify we don't navigate early
		mockUsersUpdate.mockImplementation(
			() => new Promise((resolve) => {
				setTimeout(() => {
					callOrder.push('users.update')
					resolve({})
				}, 10)
			})
		)

		await syncLanguage('user-1', baseUser, 'ja')

		// navigation must come after both async steps
		const navIndex = callOrder.indexOf('invalidateAll')
		const updateIndex = callOrder.indexOf('users.update')
		const fetchIndex = callOrder.indexOf('fetch:/api/settings')

		expect(updateIndex).toBeLessThan(fetchIndex)
		expect(fetchIndex).toBeLessThan(navIndex)
	})

	it('navigates to correct URL when switching to English', async () => {
		const { syncLanguage } = await import('../settings-sync')

		await syncLanguage('user-1', baseUser, 'en')

		// /ja/teams delocalized → /teams, localized for 'en' → /teams
		expect(window.location.href).toBe('/teams')
	})

	it('does not navigate on API failure', async () => {
		const { syncLanguage } = await import('../settings-sync')
		const originalHref = window.location.href

		mockUsersUpdate.mockRejectedValue(new Error('network error'))

		await syncLanguage('user-1', baseUser, 'ja')

		expect(mockInvalidateAll).not.toHaveBeenCalled()
		expect(window.location.href).toBe(originalHref)
	})

	it('does not navigate on non-ok /api/settings response', async () => {
		const { syncLanguage } = await import('../settings-sync')
		const originalHref = window.location.href

		mockFetch.mockImplementation(async () => {
			callOrder.push('fetch:/api/settings')
			return new Response('error', { status: 500 })
		})

		await syncLanguage('user-1', baseUser, 'ja')

		expect(window.location.href).toBe(originalHref)
	})
})
