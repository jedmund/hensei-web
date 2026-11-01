/**
 * Parity: the summons resource must reproduce what the hand-written summons
 * pages did: the old grid's columns (where the new list keeps them), and the
 * edit and new pages' payloads (transcribed below), with the changes decided
 * for GBF-143 applied on top.
 */
import { describe, expect, it, vi } from 'vitest'

const adapter = vi.hoisted(() => ({
	validateSummonGranblueId: vi.fn(),
	downloadSummonImages: vi.fn()
}))
vi.mock('$lib/api/adapters/summon.adapter', async (importOriginal) => {
	const actual = await importOriginal<typeof import('$lib/api/adapters/summon.adapter')>()
	return { ...actual, summonAdapter: Object.assign(actual.summonAdapter, adapter) }
})
import { labelText } from '$lib/components/data-table/filters'
import { columnHeader } from '$lib/components/data-table/types'
import { columnsFor, filterQueries, filtersFor } from '$lib/features/database/schema/columns'
import { recordHref } from '$lib/features/database/schema/detail'
import {
	applyDerive,
	formSections,
	fromRecord,
	initialValues,
	toPayload
} from '$lib/features/database/schema/form'
import { buildZod, issueErrors, issueMessage } from '$lib/features/database/schema/validation'
import type { Values } from '$lib/features/database/schema/types'
import type { Summon } from '$lib/api/adapters/summon.adapter'
import type { AdminSummonRow } from '$lib/types/api/admin'
import { summonsResource as def } from './resource'
import { detailRecords } from './__fixtures__/detailRecords'

const { transcended, flb, sparse } = detailRecords

// --- List ---

describe('summons resource: list', () => {
	const columns = columnsFor(def)
	const column = (id: string) => columns.find((c) => c.id === id)!

	it("keeps the old grid's columns, with series, the edit date and the aura count added", () => {
		expect(columns.map((c) => [c.id, columnHeader(c), c.defaultHidden ?? false])).toEqual([
			['image', '', false],
			['name', 'Name', false],
			['rarity', 'Rarity', false],
			['element', 'Element', false],
			['uncap', 'Uncap', false],
			['subaura', 'Subaura', false],
			['series', 'Series', true],
			['limit', 'Limit', true],
			['flb', 'FLB', true],
			['ulb', 'ULB', true],
			['transcendence', 'Transcendence', true],
			['max_level', 'Max level', true],
			['release_date', 'Release date', true],
			['flb_date', 'FLB date', true],
			['ulb_date', 'ULB date', true],
			['transcendence_date', 'Transcendence date', true],
			['latest_date', 'Last updated', false],
			['updated_at', 'Last edited', true],
			['aura_count', 'Auras', true]
		])
	})

	it('reads the series name and the uncaps from a row, and draws summon thumbnails', () => {
		const row = {
			granblueId: '2040034000',
			seriesNameEn: 'Omega',
			seriesNameJp: 'マグナ',
			flb: true,
			ulb: true,
			transcendence: false
		} as AdminSummonRow
		expect(column('series').value?.(row)).toBe('Omega')
		expect(column('series').fields).toEqual(['series_name_en', 'series_name_jp'])
		expect(column('uncap').fields).toEqual(['flb', 'ulb', 'transcendence'])
		expect(column('image')).toMatchObject({ type: 'image', image: 'summon' })
		expect(column('max_level').sortable).not.toBe(false)
	})

	it('filters on element, rarity, series, uncap, type, quality and edits', () => {
		const filters = filtersFor(def, { series: () => [] })
		expect(
			filters.map((f) =>
				f.kind === 'toggles'
					? [f.id, f.toggles.map((t) => `${t.key}:${labelText(t.label)}`)]
					: [f.key, f.kind]
			)
		).toEqual([
			['element', 'multi'],
			['rarity', 'multi'],
			['series', 'multi'],
			['uncap', ['flb:FLB', 'ulb:ULB', 'transcendence:Transcendence']],
			['type', ['subaura:Subaura', 'limit:Limit']],
			[
				'quality',
				[
					'missing_name_jp:Missing JA name',
					'no_auras:No auras',
					"caps_mismatch:Max level doesn't match uncaps"
				]
			],
			['updated_at', 'recent']
		])
		const element = filters.find((f) => f.kind === 'multi' && f.key === 'element')
		if (element?.kind !== 'multi') throw new Error('no element filter')
		// Summons always have an element
		expect(element.options().map((o) => o.value)).not.toContain('0')
		const series = filters.find((f) => f.kind === 'multi' && f.key === 'series')
		if (series?.kind !== 'multi') throw new Error('no series filter')
		expect(series.options().map((o) => o.value)).toEqual(['none'])
		expect(filterQueries(def).map(([key, query]) => [key, query().queryKey])).toEqual([
			['series', ['summonSeries', 'list']]
		])
	})

	it('colours rows by element and sorts by Last updated, then name', () => {
		expect(def.list.element).toBe('element')
		expect(def.list.defaultSort).toEqual([
			{ id: 'latest_date', desc: true },
			{ id: 'name', desc: false }
		])
	})
})

