import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
	CharacterRefreshAdapter,
	type CharacterRefreshResult,
	type RefreshBatch
} from '$lib/api/adapters/characterRefresh.adapter'
import { API } from '$lib/api/adapters/__tests__/fixtures/characterRefresh.fixtures'
import {
	characterPath,
	countRows,
	defaultSelection,
	failureMessage,
	fieldLabels,
	groupChanges,
	itemSummary,
	refreshOutcome,
	wikiState
} from './refresh'

const BASE = 'https://api.example.com'
const adapter = new CharacterRefreshAdapter({ baseURL: BASE })

// Run the fixtures through the real adapter so the helpers see camelCase data.
async function load<T>(body: unknown, call: () => Promise<T>): Promise<T> {
	const original = global.fetch
	global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => body })
	try {
		return await call()
	} finally {
		global.fetch = original
	}
}

let changes: CharacterRefreshResult
let noChanges: CharacterRefreshResult
let previewed: RefreshBatch

beforeEach(async () => {
	changes = (await load(API.reparsePreviewChanges, () => adapter.preview('c'))).refresh
	noChanges = (await load(API.reparsePreviewNoChanges, () => adapter.preview('c'))).refresh
	previewed = await load(API.batchPreviewed, () => adapter.getBatch('rf'))
})

afterEach(() => vi.restoreAllMocks())

describe('refreshOutcome', () => {
	it('is changes when skills change', () => {
		expect(refreshOutcome(changes)).toBe('changes')
	})

	it('is none when nothing changed', () => {
		expect(refreshOutcome(noChanges)).toBe('none')
	})

	it('is text_only when only the wikitext changed', () => {
		expect(refreshOutcome({ ...noChanges, wikiChanged: true })).toBe('text_only')
		expect(refreshOutcome({ ...noChanges, wikiJpChanged: true })).toBe('text_only')
	})
})

describe('groupChanges', () => {
	it('groups by kind in game order, sorted by position', () => {
		const groups = groupChanges(changes.changes)
		expect(groups.map((g) => g.kind)).toEqual(['ability', 'support'])
		expect(groups[0]!.items.map((c) => c.position)).toEqual([1, 2, 3])
		expect(groups[0]!.label).toBe('Abilities')
	})

	it('puts the charge attack first and unknown kinds last', () => {
		const base = changes.changes[0]!
		const groups = groupChanges([
			{ ...base, kind: 'mystery' },
			{ ...base, kind: 'support' },
			{ ...base, kind: 'ougi' }
		])
		expect(groups.map((g) => g.label)).toEqual(['Charge attack', 'Support skills', 'mystery'])
	})
})

describe('fieldLabels', () => {
	it('names fields in plain words', () => {
		expect(fieldLabels(['description_en', 'cooldown', 'effects'])).toEqual([
			'description',
			'cooldown',
			'effects'
		])
	})

	it('merges paired columns and humanizes unknown ones', () => {
		expect(fieldLabels(['duration_value', 'duration_unit', 'cant_recast'])).toEqual([
			'duration',
			'cant recast'
		])
	})
})

describe('countRows', () => {
	it('lists only non-zero counts', () => {
		expect(countRows(changes.counts)).toEqual([
			{ key: 'versions', label: 'Versions', parts: ['1 added', '3 updated'] },
			{ key: 'effects', label: 'Effects', parts: ['4 added', '1 updated', '2 removed'] },
			{ key: 'links', label: 'Links', parts: ['1 added'] }
		])
		expect(countRows(noChanges.counts)).toEqual([])
	})
})

describe('wikiState', () => {
	it('tells changed, unchanged and not fetched apart', () => {
		expect(wikiState(true)).toBe('changed')
		expect(wikiState(false)).toBe('unchanged')
		expect(wikiState(null)).toBe('not_fetched')
	})
})

describe('failureMessage', () => {
	it('explains each failure', () => {
		expect(failureMessage('preview_expired')).toMatch(/expired/)
		expect(failureMessage('rate_limited')).toMatch(/Too many/)
		expect(failureMessage('too_many_characters')).toMatch(/20/)
		expect(failureMessage('other', 'boom')).toBe("Couldn't refresh: boom")
	})
})

describe('batch helpers', () => {
	it('summarizes each item', () => {
		expect(previewed.items.map(itemSummary)).toEqual([
			'Skills changed: 1',
			'No changes',
			'The wiki page Lecia could not be fetched (502)'
		])
	})

	it('ticks only previewed items that change something', () => {
		expect(defaultSelection(previewed.items)).toEqual([previewed.items[0]!.characterId])
	})

	it('links style rows to their style page', () => {
		expect(characterPath(previewed.items[0]!)).toBe('/database/characters/3040377000')
		expect(characterPath(previewed.items[1]!)).toBe('/database/characters/3040377000/style')
	})
})
