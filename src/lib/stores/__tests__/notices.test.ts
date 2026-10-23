import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

let getItemMock: ReturnType<typeof vi.fn>
let setItemMock: ReturnType<typeof vi.fn>

beforeEach(() => {
	getItemMock = vi.fn().mockReturnValue(null)
	setItemMock = vi.fn()

	const localStorage = {
		getItem: getItemMock,
		setItem: setItemMock,
		removeItem: vi.fn(),
		clear: vi.fn()
	}

	vi.stubGlobal('localStorage', localStorage)
	vi.stubGlobal('window', { localStorage })
	vi.resetModules()
})

afterEach(() => {
	vi.unstubAllGlobals()
})

describe('transition', () => {
	it('dismisses an active notice and resets a dismissed one', async () => {
		const { transition } = await import('../notices.svelte')
		expect(transition('active', 'dismiss')).toBe('dismissed')
		expect(transition('dismissed', 'reset')).toBe('active')
	})

	it('ignores events with no transition from the current state', async () => {
		const { transition } = await import('../notices.svelte')
		expect(transition('active', 'reset')).toBe('active')
		expect(transition('dismissed', 'dismiss')).toBe('dismissed')
	})
})

describe('notices', () => {
	it('is active when nothing is stored', async () => {
		const { notices } = await import('../notices.svelte')
		expect(notices.isActive('full-auto-skills')).toBe(true)
	})

	it('reads a stored dismissal for the current version', async () => {
		getItemMock.mockReturnValue(
			JSON.stringify({ 'full-auto-skills': { state: 'dismissed', version: 1 } })
		)
		const { notices } = await import('../notices.svelte')
		expect(notices.isActive('full-auto-skills')).toBe(false)
	})

	it('re-shows a notice dismissed at an older version', async () => {
		getItemMock.mockReturnValue(
			JSON.stringify({ 'full-auto-skills': { state: 'dismissed', version: 0 } })
		)
		const { notices } = await import('../notices.svelte')
		expect(notices.isActive('full-auto-skills')).toBe(true)
	})

	it('treats corrupt storage as active', async () => {
		getItemMock.mockReturnValue('not json')
		const { notices } = await import('../notices.svelte')
		expect(notices.isActive('full-auto-skills')).toBe(true)
	})

	it('persists a dismissal', async () => {
		const { notices } = await import('../notices.svelte')
		notices.dismiss('full-auto-skills')
		expect(notices.isActive('full-auto-skills')).toBe(false)
		expect(setItemMock).toHaveBeenCalledWith(
			'notices',
			JSON.stringify({ 'full-auto-skills': { state: 'dismissed', version: 1 } })
		)
	})

	it('still dismisses for the session when storage throws', async () => {
		setItemMock.mockImplementation(() => {
			throw new Error('blocked')
		})
		const { notices } = await import('../notices.svelte')
		notices.dismiss('full-auto-skills')
		expect(notices.isActive('full-auto-skills')).toBe(false)
	})
})