// --- Edit: the old page, transcribed ---

/** The edit page's form state from the record (its `$effect`) */
function legacyEditData(summon: Summon) {
	const uncap = summon.uncap ?? {}
	return {
		name: summon.name?.en || '',
		nameJp: summon.name?.ja || '',
		granblue_id: summon.granblueId || '',
		rarity: summon.rarity || 3,
		element: summon.element || 0,
		series: summon.series?.id || '',
		minHp: summon.hp?.minHp || 0,
		maxHp: summon.hp?.maxHp || 0,
		maxHpFlb: summon.hp?.maxHpFlb || 0,
		maxHpUlb: summon.hp?.maxHpUlb || 0,
		maxHpTranscendence: summon.hp?.maxHpXlb || 0,
		minAtk: summon.atk?.minAtk || 0,
		maxAtk: summon.atk?.maxAtk || 0,
		maxAtkFlb: summon.atk?.maxAtkFlb || 0,
		maxAtkUlb: summon.atk?.maxAtkUlb || 0,
		maxAtkTranscendence: summon.atk?.maxAtkXlb || 0,
		// The stats section's `$effect` then set it from the uncaps alone
		maxLevel: uncap.transcendence ? 250 : uncap.ulb ? 200 : uncap.flb ? 150 : 100,
		flb: uncap.flb || false,
		ulb: uncap.ulb || false,
		transcendence: uncap.transcendence || false,
		subaura: summon.subaura || false,
		limit: summon.limit || false,
		releaseDate: summon.releaseDate || '',
		flbDate: summon.flbDate || '',
		ulbDate: summon.ulbDate || '',
		transcendenceDate: summon.transcendenceDate || '',
		wikiEn: summon.wiki?.en || '',
		wikiJa: summon.wiki?.ja || '',
		gamewith: summon.gamewith || '',
		kamigame: summon.kamigame || '',
		nicknamesEn: summon.nicknames?.en || [],
		nicknamesJp: summon.nicknames?.ja || [],
		promotions: summon.promotions || []
	}
}

/** The edit page's `saveChanges` payload */
function legacyEditPayload(e: ReturnType<typeof legacyEditData>) {
	return {
		name_en: e.name,
		name_jp: e.nameJp || undefined,
		granblue_id: e.granblue_id,
		rarity: e.rarity,
		element: e.element,
		series: e.series || undefined,
		min_hp: e.minHp,
		max_hp: e.maxHp,
		max_hp_flb: e.maxHpFlb,
		max_hp_ulb: e.maxHpUlb,
		max_hp_xlb: e.maxHpTranscendence,
		min_atk: e.minAtk,
		max_atk: e.maxAtk,
		max_atk_flb: e.maxAtkFlb,
		max_atk_ulb: e.maxAtkUlb,
		max_atk_xlb: e.maxAtkTranscendence,
		max_level: e.maxLevel,
		flb: e.flb,
		ulb: e.ulb,
		transcendence: e.transcendence,
		subaura: e.subaura,
		limit: e.limit,
		release_date: e.releaseDate || null,
		flb_date: e.flbDate || null,
		ulb_date: e.ulbDate || null,
		transcendence_date: e.transcendenceDate || null,
		wiki_en: e.wikiEn,
		wiki_ja: e.wikiJa,
		gamewith: e.gamewith,
		kamigame: e.kamigame,
		nicknames_en: e.nicknamesEn,
		nicknames_jp: e.nicknamesJp,
		promotions: e.promotions
	}
}

