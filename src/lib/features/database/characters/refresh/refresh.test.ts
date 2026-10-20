import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
	CharacterRefreshAdapter,
	type CharacterRefreshResult,
	type RefreshBatch
} from '$lib/api/adapters/characterRefresh.adapter'
import { API } from '$lib/api/adapters/__tests__/fixtures/characterRefresh.fixtures'
import {
	FIELD_LABELS,
	characterPath,
	holdsOnOutsideClick,
	itemFailure,
	variantNames,
	entryLabels,
	countRows,
	defaultSelection,
	failureMessage,
	fieldLabels,
	groupChanges,
	itemSummary,
	refreshOutcome,
	refreshSummary,
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

describe('entryLabels', () => {
	it('adds the version number only to repeated names', () => {
		const base = changes.changes[0]!
		const labels = entryLabels([
			{ ...base, ordinal: 1, name: { en: 'Heal III', ja: null } },
			{ ...base, ordinal: 2, name: { en: 'Heal III', ja: null } },
			{ ...base, ordinal: 1, name: { en: 'Cure', ja: null } }
		])
		expect(labels).toEqual(['Heal III (version 1)', 'Heal III (version 2)', 'Cure'])
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

	it('labels every column the Writer can diff', () => {
		// CharacterSkillVersion columns minus bookkeeping (Writer.version_columns), plus diff extras
		const columns = [
			'name_en',
			'name_jp',
			'description_en',
			'description_jp',
			'icon',
			'game_icon',
			'type_color',
			'cooldown',
			'initial_cooldown',
			'duration_value',
			'duration_unit',
			'variant_role',
			'ordinal',
			'unlock_level',
			'enhance_levels',
			'min_uncap',
			'transcendence_stage',
			'trigger_type',
			'trigger_value',
			'cant_recast',
			'one_time_use',
			'auto_activate',
			'mimicable',
			'targets_all',
			'game_action_id',
			'effects',
			'links',
			'slot_game_action_id',
			'duplicates'
		]
		expect(columns.filter((column) => !Object.hasOwn(FIELD_LABELS, column))).toEqual([])
		expect(fieldLabels(['mimicable'])).toEqual(['can be copied'])
	})

	it('merges paired columns and humanizes unknown ones', () => {
		expect(fieldLabels(['duration_value', 'duration_unit', 'brand_new_column'])).toEqual([
			'duration',
			'brand new column'
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
		expect(failureMessage('unauthorized')).toMatch(/Sign in again/)
		expect(failureMessage('not_previewed')).toMatch(/already applied/)
		expect(failureMessage('invalid_characters')).toMatch(/could be found/)
		expect(failureMessage('other', 'boom')).toBe("Couldn't refresh: boom")
	})
})

describe('batch helpers', () => {
	it('summarizes each item', () => {
		expect(previewed.items.map(itemSummary)).toEqual([
			'Skills changed: 1',
			'No changes',
			"The wiki page couldn't be fetched (HTTP 502)"
		])
	})

	it('localizes each item error code, with a generic line otherwise', () => {
		const line = (errorCode: unknown, errorStatus: number | null = null) =>
			itemFailure({ errorCode, errorStatus } as Parameters<typeof itemFailure>[0])
		expect(line('wiki_fetch_failed', 404)).toBe("The wiki page couldn't be fetched (HTTP 404)")
		expect(line('wiki_fetch_failed')).toBe("The wiki page couldn't be fetched")
		expect(line('build_refused')).toBe('No skills could be built from this page')
		expect(line('unexpected')).toBe('Something went wrong refreshing this character')
		expect(line(null)).toBe("Couldn't refresh this character")
		expect(line('something_new')).toBe("Couldn't refresh this character")
	})

	it('summarizes a plain re-parse (EN not fetched, no fetched_at)', () => {
		const reparsed = { ...changes, wikiChanged: false, wikiJpChanged: null, fetchedAt: null }
		expect(refreshSummary(reparsed)).toBe('Skills changed: 4')
		expect(refreshSummary({ ...noChanges, fetchedAt: null })).toBe('No changes')
	})

	it('ticks only previewed items that change something', () => {
		expect(defaultSelection(previewed.items)).toEqual([previewed.items[0]!.characterId])
	})

	it('links style rows to their style page', () => {
		expect(characterPath(previewed.items[0]!)).toBe('/database/characters/3040377000')
		expect(characterPath(previewed.items[1]!)).toBe('/database/characters/3040377000/style')
	})
})

describe('variantNames', () => {
	it('names the season and non-standard series', () => {
		expect(
			variantNames({
				season: 3,
				series: [
					{ id: 's', slug: 'standard', name: { en: 'Standard', ja: '恒常' } },
					{ id: 'g', slug: 'grand', name: { en: 'Grand', ja: 'リミテッド' } }
				]
			})
		).toEqual(['Summer', 'Grand'])
		expect(variantNames({ season: null, series: null })).toEqual([])
		expect(variantNames(undefined)).toEqual([])
	})
})

describe('holdsOnOutsideClick', () => {
	it('holds once a refresh exists', () => {
		expect(holdsOnOutsideClick('picking')).toBe(false)
		expect(holdsOnOutsideClick('running')).toBe(true)
		expect(holdsOnOutsideClick('previewed')).toBe(true)
		expect(holdsOnOutsideClick('applying')).toBe(true)
		expect(holdsOnOutsideClick('applied')).toBe(false)
	})
})
