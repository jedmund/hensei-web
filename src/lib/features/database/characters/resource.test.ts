/**
 * Parity: the characters resource must reproduce what the hand-written
 * characters pages did: the old grid's columns (where the new list keeps
 * them), and the edit and new pages' payloads (transcribed below), with the
 * changes decided for GBF-143 applied on top.
 */
import { describe, expect, it, vi } from 'vitest'

const adapter = vi.hoisted(() => ({
	createCharacter: vi.fn(),
	validateCharacterGranblueId: vi.fn(),
	downloadCharacterImages: vi.fn()
}))
vi.mock('$lib/api/adapters/character.adapter', async (importOriginal) => {
	const actual = await importOriginal<typeof import('$lib/api/adapters/character.adapter')>()
	return { ...actual, characterAdapter: Object.assign(actual.characterAdapter, adapter) }
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
import type { Character } from '$lib/api/adapters/character.adapter'
import type { AdminCharacterRow } from '$lib/types/api/admin'
import { charactersResource as def } from './resource'
import { detailRecords } from './__fixtures__/detailRecords'

const { transcended, story, style } = detailRecords

// --- List ---

describe('characters resource: list', () => {
	const columns = columnsFor(def)
	const column = (id: string) => columns.find((c) => c.id === id)!

	it("keeps the old grid's columns, with Last updated (latest_date) shown", () => {
		expect(columns.map((c) => [c.id, columnHeader(c), c.defaultHidden ?? false])).toEqual([
			['image', '', false],
			['name', 'Name', false],
			['rarity', 'Rarity', false],
			['element', 'Element', false],
			['proficiency', 'Proficiency', false],
			['uncap', 'Uncap', false],
			['series', 'Series', true],
			['season', 'Season', true],
			['gender', 'Gender', true],
			['special', 'Special', true],
			['style_swap', 'Style Swap', true],
			['flb', 'FLB', true],
			['ulb', 'ULB', true],
			['transcendence', 'Transcendence', true],
			['max_transcendence_stage', 'Max trans. stage', true],
			['release_date', 'Release date', true],
			['flb_date', 'FLB date', true],
			['ulb_date', 'ULB date', true],
			['transcendence_date', 'Transcendence date', true],
			['latest_date', 'Last updated', false],
			['updated_at', 'Last edited', true],
			['skill_count', 'Skills', true]
		])
	})

	it('reads both proficiencies, the series names and the uncap state from a row', () => {
		const row = {
			granblueId: '3040169000',
			proficiency1: 9,
			proficiency2: 2,
			maxTranscendenceStage: 5,
			series: [
				{ id: 's1', slug: 'fantasy', nameEn: 'Fantasy', nameJp: null },
				{ id: 's2', slug: 'summer', nameEn: 'Summer', nameJp: null }
			]
		} as unknown as AdminCharacterRow
		expect(column('proficiency').value?.(row)).toEqual([9, 2])
		expect(column('proficiency').type).toBe('proficiency')
		expect(column('series').value?.(row)).toBe('Fantasy, Summer')
		expect(column('max_transcendence_stage').value?.(row)).toBe(5)
		expect(column('uncap').fields).toEqual([
			'flb',
			'ulb',
			'transcendence',
			'max_transcendence_stage',
			'special'
		])
	})

	it('filters on element, rarity, proficiency, series, season, gender, uncap, type, quality and edits', () => {
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
			['proficiency', 'multi'],
			['series', 'multi'],
			['season', 'multi'],
			['gender', 'multi'],
			['uncap', ['flb:FLB', 'ulb:ULB', 'transcendence:Transcendence']],
			['type', ['special:Special', 'style_swap:Style shift']],
			['quality', ['missing_name_jp:Missing JA name', 'no_skills:No skills']],
			['updated_at', 'recent']
		])
		const element = filters.find((f) => f.kind === 'multi' && f.key === 'element')
		if (element?.kind !== 'multi') throw new Error('no element filter')
		// Lyria and the MC are Null
		expect(element.options().map((o) => o.value)).toContain('0')
		expect(filterQueries(def).map(([key, query]) => [key, query().queryKey])).toEqual([
			['series', ['characterSeries', 'list']]
		])
	})

	it('gives style shifts their own row id, and colours rows by element', () => {
		const rowId = def.list.rowId!
		expect(rowId({ granblueId: '3040088000', styleSwap: true } as AdminCharacterRow)).toBe(
			'3040088000-style'
		)
		expect(rowId({ granblueId: '3040088000', styleSwap: false } as AdminCharacterRow)).toBe(
			'3040088000'
		)
		expect(def.list.baseFields).toContain('style_swap')
		expect(def.list.element).toBe('element')
	})

	it('sorts by Last updated, then name', () => {
		expect(def.list.defaultSort).toEqual([
			{ id: 'latest_date', desc: true },
			{ id: 'name', desc: false }
		])
	})
})