/** What goes over the wire: JSON drops undefined */
const wire = (payload: object) => JSON.parse(JSON.stringify(payload)) as Record<string, unknown>

/** Fields the old page sent as 0 when blank */
const ZERO_WHEN_BLANK = [
	'min_hp',
	'max_hp',
	'max_hp_flb',
	'max_hp_ulb',
	'max_hp_xlb',
	'min_atk',
	'max_atk',
	'max_atk_flb',
	'max_atk_ulb',
	'max_atk_xlb'
]
/** Fields the old page left out (or sent as '') when blank, so they couldn't be cleared */
const OMITTED_WHEN_BLANK = ['name_jp', 'series', 'wiki_en', 'wiki_ja', 'gamewith', 'kamigame']
/** Shown only for an uncap */
const GATED: Record<string, (p: Record<string, unknown>) => boolean> = {
	max_hp_flb: (p) => p.flb === true,
	max_atk_flb: (p) => p.flb === true,
	flb_date: (p) => p.flb === true,
	max_hp_ulb: (p) => p.ulb === true,
	max_atk_ulb: (p) => p.ulb === true,
	ulb_date: (p) => p.ulb === true,
	max_hp_xlb: (p) => p.transcendence === true,
	max_atk_xlb: (p) => p.transcendence === true,
	transcendence_date: (p) => p.transcendence === true
}

/**
 * GBF-143: what the generated form sends differently from the old edit page,
 * as decided with the maintainer. Applied to the legacy payload, so the
 * parity test still pins every other key.
 * - Blanks send null, so they can be cleared: stats no longer send 0, and the
 *   JA name, series and links are no longer left out or sent as ''.
 * - Fields hidden by the uncap state aren't sent (the old page sent them
 *   unchanged).
 * - The max level is the stored one: the old page recomputed it from the
 *   uncaps on every load, ignoring the rarity, so saving an R summon set 100.
 *   It now follows the rarity and uncaps only when one of them changes.
 */
function decided(legacy: Record<string, unknown>, summon: Summon & { maxLevel: number }) {
	const out: Record<string, unknown> = { ...legacy, max_level: summon.maxLevel }
	const blank = (v: unknown) => v === undefined || v === null || v === ''
	const raw = wire(toPayload(def, fromRecord(def, summon), 'edit'))
	for (const key of ZERO_WHEN_BLANK) if (out[key] === 0 && raw[key] === null) out[key] = null
	for (const key of OMITTED_WHEN_BLANK) if (blank(out[key])) out[key] = null
	for (const [key, shown] of Object.entries(GATED)) if (!shown(out)) delete out[key]
	return out
}

const editPayload = (summon: Summon) => wire(toPayload(def, fromRecord(def, summon), 'edit'))
const legacyEdit = (summon: Summon) => wire(legacyEditPayload(legacyEditData(summon)))

