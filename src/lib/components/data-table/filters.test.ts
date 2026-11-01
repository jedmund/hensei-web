import { describe, it, expect } from 'vitest'
import {
	activeFilterCount,
	applyMulti,
	applyRecent,
	applyToggles,
	facetKeys,
	filterSpecs,
	matchRecent,
	multiTriggerText,
	multiValue,
	recentRange,
	resolveOptions,
	toggleValue,
	type FilterConfig,
	type ToggleGroupConfig
} from './filters'
import { seriesFilterOptions } from './filterOptions'
import { parseTableUrl, writeTableUrl, updateTableState, defaultTableState } from './urlState'

const uncap: ToggleGroupConfig = {
	kind: 'toggles',
	id: 'uncap',
	label: 'Uncap',
	toggles: [
		{ key: 'flb', label: 'FLB' },
		{ key: 'ulb', label: 'ULB' }
	]
}

const config: FilterConfig[] = [
	{
		kind: 'multi',
		key: 'element',
		label: () => 'Element',
		options: () => [
			{ value: '1', label: 'Fire' },
			{ value: '2', label: 'Water' }
		],
		facet: true
	},
	{ kind: 'multi', key: 'granblue_id', label: 'ID', options: () => [] },
	uncap,
	{
		kind: 'recent',
		key: 'updated_at',
		label: 'Updated',
		presets: [
			{ days: 7, label: '7 days' },
			{ days: 30, label: '30 days' }
		]
	}
]

const today = new Date(2026, 9, 31, 15, 0)

describe('filterSpecs', () => {
	it('maps each filter kind to URL codec specs, one per toggle', () => {
		expect(filterSpecs(config)).toEqual([
			{ key: 'element', kind: 'multi' },
			{ key: 'granblue_id', kind: 'multi' },
			{ key: 'flb', kind: 'boolean' },
			{ key: 'ulb', kind: 'boolean' },
			{ key: 'updated_at', kind: 'range' }
		])
	})

	it('round-trips every kind through the URL', () => {
		const urlConfig = { filters: filterSpecs(config) }
		const state = updateTableState(defaultTableState(urlConfig), {
			filters: {
				element: ['1', '2'],
				flb: true,
				updated_at: recentRange(7, today)
			}
		})
		const params = writeTableUrl(state, new URLSearchParams('view=x&open=123'), urlConfig)
		expect(params.get('element')).toBe('1,2')
		expect(params.get('flb')).toBe('true')
		expect(params.get('updated_at')).toBe('2026-10-24..')
		expect(params.get('open')).toBe('123')
		expect(parseTableUrl(params, urlConfig).filters).toEqual(state.filters)
	})
})

describe('facetKeys', () => {
	it('lists only multi filters that ask for facets', () => {
		expect(facetKeys(config)).toEqual(['element'])
	})
})

describe('multi filters', () => {
	it('reads only list values', () => {
		expect(multiValue({ element: ['1'] }, 'element')).toEqual(['1'])
		expect(multiValue({ flb: true }, 'flb')).toEqual([])
		expect(multiValue({}, 'element')).toEqual([])
	})

	it('removes the key when nothing is selected', () => {
		expect(applyMulti({ element: ['1'], flb: true }, 'element', [])).toEqual({ flb: true })
		expect(applyMulti({}, 'element', ['2'])).toEqual({ element: ['2'] })
	})

	it('adds facet counts and disables empty options unless selected', () => {
		const options = [
			{ value: '1', label: () => 'Fire' },
			{ value: '2', label: 'Water' },
			{ value: '3', label: 'Earth' }
		]
		expect(resolveOptions(options, { '1': 12, '3': 0 }, ['3'])).toEqual([
			{ value: '1', label: 'Fire', count: 12 },
			{ value: '2', label: 'Water', count: 0, disabled: true },
			{ value: '3', label: 'Earth', count: 0 }
		])
	})

	it('has no counts before facets arrive, and keeps unknown selected values', () => {
		expect(resolveOptions([{ value: '1', label: 'Fire' }], undefined, ['9'])).toEqual([
			{ value: '1', label: 'Fire' },
			{ value: '9', label: '9' }
		])
	})

	it('counts by facetKey when values are slugs', () => {
		const options = seriesFilterOptions(
			[
				{ id: 'uuid-b', slug: 'ultima', order: 2, name: { en: 'Ultima', ja: 'オメガ' } },
				{ id: 'uuid-a', slug: 'dark-opus', order: 1, name: { en: 'Dark Opus', ja: '終末' } }
			],
			() => 'No series'
		)
		expect(options.map((o) => o.value)).toEqual(['dark-opus', 'ultima', 'none'])
		const resolved = resolveOptions(options, { 'uuid-a': 5, none: 2 }, [])
		expect(resolved.map((o) => o.count)).toEqual([5, 0, 2])
	})

	it('shows the label, the one selection, or the label with a count', () => {
		const options = [
			{ value: '1', label: 'Fire' },
			{ value: '2', label: 'Water' }
		]
		const format = (label: string, count: number) => `${label} · ${count}`
		expect(multiTriggerText('Element', options, [], format)).toBe('Element')
		expect(multiTriggerText('Element', options, ['2'], format)).toBe('Water')
		expect(multiTriggerText('Element', options, ['1', '2'], format)).toBe('Element · 2')
	})
})

describe('toggle groups', () => {
	it('reads the toggles that are on', () => {
		expect(toggleValue({ flb: true, ulb: false, extra: true }, uncap)).toEqual(['flb'])
	})

	it('sets exactly the chosen toggles and leaves other filters alone', () => {
		expect(applyToggles({ flb: true, element: ['1'] }, uncap, ['ulb'])).toEqual({
			ulb: true,
			element: ['1']
		})
		expect(applyToggles({ flb: true, ulb: true }, uncap, [])).toEqual({})
	})
})

describe('recent presets', () => {
	it('is an open-ended range from N days ago', () => {
		expect(recentRange(7, today)).toEqual({ gte: '2026-10-24' })
		expect(recentRange(30, today)).toEqual({ gte: '2026-10-01' })
	})

	it('matches a preset picked today, and calls anything else custom', () => {
		const presets = [
			{ days: 7, label: '' },
			{ days: 30, label: '' }
		]
		expect(matchRecent(undefined, presets, today)).toBeNull()
		expect(matchRecent({ gte: '2026-10-24' }, presets, today)).toBe(7)
		expect(matchRecent({ gte: '2026-10-01' }, presets, today)).toBe(30)
		expect(matchRecent({ gte: '2026-10-23' }, presets, today)).toBe('custom')
		expect(matchRecent({ gte: '2026-10-24', lte: '2026-10-30' }, presets, today)).toBe('custom')
		expect(matchRecent(['x'], presets, today)).toBeNull()
	})

	it('applies and clears', () => {
		expect(applyRecent({}, 'updated_at', 7, today)).toEqual({
			updated_at: { gte: '2026-10-24' }
		})
		expect(applyRecent({ updated_at: { gte: '2026-10-24' } }, 'updated_at', null)).toEqual({})
	})
})

describe('activeFilterCount', () => {
	it('counts set keys from the config, each toggle once', () => {
		expect(
			activeFilterCount(
				{ element: ['1', '2'], flb: true, ulb: true, updated_at: { gte: 'x' }, other: true },
				config
			)
		).toBe(4)
		expect(activeFilterCount({}, config)).toBe(0)
	})
})
