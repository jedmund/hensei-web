import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock svelte context functions so setDefaultRepView doesn't throw
vi.mock('svelte', () => ({
	setContext: vi.fn(),
	getContext: vi.fn()
}))

beforeEach(() => {
	vi.resetModules()
})

afterEach(() => {
	vi.restoreAllMocks()
})

describe('updateDefaultRepView', () => {
	it('updates the value after setDefaultRepView has been called', async () => {
		const { setContext } = await import('svelte')
		const { setDefaultRepView, updateDefaultRepView } = await import('../defaultRepView.svelte')

		setDefaultRepView('weapons')

		// Grab the box object that was passed to setContext
		const box = vi.mocked(setContext).mock.calls[0]![1] as { value: string }
		expect(box.value).toBe('weapons')

		updateDefaultRepView('characters')
		expect(box.value).toBe('characters')

		updateDefaultRepView('summons')
		expect(box.value).toBe('summons')
	})

	it('does not throw when called before initialization', async () => {
		const { updateDefaultRepView } = await import('../defaultRepView.svelte')
		expect(() => updateDefaultRepView('characters')).not.toThrow()
	})

	it('initializes with the provided value', async () => {
		const { setContext } = await import('svelte')
		const { setDefaultRepView } = await import('../defaultRepView.svelte')

		setDefaultRepView('summons')

		// setContext should have been called with a symbol key and a box containing 'summons'
		expect(setContext).toHaveBeenCalledWith(
			expect.any(Symbol),
			expect.objectContaining({ value: 'summons' })
		)
	})

	it('defaults to weapons when getContext returns undefined', async () => {
		const { getContext } = await import('svelte')
		vi.mocked(getContext).mockReturnValue(undefined)

		const { getDefaultRepView } = await import('../defaultRepView.svelte')
		const result = getDefaultRepView()

		expect(result.value).toBe('weapons')
	})
})
