import { describe, it, expect } from 'vitest'
import { buildSearchParams, type SearchFilters } from '../search.queries'

describe('buildSearchParams', () => {
	it('returns base params with no query or filters', () => {
		const result = buildSearchParams('', undefined, 1)
		expect(result).toEqual({ page: 1, locale: 'en', per: 50 })
		expect(result.query).toBeUndefined()
		expect(result.filters).toBeUndefined()
	})

	it('omits query when empty string', () => {
		const result = buildSearchParams('', undefined, 1)
		expect(result.query).toBeUndefined()
	})

	it('omits query when whitespace only', () => {
		const result = buildSearchParams('   ', undefined, 1)
		expect(result.query).toBeUndefined()
	})

	it('trims query whitespace', () => {
		const result = buildSearchParams('  sword  ', undefined, 1)
		expect(result.query).toBe('sword')
	})

	it('passes through page number', () => {
		const result = buildSearchParams('', undefined, 3)
		expect(result.page).toBe(3)
	})

	it('passes through locale', () => {
		const result = buildSearchParams('', undefined, 1, 'ja')
		expect(result.locale).toBe('ja')
	})

	it('includes exclude array when non-empty', () => {
		const result = buildSearchParams('', undefined, 1, 'en', ['id-1', 'id-2'])
		expect(result.exclude).toEqual(['id-1', 'id-2'])
	})

	it('omits exclude when empty array', () => {
		const result = buildSearchParams('', undefined, 1, 'en', [])
		expect(result.exclude).toBeUndefined()
	})

	it('omits filters key when no filters provided', () => {
		const result = buildSearchParams('test', undefined, 1)
		expect(result.filters).toBeUndefined()
	})

	it('omits filters key when all filter arrays are empty', () => {
		const filters: SearchFilters = { element: [], rarity: [], proficiency: [] }
		const result = buildSearchParams('test', filters, 1)
		expect(result.filters).toBeUndefined()
	})

	it('passes through element filter', () => {
		const filters: SearchFilters = { element: [1, 2] }
		const result = buildSearchParams('', filters, 1)
		expect(result.filters!.element).toEqual([1, 2])
	})

	it('passes through rarity filter', () => {
		const filters: SearchFilters = { rarity: [3] }
		const result = buildSearchParams('', filters, 1)
		expect(result.filters!.rarity).toEqual([3])
	})

	it('renames proficiency to proficiency1', () => {
		const filters: SearchFilters = { proficiency: [1, 7] }
		const result = buildSearchParams('', filters, 1)
		expect(result.filters!.proficiency1).toEqual([1, 7])
		expect((result.filters as any).proficiency).toBeUndefined()
	})

	it('passes through proficiency2', () => {
		const filters: SearchFilters = { proficiency2: [2, 3] }
		const result = buildSearchParams('', filters, 1)
		expect(result.filters!.proficiency2).toEqual([2, 3])
	})

	it('includes boolean filters when defined', () => {
		const filters: SearchFilters = { subaura: true, extra: false }
		const result = buildSearchParams('', filters, 1)
		expect(result.filters!.subaura).toBe(true)
		expect(result.filters!.extra).toBe(false)
	})

	it('omits boolean filters when undefined', () => {
		const filters: SearchFilters = { element: [1] }
		const result = buildSearchParams('', filters, 1)
		expect(result.filters!.subaura).toBeUndefined()
		expect(result.filters!.extra).toBeUndefined()
	})

	it('passes through series filter', () => {
		const filters: SearchFilters = { series: ['dark-opus', 'draconic'] }
		const result = buildSearchParams('', filters, 1)
		expect(result.filters!.series).toEqual(['dark-opus', 'draconic'])
	})

	it('passes through character-specific filters', () => {
		const filters: SearchFilters = {
			season: [3, 5],
			characterSeries: [1, 2],
			gachaAvailable: true
		}
		const result = buildSearchParams('', filters, 1)
		expect(result.filters!.season).toEqual([3, 5])
		expect(result.filters!.characterSeries).toEqual([1, 2])
		expect(result.filters!.gachaAvailable).toBe(true)
	})

	it('combines multiple filters', () => {
		const filters: SearchFilters = {
			element: [1],
			rarity: [3],
			proficiency: [1]
		}
		const result = buildSearchParams('sword', filters, 2, 'ja', ['exc-1'])
		expect(result.query).toBe('sword')
		expect(result.page).toBe(2)
		expect(result.locale).toBe('ja')
		expect(result.exclude).toEqual(['exc-1'])
		expect(result.filters!.element).toEqual([1])
		expect(result.filters!.rarity).toEqual([3])
		expect(result.filters!.proficiency1).toEqual([1])
	})
})