describe('summons resource: edit payload parity', () => {
	it('matches the edit page for a transcended summon in a series, with the decided changes', () => {
		expect(editPayload(transcended)).toEqual(decided(legacyEdit(transcended), transcended))
	})

	it('matches the edit page for a limited FLB summon with no series', () => {
		expect(editPayload(flb)).toEqual(decided(legacyEdit(flb), flb))
	})

	it('matches the edit page for a bare R summon', () => {
		expect(editPayload(sparse)).toEqual(decided(legacyEdit(sparse), sparse))
	})

	it('keeps an R summon at its stored level, where the old page saved 100', () => {
		expect(legacyEdit(sparse).max_level).toBe(100)
		expect(editPayload(sparse).max_level).toBe(50)
	})

	it('sends blanks as null rather than 0, nothing or an empty string', () => {
		expect(editPayload(sparse)).toMatchObject({
			name_jp: null,
			series: null,
			min_hp: null,
			max_atk: null,
			release_date: null,
			wiki_en: null,
			kamigame: null,
			promotions: [],
			nicknames_en: []
		})
		for (const key of Object.keys(GATED)) expect(editPayload(sparse)).not.toHaveProperty(key)
	})

	it('reads the record into form values', () => {
		expect(fromRecord(def, transcended)).toMatchObject({
			name: { en: 'Colossus Omega', ja: 'コロッサス・マグナ' },
			series: 'series-omega',
			max_hp_xlb: 907,
			max_atk_xlb: 2640,
			max_level: 250,
			flb: true,
			ulb: true,
			transcendence: true,
			subaura: true,
			nicknames: { en: ['Colo', 'Magna'], ja: ['コロマグ'] }
		})
	})
})

// --- New ---

/** The keys the old new page sent */
const LEGACY_CREATE_KEYS = [
	'granblue_id',
	'name_en',
	'name_jp',
	'summon_id',
	'rarity',
	'element',
	'series',
	'promotions',
	'min_hp',
	'max_hp',
	'max_hp_flb',
	'max_hp_ulb',
	'max_hp_xlb',
	'min_atk',
	'max_atk',
	'max_atk_flb',
	'max_atk_ulb',
	'max_atk_xlb',
	'max_level',
	'flb',
	'ulb',
	'transcendence',
	'subaura',
	'limit',
	'release_date',
	'flb_date',
	'ulb_date',
	'transcendence_date',
	'wiki_en',
	'wiki_ja',
	'gamewith',
	'kamigame',
	'nicknames_en',
	'nicknames_jp'
]

describe('summons resource: create payload parity', () => {
	it("sends the new page's keys, without the fields no uncap shows yet", () => {
		const sent = Object.keys(toPayload(def, initialValues(def), 'create'))
		const expected = LEGACY_CREATE_KEYS.filter((key) => !(key in GATED))
		expect(sent.toSorted()).toEqual(expected.toSorted())
	})

	it('starts from the new page defaults, with the element to pick', () => {
		expect(initialValues(def)).toMatchObject({
			rarity: 3,
			element: null,
			max_level: 100,
			flb: false,
			ulb: false,
			transcendence: false,
			subaura: false,
			limit: false,
			promotions: []
		})
	})

	it('queues the image download after a create', async () => {
		adapter.downloadSummonImages.mockResolvedValue({})
		await def.save!.afterCreate!(transcended)
		expect(adapter.downloadSummonImages).toHaveBeenCalledWith('s-transcended')
		expect(recordHref(def, transcended)).toBe('/database/summons/2040034000')
	})

	it('checks the Granblue ID is free and has images', async () => {
		const check = def.save!.asyncValidate!.granblue_id!
		adapter.validateSummonGranblueId.mockResolvedValue({ valid: true, existsInDb: true })
		expect(await check('2040034000', {})).toBe('A summon with this Granblue ID already exists')
		adapter.validateSummonGranblueId.mockResolvedValue({ valid: true, existsInDb: false })
		expect(await check('2040034000', {})).toBeNull()
		adapter.validateSummonGranblueId.mockResolvedValue({
			valid: false,
			existsInDb: false,
			error: 'No images'
		})
		expect(await check('2040034000', {})).toBe('No images')
	})
})

