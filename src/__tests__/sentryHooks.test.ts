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
