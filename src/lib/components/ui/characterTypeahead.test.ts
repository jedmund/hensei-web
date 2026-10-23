import { describe, it, expect } from 'vitest'
import { render } from 'svelte/server'
import CharacterTypeahead from './CharacterTypeahead.svelte'
import { rowIdForValue, toCharacterTypeaheadOption } from './characterTypeahead'
import type { SearchResult } from '$lib/api/adapters/search.adapter'

// A base character and its style row share a granblueId.
const base: SearchResult = {
	id: 'row-base',
	granblueId: '3040377000',
	name: { en: 'Cidala', ja: 'シダラ' },
	element: 2,
	searchableType: 'Character',
	styleSwap: false
}
const style: SearchResult = { ...base, id: 'row-style', styleSwap: true }

describe('toCharacterTypeaheadOption', () => {
	it('keeps the row id so a style row is told apart from its base', () => {
		const a = toCharacterTypeaheadOption(base)
		const b = toCharacterTypeaheadOption(style)
		expect(a.granblueId).toBe(b.granblueId)
		expect(a.id).not.toBe(b.id)
		expect(b).toMatchObject({ id: 'row-style', styleSwap: true, label: 'Cidala' })
	})

	it('falls back to the granblueId when there is no name', () => {
		expect(toCharacterTypeaheadOption({ ...base, name: {} }).label).toBe('3040377000')
	})
})

describe('rowIdForValue', () => {
	const a = toCharacterTypeaheadOption(base)
	const b = toCharacterTypeaheadOption(style)

	it('is empty without a value', () => {
		expect(rowIdForValue(null, a)).toBe('')
	})

	it('picks the first candidate showing the value', () => {
		expect(rowIdForValue('3040377000', b, a)).toBe('row-style')
		expect(rowIdForValue('3040377000', null, a)).toBe('row-base')
	})

	it('is empty when no candidate shows the value', () => {
		expect(rowIdForValue('3999999000', a)).toBe('')
	})
})

describe('CharacterTypeahead (existing callers)', () => {
	it('shows the search input without a value', () => {
		const { body } = render(CharacterTypeahead, { props: { placeholder: 'Search…' } })
		expect(body).toContain('placeholder="Search…"')
	})
})
