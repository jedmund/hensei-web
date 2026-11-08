import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { init } from '@sentry/sveltekit'

vi.mock('@sentry/sveltekit', async (importOriginal) => ({
	...(await importOriginal<typeof import('@sentry/sveltekit')>()),
	init: vi.fn()
}))
vi.mock('$env/dynamic/public', () => ({
	env: { PUBLIC_SENTRY_DSN: 'https://public@example.com/1' }
}))
vi.mock('$env/static/public', () => ({
	PUBLIC_SIERO_API_URL: 'http://localhost:3000'
}))
vi.mock('$lib/utils/fonts', () => ({
	generateFontFaceCSS: () => '',
	getFontPreloadLinks: () => ''
}))

beforeEach(() => {
	vi.resetModules()
	vi.clearAllMocks()
	vi.stubGlobal('window', { addEventListener: vi.fn() })
})

afterEach(() => {
	vi.unstubAllGlobals()
})

describe('Sentry initialization', () => {
	it.each(['client', 'server'])(
		'preserves restricted data collection in the %s hook',
		async (hook) => {
			if (hook === 'client') await import('../hooks.client')
			else await import('../hooks.server')

			expect(init).toHaveBeenCalledExactlyOnceWith(
				expect.objectContaining({
					dataCollection: expect.objectContaining({
						userInfo: false,
						cookies: false,
						httpBodies: [],
						genAI: { inputs: false, outputs: false },
						databaseQueryData: false,
						queues: false,
						graphQL: { document: false, variables: false }
					})
				})
			)
		}
	)
})

describe('chunk load failures', () => {
	async function preloadErrorHandler() {
		const addEventListener = vi.fn()
		const reload = vi.fn()
		vi.stubGlobal('window', { addEventListener, location: { reload } })
		const store = new Map<string, string>()
		vi.stubGlobal('sessionStorage', {
			getItem: (key: string) => store.get(key) ?? null,
			setItem: (key: string, value: string) => void store.set(key, value)
		})
		await import('../hooks.client')
		const call = addEventListener.mock.calls.find(([type]) => type === 'vite:preloadError')
		return { handler: call?.[1] as (event: Event) => void, reload }
	}

	// Cancelling makes the failed import resolve to undefined, which crashes
	// SvelteKit's router instead of surfacing the (ignored) chunk error
	it('reloads once without cancelling the event', async () => {
		const { handler, reload } = await preloadErrorHandler()
		const event = { preventDefault: vi.fn() } as unknown as Event

		handler(event)
		handler(event)

		expect(event.preventDefault).not.toHaveBeenCalled()
		expect(reload).toHaveBeenCalledOnce()
	})
})