// --- Edit: the old page, transcribed ---

/** The edit page's form state from the record (its `$effect`) */
function legacyEditData(character: Character) {
	return {
		name: character.name?.en || '',
		nameJp: character.name?.ja || '',
		granblueId: character.granblueId || '',
		characterId: character.characterId?.join(', ') || '',
		rarity: character.rarity || 1,
		element: character.element || 0,
		race1: character.race?.[0] ?? null,
		race2: character.race?.[1] ?? null,
		gender: character.gender || 0,
		proficiency1: character.proficiency?.[0] || 0,
		proficiency2: character.proficiency?.[1] || 0,
		season: character.season || 0,
		series: (character.series ?? []).flatMap((s) => (typeof s === 'object' ? [s.id] : [])),
		minHp: character.hp?.minHp || 0,
		maxHp: character.hp?.maxHp || 0,
		maxHpFlb: character.hp?.maxHpFlb || 0,
		maxHpUlb: character.hp?.maxHpUlb || 0,
		maxHpTranscendence: character.hp?.maxHpTranscendence || 0,
		minAtk: character.atk?.minAtk || 0,
		maxAtk: character.atk?.maxAtk || 0,
		maxAtkFlb: character.atk?.maxAtkFlb || 0,
		maxAtkUlb: character.atk?.maxAtkUlb || 0,
		maxAtkTranscendence: character.atk?.maxAtkTranscendence || 0,
		baseDa: character.baseDa || 0,
		baseTa: character.baseTa || 0,
		ougiRatio: character.ougiRatio?.ougiRatio || 0,
		ougiRatioFlb: character.ougiRatio?.ougiRatioFlb || 0,
		flb: character.uncap?.flb ?? false,
		ulb: character.uncap?.ulb ?? false,
		transcendence: character.uncap?.transcendence ?? false,
		maxTranscendenceStage: character.uncap?.transcendence
			? (character.uncap?.maxTranscendenceStage ?? 5)
			: 0,
		special: character.special || false,
		gender_variants: character.genderVariants || false,
		styleSwap: character.styleSwap || false,
		styleNameEn: character.styleName?.en || '',
		styleNameJp: character.styleName?.ja || '',
		releaseDate: character.releaseDate || '',
		flbDate: character.flbDate || '',
		ulbDate: character.ulbDate || '',
		transcendenceDate: character.transcendenceDate || '',
		nicknamesEn: character.nicknames?.en || [],
		nicknamesJp: character.nicknames?.ja || [],
		wikiEn: character.wiki?.en || '',
		wikiJa: character.wiki?.ja || '',
		gamewith: character.gamewith || '',
		kamigame: character.kamigame || ''
	}
}

