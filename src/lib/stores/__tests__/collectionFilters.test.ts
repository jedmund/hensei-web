import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const SORT_KEY = 'collection-filters-v2-item-sort'

let stored: Record<string, string>

beforeEach(() => {
	stored = {}
	const localStorage = {
		getItem: vi.fn((key: string) => stored[key] ?? null),
		setItem: vi.fn((key: string, value: string) => {
			stored[key] = value
		}),
		removeItem: vi.fn((key: string) => {
			delete stored[key]
		}),
		clear: vi.fn()
	}
	vi.stubGlobal('localStorage', localStorage)
	vi.stubGlobal('window', { localStorage })
	vi.resetModules()
})

afterEach(() => {
	vi.unstubAllGlobals()
})

describe('item sort', () => {
	it('defaults to newest release date', async () => {
		const { collectionFilters } = await import('../collectionFilters.svelte')
		expect(collectionFilters.getItemSort(true)).toBe('release_date_desc')
		expect(collectionFilters.getItemSort(false)).toBe('release_date_desc')
	})

	it('ignores a sort saved per tab before the sort was shared', async () => {
		stored['collection-filters-v2-characters'] = JSON.stringify({ sort: 'name_asc' })
		const { collectionFilters } = await import('../collectionFilters.svelte')
		expect(collectionFilters.getItemSort(true)).toBe('release_date_desc')
	})

	it('restores the saved sort for the owner', async () => {
		stored[SORT_KEY] = 'element_desc'
		const { collectionFilters } = await import('../collectionFilters.svelte')
		expect(collectionFilters.getItemSort(true)).toBe('element_desc')
	})

	it('persists the owner sort', async () => {
		const { collectionFilters } = await import('../collectionFilters.svelte')
		collectionFilters.setItemSort(true, 'name_desc')
		expect(collectionFilters.getItemSort(true)).toBe('name_desc')
		expect(stored[SORT_KEY]).toBe('name_desc')
	})

	it('keeps a visitor sort out of the owner sort and storage', async () => {
		const { collectionFilters } = await import('../collectionFilters.svelte')
		collectionFilters.setItemSort(false, 'name_desc')
		expect(collectionFilters.getItemSort(false)).toBe('name_desc')
		expect(collectionFilters.getItemSort(true)).toBe('release_date_desc')
		expect(stored[SORT_KEY]).toBeUndefined()
	})

	it('keeps the artifact sort separate', async () => {
		const { collectionFilters } = await import('../collectionFilters.svelte')
		collectionFilters.setItemSort(true, 'name_desc')
		expect(collectionFilters.artifacts.sort).toBe('score_desc')
	})
})
