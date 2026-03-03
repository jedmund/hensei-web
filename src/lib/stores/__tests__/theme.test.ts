import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Theme store is a singleton with #initialized guard — need fresh import per test group
// We use dynamic imports with vi.resetModules() to get fresh instances

let setAttributeMock: ReturnType<typeof vi.fn>
let addEventListenerMock: ReturnType<typeof vi.fn>

beforeEach(() => {
	setAttributeMock = vi.fn()
	addEventListenerMock = vi.fn()

	vi.stubGlobal('document', {
		documentElement: { setAttribute: setAttributeMock }
	})
	vi.stubGlobal('window', {
		matchMedia: vi.fn().mockReturnValue({
			matches: false,
			addEventListener: addEventListenerMock,
			removeEventListener: vi.fn()
		})
	})
})

afterEach(() => {
	vi.unstubAllGlobals()
	vi.resetModules()
})

describe('init', () => {
	it('sets preference=light, resolved=light', async () => {
		const { themeStore } = await import('../theme.svelte')
		themeStore.init('light')
		expect(themeStore.preference).toBe('light')
		expect(themeStore.resolved).toBe('light')
		expect(setAttributeMock).toHaveBeenCalledWith('data-theme', 'light')
	})

	it('sets preference=dark, resolved=dark', async () => {
		const { themeStore } = await import('../theme.svelte')
		themeStore.init('dark')
		expect(themeStore.preference).toBe('dark')
		expect(themeStore.resolved).toBe('dark')
		expect(setAttributeMock).toHaveBeenCalledWith('data-theme', 'dark')
	})

	it('resolves system preference via matchMedia', async () => {
		;(window.matchMedia as ReturnType<typeof vi.fn>).mockReturnValue({
			matches: true,
			addEventListener: addEventListenerMock
		})
		const { themeStore } = await import('../theme.svelte')
		themeStore.init('system')
		expect(themeStore.preference).toBe('system')
		expect(themeStore.resolved).toBe('dark')
	})

	it('is idempotent (second call is no-op)', async () => {
		const { themeStore } = await import('../theme.svelte')
		themeStore.init('light')
		themeStore.init('dark')
		expect(themeStore.preference).toBe('light')
	})
})

describe('setTheme', () => {
	it('updates preference and resolved', async () => {
		const { themeStore } = await import('../theme.svelte')
		themeStore.init('light')
		themeStore.setTheme('dark')
		expect(themeStore.preference).toBe('dark')
		expect(themeStore.resolved).toBe('dark')
		expect(setAttributeMock).toHaveBeenLastCalledWith('data-theme', 'dark')
	})
})

describe('system change handler', () => {
	it('updates resolved when preference is system', async () => {
		const { themeStore } = await import('../theme.svelte')
		themeStore.init('system')

		const handler = addEventListenerMock.mock.calls[0]?.[1]
		handler?.({ matches: true })

		expect(themeStore.resolved).toBe('dark')
	})

	it('ignores system change when preference is not system', async () => {
		const { themeStore } = await import('../theme.svelte')
		themeStore.init('light')

		const handler = addEventListenerMock.mock.calls[0]?.[1]
		handler?.({ matches: true })

		expect(themeStore.resolved).toBe('light')
	})
})