/** The edit page's `saveChanges` payload */
function legacyEditPayload(e: ReturnType<typeof legacyEditData>) {
	return {
		name_en: e.name,
		name_jp: e.nameJp,
		granblue_id: e.granblueId,
		character_id:
			e.characterId.trim() === ''
				? []
				: e.characterId
						.split(',')
						.map((id) => Number(id.trim()))
						.filter((id) => !isNaN(id)),
		rarity: e.rarity,
		element: e.element,
		race1: e.race1,
		race2: e.race2,
		gender: e.gender,
		proficiency1: e.proficiency1,
		proficiency2: e.proficiency2,
		season: e.season || undefined,
		series: e.series,
		min_hp: e.minHp,
		max_hp: e.maxHp,
		max_hp_flb: e.maxHpFlb,
		max_hp_ulb: e.maxHpUlb,
		max_hp_transcendence: e.maxHpTranscendence,
		min_atk: e.minAtk,
		max_atk: e.maxAtk,
		max_atk_flb: e.maxAtkFlb,
		max_atk_ulb: e.maxAtkUlb,
		max_atk_transcendence: e.maxAtkTranscendence,
		base_da: e.baseDa,
		base_ta: e.baseTa,
		ougi_ratio: e.ougiRatio,
		ougi_ratio_flb: e.ougiRatioFlb,
		flb: e.flb,
		ulb: e.ulb,
		transcendence: e.transcendence,
		max_transcendence_stage: e.transcendence ? e.maxTranscendenceStage : 0,
		special: e.special,
		gender_variants: e.gender_variants,
		style_swap: e.styleSwap,
		style_name_en: e.styleNameEn || undefined,
		style_name_jp: e.styleNameJp || undefined,
		release_date: e.releaseDate || undefined,
		flb_date: e.flbDate || undefined,
		ulb_date: e.ulbDate || undefined,
		transcendence_date: e.transcendenceDate || undefined,
		nicknames_en: e.nicknamesEn,
		nicknames_jp: e.nicknamesJp,
		wiki_en: e.wikiEn || undefined,
		wiki_ja: e.wikiJa || undefined,
		gamewith: e.gamewith || undefined,
		kamigame: e.kamigame || undefined
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
	'max_hp_transcendence',
	'min_atk',
	'max_atk',
	'max_atk_flb',
	'max_atk_ulb',
	'max_atk_transcendence',
	'base_da',
	'base_ta',
	'ougi_ratio',
	'ougi_ratio_flb',
	'proficiency2'
]
/** Fields the old page left out when blank, so they couldn't be cleared */
const OMITTED_WHEN_BLANK = [
	'season',
	'style_name_en',
	'style_name_jp',
	'release_date',
	'flb_date',
	'ulb_date',
	'transcendence_date',
	'wiki_en',
	'wiki_ja',
	'gamewith',
	'kamigame'
]
/** Shown only for an uncap, or a style shift */
const GATED: Record<string, (p: Record<string, unknown>) => boolean> = {
	max_hp_flb: (p) => p.flb === true,
	max_atk_flb: (p) => p.flb === true,
	ougi_ratio_flb: (p) => p.flb === true,
	flb_date: (p) => p.flb === true,
	max_hp_ulb: (p) => p.ulb === true,
	max_atk_ulb: (p) => p.ulb === true,
	ulb_date: (p) => p.ulb === true,
	max_hp_transcendence: (p) => p.transcendence === true,
	max_atk_transcendence: (p) => p.transcendence === true,
	transcendence_date: (p) => p.transcendence === true,
	max_transcendence_stage: (p) => p.transcendence === true,
	style_name_en: (p) => p.style_swap === true,
	style_name_jp: (p) => p.style_swap === true
}

/**
 * GBF-143: what the generated form sends differently from the old edit page,
 * as decided with the maintainer. Applied to the legacy payload, so the
 * parity test still pins every other key.
 * - Blanks send null, so they can be cleared: stats and the second
 *   proficiency no longer send 0, and the season, style names, dates and
 *   links are no longer left out.
 * - Fields hidden by the uncap or style state aren't sent (the old page sent
 *   them unchanged); the API zeroes the transcendence stage without
 *   transcendence.
 */
function decided(legacy: Record<string, unknown>, character: Character) {
	const out = { ...legacy }
	const blank = (v: unknown) => v === undefined || v === null || v === ''
	const raw = wire(toPayload(def, fromRecord(def, character), 'edit'))
	for (const key of ZERO_WHEN_BLANK) if (out[key] === 0 && raw[key] === null) out[key] = null
	for (const key of OMITTED_WHEN_BLANK) if (blank(out[key])) out[key] = null
	for (const [key, shown] of Object.entries(GATED)) if (!shown(out)) delete out[key]
	return out
}

const editPayload = (character: Character) =>
	wire(toPayload(def, fromRecord(def, character), 'edit'))
const legacyEdit = (character: Character) => wire(legacyEditPayload(legacyEditData(character)))

describe('characters resource: edit payload parity', () => {
	it('matches the edit page for a transcended character, with the decided changes', () => {
		expect(editPayload(transcended)).toEqual(decided(legacyEdit(transcended), transcended))
	})

	it('matches the edit page for a story character with ULB', () => {
		expect(editPayload(story)).toEqual(decided(legacyEdit(story), story))
	})

	it('matches the edit page for a style shift', () => {
		expect(editPayload(style)).toEqual(decided(legacyEdit(style), style))
	})

	it('sends blanks as null rather than 0 or nothing', () => {
		const payload = editPayload(detailRecords.sparse as Character)
		expect(payload).toMatchObject({
			name_jp: null,
			min_hp: null,
			base_da: null,
			ougi_ratio: null,
			proficiency2: null,
			race1: null,
			season: null,
			release_date: null,
			wiki_en: null,
			character_id: [],
			series: [],
			nicknames_en: []
		})
		expect(payload).not.toHaveProperty('max_hp_flb')
		expect(payload).not.toHaveProperty('max_transcendence_stage')
	})

	it('clears the other uncap track: ULB off a regular character, transcendence off a story one', () => {
		expect(editPayload(transcended)).toMatchObject({ ulb: false, transcendence: true })
		expect(editPayload(story)).toMatchObject({ ulb: true, transcendence: false })
	})

	it('reads the record into form values', () => {
		expect(fromRecord(def, transcended)).toMatchObject({
			name: { en: 'Nier', ja: 'ニーア' },
			character_id: [4004],
			proficiency1: 9,
			proficiency2: 2,
			race1: 1,
			race2: null,
			series: ['series-fantasy', 'series-summer'],
			max_transcendence_stage: 5,
			ougi_ratio: 4.5,
			style_name: { en: '', ja: '' }
		})
		// None (0) reads as blank
		expect(fromRecord(def, style).proficiency2).toBeNull()
	})
})

// --- New ---

/** The keys the old new page sent */
const LEGACY_CREATE_KEYS = [
	'granblue_id',
	'name_en',
	'name_jp',
	'character_id',
	'rarity',
	'element',
	'race1',
	'race2',
	'gender',
	'proficiency1',
	'proficiency2',
	'min_hp',
	'max_hp',
	'max_hp_flb',
	'max_hp_ulb',
	'max_hp_transcendence',
	'min_atk',
	'max_atk',
	'max_atk_flb',
	'max_atk_ulb',
	'max_atk_transcendence',
	'base_da',
	'base_ta',
	'ougi_ratio',
	'ougi_ratio_flb',
	'flb',
	'ulb',
	'transcendence',
	'max_transcendence_stage',
	'special',
	'style_swap',
	'style_name_en',
	'style_name_jp',
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

describe('characters resource: create payload parity', () => {
	it("sends the new page's keys, plus series, season and gender variants, without hidden fields", () => {
		const sent = Object.keys(toPayload(def, initialValues(def), 'create'))
		const hidden = Object.entries(GATED)
			.filter(([key]) => key !== 'ulb')
			.map(([key]) => key)
		const expected = [
			...LEGACY_CREATE_KEYS.filter((key) => !hidden.includes(key)),
			'series',
			'season',
			'gender_variants'
		]
		expect(sent.toSorted()).toEqual(expected.toSorted())
	})

	it('starts from the new page defaults, with the first proficiency to pick', () => {
		expect(initialValues(def)).toMatchObject({
			rarity: 3,
			element: 0,
			gender: 0,
			proficiency1: null,
			flb: false,
			special: false,
			style_swap: false
		})
	})

	it('creates through the adapter, then queues the image download', async () => {
		adapter.downloadCharacterImages.mockResolvedValue({})
		await def.save!.afterCreate!(transcended)
		expect(adapter.downloadCharacterImages).toHaveBeenCalledWith('c-transcended')
	})

	it('goes to a new style shift on its own page', () => {
		expect(recordHref(def, transcended)).toBe('/database/characters/3040169000')
		expect(recordHref(def, style)).toBe('/database/characters/3040088000/style')
	})

	it('checks the Granblue ID is free (unless the new one is a style shift) and has images', async () => {
		const check = def.save!.asyncValidate!.granblue_id!
		adapter.validateCharacterGranblueId.mockResolvedValue({ valid: true, existsInDb: true })
		expect(await check('3040169000', {})).toBe('A character with this Granblue ID already exists')
		expect(await check('3040169000', { style_swap: true })).toBeNull()
		adapter.validateCharacterGranblueId.mockResolvedValue({ valid: true, existsInDb: false })
		expect(await check('3040169000', {})).toBeNull()
		adapter.validateCharacterGranblueId.mockResolvedValue({
			valid: false,
			existsInDb: false,
			error: 'No images'
		})
		expect(await check('3040169000', {})).toBe('No images')
	})
})

describe('characters resource: forms', () => {
	it('edit the writable fields, with the uncap stars as a preview and no read-only rows', () => {
		const keys = formSections(def, 'edit').map(({ section, fields }) => [
			section.id,
			fields.map((f) => f.key)
		])
		expect(keys).toEqual([
			['metadata', ['name', 'rarity', 'granblue_id', 'character_id', 'series', 'season']],
			['uncap', ['uncap', 'flb', 'ulb', 'transcendence', 'max_transcendence_stage', 'special']],
			['appearance', ['gender_variants']],
			[
				'details',
				[
					'element',
					'race1',
					'race2',
					'gender',
					'proficiency1',
					'proficiency2',
					'style_swap',
					'style_name'
				]
			],
			['hp', ['min_hp', 'max_hp', 'max_hp_flb', 'max_hp_transcendence', 'max_hp_ulb']],
			['attack', ['min_atk', 'max_atk', 'max_atk_flb', 'max_atk_transcendence', 'max_atk_ulb']],
			['other', ['base_da', 'base_ta', 'ougi_ratio', 'ougi_ratio_flb']],
			['nicknames', ['nicknames']],
			['dates', ['release_date', 'flb_date', 'transcendence_date', 'ulb_date']],
			['links', ['wiki_en', 'wiki_ja', 'gamewith', 'kamigame']]
		])
	})
})

// --- Validation and derive ---

function errors(values: Values, mode: 'edit' | 'create' = 'edit') {
	const result = buildZod(def, mode).safeParse(values, { error: issueMessage })
	return result.success ? {} : issueErrors(result.error.issues)
}

describe('characters resource: validation', () => {
	const loaded = fromRecord(def, transcended)

	it('accepts loaded characters', () => {
		expect(errors(loaded)).toEqual({})
		expect(errors(fromRecord(def, story))).toEqual({})
		expect(errors(fromRecord(def, style))).toEqual({})
	})

	it('requires a 10-digit Granblue ID, an English name and a first proficiency', () => {
		expect(
			errors({
				...loaded,
				granblue_id: '303009300',
				name: { en: ' ', ja: '' },
				proficiency1: null
			})
		).toMatchObject({
			granblue_id: 'Granblue ID must be 10 digits, optionally with a form suffix like -1',
			'name.en': 'Required',
			proficiency1: 'Choose one of the options'
		})
	})

	it("accepts a form suffix on the Granblue ID (Malinda's forms)", () => {
		expect(errors({ ...loaded, granblue_id: '3030093000-1' })).toEqual({})
		expect(errors({ ...loaded, granblue_id: '3030093000-' })).toHaveProperty('granblue_id')
	})

	it('takes decimal charge attack ratios and whole-number stats and IDs', () => {
		expect(errors({ ...loaded, ougi_ratio: 4.5, ougi_ratio_flb: 5.25 })).toEqual({})
		expect(
			errors({ ...loaded, base_da: 7.5, min_hp: -1, character_id: [12, Number('x')] })
		).toMatchObject({
			base_da: 'Must be a whole number',
			min_hp: 'Must be at least 0',
			// A list item that isn't a number
			'character_id.1': 'Must be a number'
		})
	})

	it("keeps the model's uncap rules", () => {
		expect(errors({ ...loaded, max_transcendence_stage: null })).toMatchObject({
			max_transcendence_stage: expect.any(String)
		})
		expect(errors({ ...loaded, special: true, transcendence: true })).toMatchObject({
			transcendence: 'Special characters use ULB'
		})
		expect(errors({ ...loaded, ulb: true })).toMatchObject({
			ulb: 'ULB requires a special character with FLB'
		})
		expect(errors({ ...fromRecord(def, story), flb: false })).toMatchObject({
			ulb: 'ULB requires a special character with FLB'
		})
	})
})

describe('characters resource: derive', () => {
	const set = (values: Values, key: string, value: unknown) =>
		applyDerive(def, { ...values, [key]: value }, key)

	it('cascades the uncaps', () => {
		const loaded = fromRecord(def, transcended)
		expect(set(loaded, 'flb', false)).toMatchObject({
			ulb: false,
			transcendence: false,
			max_transcendence_stage: null
		})
		expect(set(loaded, 'transcendence', false)).toMatchObject({ max_transcendence_stage: null })
		const plain = fromRecord(def, style)
		expect(set(plain, 'transcendence', true)).toMatchObject({ flb: true })
		expect(set({ ...plain, special: true }, 'ulb', true)).toMatchObject({ flb: true })
	})

	it('switching special clears the other track', () => {
		expect(set(fromRecord(def, transcended), 'special', true)).toMatchObject({
			transcendence: false,
			max_transcendence_stage: null
		})
		expect(set(fromRecord(def, story), 'special', false)).toMatchObject({ ulb: false })
	})

	it('changes nothing on load', () => {
		expect(fromRecord(def, transcended)).toMatchObject({ flb: true, transcendence: true })
	})
})
