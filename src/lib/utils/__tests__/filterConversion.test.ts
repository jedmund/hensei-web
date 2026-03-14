import { describe, it, expect } from 'vitest'
import { filterItemsToParams } from '../filterConversion'
import type { FilterItem } from '$lib/components/explore/ExploreFilters.svelte'

describe('filterItemsToParams', () => {
	it('returns empty params for an empty array', () => {
		expect(filterItemsToParams([])).toEqual({})
	})

	it('collects multiple element filters into a single array', () => {
		const items: FilterItem[] = [
			{ kind: 'element', value: 2, label: 'Fire' },
			{ kind: 'element', value: 3, label: 'Water' }
		]
		const params = filterItemsToParams(items)
		expect(params.element).toEqual([2, 3])
	})

	it('maps a raid filter to the raid slug', () => {
		const items: FilterItem[] = [
			{ kind: 'raid', value: 'proto-bahamut-hl', label: 'Proto Bahamut HL' }
		]
		expect(filterItemsToParams(items).raid).toBe('proto-bahamut-hl')
	})

	it('maps recency filter to a numeric seconds value', () => {
		const items: FilterItem[] = [
			{ kind: 'recency', value: 604800, label: 'Last week' }
		]
		expect(filterItemsToParams(items).recency).toBe(604800)
	})

	it('maps class filter to a job string', () => {
		const items: FilterItem[] = [
			{ kind: 'class', value: 'berserker', label: 'Berserker' }
		]
		expect(filterItemsToParams(items).job).toBe('berserker')
	})

	it('maps party setting filters to their respective flags', () => {
		const items: FilterItem[] = [
			{ kind: 'party', value: 'full_auto', label: 'Full Auto' },
			{ kind: 'party', value: 'auto_guard', label: 'Auto Guard' },
			{ kind: 'party', value: 'charge_attack', label: 'Charge Attack' },
			{ kind: 'party', value: 'youtube', label: 'YouTube' }
		]
		const params = filterItemsToParams(items)
		expect(params.fullAuto).toBe(1)
		expect(params.autoGuard).toBe(1)
		expect(params.chargeAttack).toBe(1)
		expect(params.hasVideo).toBe(true)
	})

	it('separates entity filters into include and exclude lists', () => {
		const items: FilterItem[] = [
			{
				kind: 'entity',
				value: '1',
				label: 'Zooey',
				entityType: 'character',
				granblueId: '3040157000',
				mode: 'include'
			},
			{
				kind: 'entity',
				value: '2',
				label: 'Ixaba',
				entityType: 'weapon',
				granblueId: '1040310600',
				mode: 'exclude'
			},
			{
				kind: 'entity',
				value: '3',
				label: 'Naru',
				entityType: 'character',
				granblueId: '3040036000',
				mode: 'include'
			}
		]
		const params = filterItemsToParams(items)
		expect(params.includes).toBe('3040157000,3040036000')
		expect(params.excludes).toBe('1040310600')
	})

	it('omits entity fields when no entities are present', () => {
		const items: FilterItem[] = [
			{ kind: 'element', value: 1, label: 'Wind' }
		]
		const params = filterItemsToParams(items)
		expect(params.includes).toBeUndefined()
		expect(params.excludes).toBeUndefined()
	})

	it('handles a mixed filter set with all kinds', () => {
		const items: FilterItem[] = [
			{ kind: 'raid', value: 'lucilius-hard', label: 'Lucilius HL', pinned: true },
			{ kind: 'element', value: 5, label: 'Dark' },
			{ kind: 'party', value: 'full_auto', label: 'Full Auto' },
			{
				kind: 'entity',
				value: '1',
				label: 'Predator',
				entityType: 'character',
				granblueId: '3040215000',
				mode: 'include'
			}
		]
		const params = filterItemsToParams(items)
		expect(params.raid).toBe('lucilius-hard')
		expect(params.element).toEqual([5])
		expect(params.fullAuto).toBe(1)
		expect(params.includes).toBe('3040215000')
	})

	it('maps a boost filter to boostMod param', () => {
		const items: FilterItem[] = [
			{ kind: 'boost', value: 'omega', label: 'Omega' }
		]
		expect(filterItemsToParams(items).boostMod).toBe('omega')
	})

	it('maps a side filter to boostSide param', () => {
		const items: FilterItem[] = [
			{ kind: 'side', value: 'double', label: 'Double' }
		]
		expect(filterItemsToParams(items).boostSide).toBe('double')
	})

	it('omits boost/side params when no boost or side filter is present', () => {
		const items: FilterItem[] = [
			{ kind: 'element', value: 1, label: 'Wind' }
		]
		const params = filterItemsToParams(items)
		expect(params.boostMod).toBeUndefined()
		expect(params.boostSide).toBeUndefined()
	})

	it('treats pinned filters identically to non-pinned', () => {
		const pinned: FilterItem[] = [
			{ kind: 'raid', value: 'akasha', label: 'Akasha', pinned: true }
		]
		const unpinned: FilterItem[] = [
			{ kind: 'raid', value: 'akasha', label: 'Akasha' }
		]
		expect(filterItemsToParams(pinned)).toEqual(filterItemsToParams(unpinned))
	})
})