describe('summons resource: forms', () => {
	const keys = (mode: 'edit' | 'create') =>
		formSections(def, mode).map(({ section, fields }) => [section.id, fields.map((f) => f.key)])

	it('edit the writable fields, with the uncap stars as a preview', () => {
		expect(keys('edit')).toEqual([
			['metadata', ['name', 'rarity', 'granblue_id']],
			['gacha', ['promotions']],
			['uncap', ['uncap', 'flb', 'ulb', 'transcendence', 'subaura', 'limit']],
			['details', ['element', 'series']],
			['hp', ['min_hp', 'max_hp', 'max_hp_flb', 'max_hp_ulb', 'max_hp_xlb']],
			['attack', ['min_atk', 'max_atk', 'max_atk_flb', 'max_atk_ulb', 'max_atk_xlb']],
			['caps', ['max_level']],
			['nicknames', ['nicknames']],
			['dates', ['release_date', 'flb_date', 'ulb_date', 'transcendence_date']],
			['links', ['wiki_en', 'wiki_ja', 'gamewith', 'kamigame']]
		])
	})

	it('set the summon ID only on create, as the old pages did', () => {
		expect(keys('create')[0]).toEqual(['metadata', ['name', 'rarity', 'granblue_id', 'summon_id']])
	})
})

// --- Validation and derive ---

function errors(values: Values, mode: 'edit' | 'create' = 'edit') {
	const result = buildZod(def, mode).safeParse(values, { error: issueMessage })
	return result.success ? {} : issueErrors(result.error.issues)
}

describe('summons resource: validation', () => {
	const loaded = fromRecord(def, transcended)

	it('accepts loaded summons', () => {
		expect(errors(loaded)).toEqual({})
		expect(errors(fromRecord(def, flb))).toEqual({})
		expect(errors(fromRecord(def, sparse))).toEqual({})
	})

	it('requires a 10-digit Granblue ID, an English name and an element', () => {
		expect(
			errors({ ...loaded, granblue_id: '204003400', name: { en: ' ', ja: '' }, element: null })
		).toMatchObject({
			granblue_id: 'Granblue ID must be 10 digits',
			'name.en': 'Required',
			element: 'Choose one of the options'
		})
		expect(errors({ ...loaded, element: 0 })).toMatchObject({
			element: 'Choose one of the options'
		})
	})

	it('takes whole, non-negative stats and a max level of at least 1', () => {
		expect(errors({ ...loaded, min_hp: -1, max_atk: 1.5, max_level: 0 })).toMatchObject({
			min_hp: 'Must be at least 0',
			max_atk: 'Must be a whole number',
			max_level: 'Must be at least 1'
		})
		expect(errors({ ...initialValues(def), summon_id: -1 }, 'create')).toMatchObject({
			summon_id: 'Must be at least 0'
		})
	})
})

describe('summons resource: derive', () => {
	const set = (values: Values, key: string, value: unknown) =>
		applyDerive(def, { ...values, [key]: value }, key)

	it('stacks the uncaps', () => {
		const loaded = fromRecord(def, transcended)
		expect(set(loaded, 'flb', false)).toMatchObject({ ulb: false, transcendence: false })
		expect(set(loaded, 'ulb', false)).toMatchObject({ flb: true, transcendence: false })
		const plain = fromRecord(def, sparse)
		expect(set(plain, 'transcendence', true)).toMatchObject({ flb: true, ulb: true })
	})

	it('follows the rarity and uncaps with the standard max level', () => {
		const created = initialValues(def)
		expect(set(created, 'flb', true).max_level).toBe(150)
		expect(set(created, 'transcendence', true).max_level).toBe(250)
		expect(set(created, 'rarity', 1).max_level).toBe(50)
		expect(set({ ...created, rarity: 2 }, 'flb', true).max_level).toBe(150)
		expect(set(created, 'rarity', 2).max_level).toBe(75)
	})

	it('keeps the stored or typed level until the rarity or an uncap changes', () => {
		// Morgana Car: FLB and ULB, stored at 150
		const loaded = fromRecord(def, { ...flb, uncap: { flb: true, ulb: true }, maxLevel: 150 })
		expect(loaded.max_level).toBe(150)
		expect(set(loaded, 'subaura', true).max_level).toBe(150)
		expect(set(loaded, 'max_level', 175).max_level).toBe(175)
	})
})
