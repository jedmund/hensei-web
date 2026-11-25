import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

let stored: Record<string, string>

beforeEach(() => {
	stored = {}
	const localStorage = {
		getItem: vi.fn((key: string) => stored[key] ?? null),
		setItem: vi.fn((key: string, value: string) => (stored[key] = value)),
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

describe('eventRaidTabs', () => {
	it('has no pick until one is made', async () => {
		const { eventRaidTabs } = await import('../eventRaidTabs.svelte')
		expect(eventRaidTabs.get('gw')).toBeUndefined()
	})

	it('remembers a pick per event across loads', async () => {
		const first = await import('../eventRaidTabs.svelte')
		first.eventRaidTabs.set('gw', 'nm150')
		first.eventRaidTabs.set('db', 'db95')

		vi.resetModules()
		const { eventRaidTabs } = await import('../eventRaidTabs.svelte')
		expect(eventRaidTabs.get('gw')).toBe('nm150')
		expect(eventRaidTabs.get('db')).toBe('db95')
	})

	it('keeps only the most recent events', async () => {
		const { eventRaidTabs } = await import('../eventRaidTabs.svelte')
		for (let i = 0; i < 25; i++) eventRaidTabs.set(`event-${i}`, 'raid')
		eventRaidTabs.set('event-0', 'again')
		const saved = JSON.parse(stored['home-event-raid-tabs']!)
		expect(Object.keys(saved)).toHaveLength(20)
		expect(saved['event-0']).toBe('again')
		expect(saved['event-5']).toBeUndefined()
	})

	it('ignores unreadable storage', async () => {
		stored['home-event-raid-tabs'] = 'not json'
		const { eventRaidTabs } = await import('../eventRaidTabs.svelte')
		expect(eventRaidTabs.get('gw')).toBeUndefined()
	})

	it('keeps the pick for the page when storage throws', async () => {
		vi.mocked(localStorage.setItem).mockImplementation(() => {
			throw new Error('blocked')
		})
		const { eventRaidTabs } = await import('../eventRaidTabs.svelte')
		eventRaidTabs.set('gw', 'nm200')
		expect(eventRaidTabs.get('gw')).toBe('nm200')
	})
})
