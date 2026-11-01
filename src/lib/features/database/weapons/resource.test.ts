/**
 * Parity: the weapons resource must reproduce what the hand-written weapons
 * pages did: the list's columns and filters (pinned as fixtures below), and
 * the edit and new pages' payloads (transcribed below).
 */
import { describe, expect, it } from 'vitest'
import {
	labelText,
	resolveOptions,
	type FilterConfig,
	type ResolvedOption
} from '$lib/components/data-table/filters'
import { columnHeader, type DataTableColumn } from '$lib/components/data-table/types'
import {
	columnsFor,
	filterQueries,
	filtersFor,
	titleFor
} from '$lib/features/database/schema/columns'
import {
	applyDerive,
	fromRecord,
	initialValues,
	toPayload
} from '$lib/features/database/schema/form'
import { isShown } from '$lib/features/database/schema/fields'
import { buildZod } from '$lib/features/database/schema/validation'
import type { Values } from '$lib/features/database/schema/types'
import type { Weapon } from '$lib/api/adapters/weapon.adapter'
import type { AdminWeaponRow } from '$lib/types/api/admin'
import type { WeaponSeries } from '$lib/types/api/weaponSeries'
import WeaponUncapCell from '$lib/components/database/cells/WeaponUncapCell.svelte'
import { weaponsResource } from './resource'

// --- List ---

const rows: AdminWeaponRow[] = [
	{
		id: 'w1',
		granblueId: '1040001000',
		nameEn: 'Cosmic Sword',
		nameJp: 'コスモスソード',
		element: 3,
		rarity: 3,
		proficiency: 1,
		seriesId: 's1',
		seriesSlug: 'cosmos',
		seriesNameEn: 'Cosmos',
		seriesNameJp: 'コスモス',
		releaseDate: '2016-03-10',
		updatedAt: '2026-10-30T12:00:00Z',
		skillCount: 2,
		flb: true,
		ulb: false,
		transcendence: false,
		flbDate: '2017-01-01',
		ulbDate: null,
		transcendenceDate: null,
		latestDate: '2017-01-01'
	},
	{
		id: 'w2',
		granblueId: '1040002000',
		nameEn: null,
		nameJp: null,
		element: null,
		rarity: null,
		proficiency: null,
		seriesId: null,
		seriesSlug: null,
		releaseDate: null,
		updatedAt: '2026-10-29T12:00:00Z'
	}
]

const ROW_FUNCTIONS = ['value', 'sortValue', 'searchValue', 'name'] as const

/** Closures differ by identity, so compare what they produce for each row */
function normalizeColumn(column: DataTableColumn<AdminWeaponRow>) {
	const out: Record<string, unknown> = { ...column, header: columnHeader(column) }
	for (const key of ROW_FUNCTIONS) {
		const fn = out[key]
		if (typeof fn === 'function') out[key] = rows.map((row) => fn(row))
	}
	return out
}

/** Option images are URLs from the shared helpers: pin that there is one */
function normalizeOption(option: ResolvedOption) {
	const { image, indicatorColor, ...rest } = option
	return { ...rest, ...(image ? { image: true } : {}), ...(indicatorColor ? { color: true } : {}) }
}

function normalizeFilter(filter: FilterConfig) {
	const label = labelText(filter.label)
	switch (filter.kind) {
		case 'multi':
			return {
				...filter,
				label,
				options: resolveOptions(filter.options(), undefined, []).map(normalizeOption)
			}
		case 'toggles':
			return {
				...filter,
				label,
				toggles: filter.toggles.map((t) => ({ ...t, label: labelText(t.label) }))
			}
		case 'recent':
			return {
				...filter,
				label,
				presets: filter.presets.map((p) => ({ ...p, label: labelText(p.label) }))
			}
	}
}

const series = [
	{ id: 'uuid-b', slug: 'opus', order: 2, name: { en: 'Opus', ja: 'オプス' } },
	{ id: 'uuid-a', slug: 'cosmos', order: 1, name: { en: 'Cosmos', ja: 'コスモス' } }
] as WeaponSeries[]

const date = (id: string, header: string, value: unknown[], hidden = false) => ({
	id,
	header,
	type: 'date',
	value,
	...(hidden ? { defaultHidden: true } : {}),
	fields: [id]
})

/** What the hand-written weapons list (WeaponsTable) produced, for the rows above */
const EXPECTED_COLUMNS = [
	{
		id: 'image',
		header: '',
		type: 'image',
		image: 'weapon',
		sortable: false,
		hideable: false,
		width: '96px',
		minWidth: '96px',
		fields: ['element']
	},
	{
		id: 'name',
		header: 'Name',
		type: 'name',
		name: [
			{ en: 'Cosmic Sword', ja: 'コスモスソード' },
			{ en: null, ja: null }
		],
		sortField: 'name_en',
		primary: true,
		minWidth: '220px',
		fields: ['name_en', 'name_jp']
	},
	{
		id: 'rarity',
		header: 'Rarity',
		type: 'text',
		value: ['SSR', null],
		sortValue: [3, null],
		width: '80px',
		fields: ['rarity']
	},
	{ id: 'element', header: 'Element', type: 'element', value: [3, null], fields: ['element'] },
	{
		id: 'proficiency',
		header: 'Proficiency',
		type: 'proficiency',
		value: [1, null],
		fields: ['proficiency']
	},
	{
		id: 'uncap',
		header: 'Uncap',
		type: 'component',
		component: WeaponUncapCell,
		sortable: false,
		width: '144px',
		fields: ['flb', 'ulb', 'transcendence']
	},
	{
		id: 'series',
		header: 'Series',
		type: 'text',
		value: ['Cosmos', null],
		sortable: false,
		width: '172px',
		fields: ['series_name_en', 'series_name_jp']
	},
	date('release_date', 'Release date', ['2016-03-10', null]),
	date('flb_date', 'FLB date', ['2017-01-01', undefined], true),
	date('ulb_date', 'ULB date', [null, undefined], true),
	date('transcendence_date', 'Transcendence date', [null, undefined], true),
	date('latest_date', 'Last updated', ['2017-01-01', undefined]),
	date('updated_at', 'Last edited', ['2026-10-30T12:00:00Z', '2026-10-29T12:00:00Z'], true),
	{
		id: 'skill_count',
		header: 'Skills',
		type: 'number',
		value: [2, undefined],
		sortable: false,
		align: 'end',
		defaultHidden: true,
		fields: ['skill_count']
	}
]

const labelled = (entries: [string, string][], extra: object = {}) =>
	entries.map(([value, label]) => ({ value, label, ...extra }))

const toggle = (key: string, label: string) => ({ key, label })

const EXPECTED_FILTERS = [
	{
		kind: 'multi',
		key: 'element',
		label: 'Element',
		options: labelled(
			[
				['1', 'Fire'],
				['2', 'Water'],
				['3', 'Earth'],
				['4', 'Wind'],
				['5', 'Light'],
				['6', 'Dark'],
				['0', 'Null']
			],
			{ image: true, color: true }
		),
		facet: true
	},
	{
		kind: 'multi',
		key: 'rarity',
		label: 'Rarity',
		options: labelled(
			[
				['1', 'R'],
				['2', 'SR'],
				['3', 'SSR']
			],
			{ image: true }
		),
		facet: true
	},
	{
		kind: 'multi',
		key: 'proficiency',
		label: 'Proficiency',
		options: labelled(
			[
				['1', 'Sabre'],
				['2', 'Dagger'],
				['3', 'Spear'],
				['4', 'Axe'],
				['5', 'Staff'],
				['6', 'Gun'],
				['7', 'Melee'],
				['8', 'Bow'],
				['9', 'Harp'],
				['10', 'Katana']
			],
			{ image: true }
		),
		facet: true
	},
	{
		kind: 'multi',
		key: 'series',
		label: 'Series',
		// Sorted by series order, then "No series"
		options: labelled([
			['cosmos', 'Cosmos'],
			['opus', 'Opus'],
			['none', 'No series']
		]),
		facet: true
	},
	{
		kind: 'toggles',
		id: 'uncap',
		label: 'Uncap',
		toggles: [toggle('flb', 'FLB'), toggle('ulb', 'ULB'), toggle('transcendence', 'Transcendence')]
	},
	{
		kind: 'toggles',
		id: 'type',
		label: 'Type',
		toggles: [toggle('extra', 'Extra'), toggle('limit', 'Limited')]
	},
	{
		kind: 'toggles',
		id: 'quality',
		label: 'Data quality',
		toggles: [toggle('missing_name_jp', 'Missing JA name'), toggle('no_skills', 'No skills')]
	},
	{
		kind: 'recent',
		key: 'updated_at',
		label: 'Last edited',
		presets: [
			{ days: 7, label: 'Last 7 days' },
			{ days: 30, label: 'Last 30 days' }
		]
	}
]

describe('weapons resource: list', () => {
	it('generates the columns the hand-written list had', () => {
		expect(columnsFor(weaponsResource).map(normalizeColumn)).toEqual(EXPECTED_COLUMNS)
	})

	it('generates the filters the hand-written list had', () => {
		expect(filtersFor(weaponsResource, { series: () => series }).map(normalizeFilter)).toEqual(
			EXPECTED_FILTERS
		)
	})

	it('reads the series list lazily', () => {
		const loaded: { data?: WeaponSeries[] } = {}
		const [seriesFilter] = filtersFor(weaponsResource, { series: () => loaded.data }).filter(
			(f) => f.kind === 'multi' && f.key === 'series'
		)
		if (seriesFilter?.kind !== 'multi') throw new Error('no series filter')
		expect(seriesFilter.options().map((o) => o.value)).toEqual(['none'])
		loaded.data = series
		expect(seriesFilter.options().map((o) => o.value)).toEqual(['cosmos', 'opus', 'none'])
	})

	it('loads the series list for its filter', () => {
		expect(filterQueries(weaponsResource).map(([key, query]) => [key, query().queryKey])).toEqual([
			['series', ['weaponSeries', 'list']]
		])
	})

	it('titles rows by name', () => {
		const title = titleFor(weaponsResource)
		expect(rows.map(title)).toEqual(['Cosmic Sword', '—'])
	})

	it('keeps the base fields and default sort', () => {
		expect(weaponsResource.list.baseFields).toEqual(['granblue_id', 'name_en', 'name_jp'])
		expect(weaponsResource.list.defaultSort).toEqual([
			{ id: 'latest_date', desc: true },
			{ id: 'name', desc: false }
		])
	})
})

// --- Edit and new: today's pages, transcribed ---

/** WeaponStatsSection's $effect, which runs on mount and on uncap changes */
function legacyLevelCaps(d: { flb: boolean; ulb: boolean; transcendence: boolean }) {
	if (d.transcendence) return { maxLevel: 250, maxSkillLevel: 25 }
	if (d.ulb) return { maxLevel: 200, maxSkillLevel: 20 }
	if (d.flb) return { maxLevel: 150, maxSkillLevel: 15 }
	return { maxLevel: 100, maxSkillLevel: 10 }
}

/** weapons/screens/WeaponEditScreen.svelte: the load $effect */
function legacyEditData(weapon: Weapon) {
	const editData = {
		name: weapon.name?.en || '',
		nameJp: weapon.name?.ja || '',
		granblue_id: weapon.granblueId || '',
		rarity: weapon.rarity || 3,
		element: weapon.element || 0,
		proficiency: weapon.proficiency || 0,
		series: weapon.series?.id || '',
		minHp: weapon.hp?.minHp || 0,
		maxHp: weapon.hp?.maxHp || 0,
		maxHpFlb: weapon.hp?.maxHpFlb || 0,
		maxHpUlb: weapon.hp?.maxHpUlb || 0,
		minAtk: weapon.atk?.minAtk || 0,
		maxAtk: weapon.atk?.maxAtk || 0,
		maxAtkFlb: weapon.atk?.maxAtkFlb || 0,
		maxAtkUlb: weapon.atk?.maxAtkUlb || 0,
		maxLevel: weapon.maxLevel || 100,
		maxSkillLevel: weapon.maxSkillLevel || 10,
		maxAwakeningLevel: weapon.maxAwakeningLevel ?? null,
		maxExorcismLevel: weapon.maxExorcismLevel ?? null,
		flb: weapon.uncap?.flb || false,
		ulb: weapon.uncap?.ulb || false,
		transcendence: weapon.uncap?.transcendence || false,
		extraPrerequisite: (weapon.uncap?.extraPrerequisite ?? '') as number | '',
		extra: weapon.extra || false,
		limit: Boolean(weapon.limit),
		promotions: weapon.promotions || [],
		releaseDate: weapon.releaseDate || '',
		flbDate: weapon.flbDate || '',
		ulbDate: weapon.ulbDate || '',
		transcendenceDate: weapon.transcendenceDate || '',
		wikiEn: weapon.wiki?.en || '',
		wikiJa: weapon.wiki?.ja || '',
		gamewith: weapon.gamewith || '',
		kamigame: weapon.kamigame || '',
		nicknamesEn: weapon.nicknames?.en || [],
		nicknamesJp: weapon.nicknames?.ja || [],
		recruits:
			typeof weapon.recruits === 'string' ? weapon.recruits : (weapon.recruits?.granblueId ?? ''),
		forgedFrom: (weapon.forgedFrom?.granblueId || null) as string | null,
		forgeOrder: weapon.forgeOrder ?? null,
		awakeningIds: (weapon.awakenings ?? []).map((a) => a.id),
		weaponSeriesVariantId: weapon.series?.weaponSeriesVariantId || '',
		elementVariantIds: weapon.elementVariantIds || {},
		bulletSlots: weapon.bulletSlots || []
	}
	return { ...editData, ...legacyLevelCaps(editData) }
}

/** weapons/screens/WeaponEditScreen.svelte: saveChanges */
function legacyEditPayload(editData: ReturnType<typeof legacyEditData>) {
	return {
		name_en: editData.name,
		name_jp: editData.nameJp || undefined,
		granblue_id: editData.granblue_id,
		rarity: editData.rarity,
		element: editData.element,
		proficiency: editData.proficiency,
		series: editData.series || undefined,
		min_hp: editData.minHp,
		max_hp: editData.maxHp,
		max_hp_flb: editData.maxHpFlb,
		max_hp_ulb: editData.maxHpUlb,
		min_atk: editData.minAtk,
		max_atk: editData.maxAtk,
		max_atk_flb: editData.maxAtkFlb,
		max_atk_ulb: editData.maxAtkUlb,
		max_level: editData.maxLevel,
		max_skill_level: editData.maxSkillLevel,
		max_awakening_level: editData.maxAwakeningLevel || null,
		max_exorcism_level: editData.maxExorcismLevel,
		flb: editData.flb,
		ulb: editData.ulb,
		transcendence: editData.transcendence,
		extra_prerequisite: editData.extraPrerequisite === '' ? null : editData.extraPrerequisite,
		extra: editData.extra,
		limit: editData.limit,
		promotions: editData.promotions,
		release_date: editData.releaseDate || null,
		flb_date: editData.flbDate || null,
		ulb_date: editData.ulbDate || null,
		transcendence_date: editData.transcendenceDate || null,
		wiki_en: editData.wikiEn,
		wiki_ja: editData.wikiJa,
		gamewith: editData.gamewith,
		kamigame: editData.kamigame,
		nicknames_en: editData.nicknamesEn,
		nicknames_jp: editData.nicknamesJp,
		recruits: editData.recruits || undefined,
		forged_from: editData.forgedFrom || null,
		forge_order: editData.forgeOrder,
		awakening_ids: editData.awakeningIds,
		weapon_series_variant_id: editData.weaponSeriesVariantId || null,
		element_variant_ids:
			Object.keys(editData.elementVariantIds).length > 0 ? editData.elementVariantIds : null,
		bullet_slots: editData.bulletSlots
	}
}

/** weapons/new/+page.svelte: the initial editData */
function legacyNewData() {
	return {
		name: '',
		nameJp: '',
		granblueId: '',
		rarity: 3,
		element: 0,
		proficiency: 0,
		series: 0 as number | string,
		newSeries: 0,
		promotions: [] as number[],
		minHp: 0,
		maxHp: 0,
		maxHpFlb: 0,
		maxHpUlb: 0,
		minAtk: 0,
		maxAtk: 0,
		maxAtkFlb: 0,
		maxAtkUlb: 0,
		maxLevel: 100,
		maxSkillLevel: 10,
		maxAwakeningLevel: null as number | null,
		maxExorcismLevel: null as number | null,
		flb: false,
		ulb: false,
		transcendence: false,
		extraPrerequisite: '' as number | '',
		extra: false,
		limit: false,
		releaseDate: '',
		flbDate: '',
		ulbDate: '',
		transcendenceDate: '',
		wikiEn: '',
		wikiJa: '',
		gamewith: '',
		kamigame: '',
		nicknamesEn: [] as string[],
		nicknamesJp: [] as string[],
		recruits: null as string | null,
		recruitQuery: '',
		forgedFrom: null as string | null,
		forgeOrder: null as number | null
	}
}

/** weapons/new/+page.svelte: createWeapon */
function legacyCreatePayload(editData: ReturnType<typeof legacyNewData>) {
	return {
		granblue_id: editData.granblueId,
		name_en: editData.name,
		name_jp: editData.nameJp || undefined,
		rarity: editData.rarity,
		element: editData.element,
		proficiency: editData.proficiency,
		series: editData.series || undefined,
		new_series: editData.newSeries || undefined,
		promotions: editData.promotions,
		min_hp: editData.minHp,
		max_hp: editData.maxHp,
		max_hp_flb: editData.maxHpFlb,
		max_hp_ulb: editData.maxHpUlb,
		min_atk: editData.minAtk,
		max_atk: editData.maxAtk,
		max_atk_flb: editData.maxAtkFlb,
		max_atk_ulb: editData.maxAtkUlb,
		max_level: editData.maxLevel,
		max_skill_level: editData.maxSkillLevel,
		max_awakening_level: editData.maxAwakeningLevel || null,
		max_exorcism_level: editData.maxExorcismLevel,
		flb: editData.flb,
		ulb: editData.ulb,
		transcendence: editData.transcendence,
		extra_prerequisite: editData.extraPrerequisite === '' ? null : editData.extraPrerequisite,
		extra: editData.extra,
		limit: editData.limit,
		release_date: editData.releaseDate || null,
		flb_date: editData.flbDate || null,
		ulb_date: editData.ulbDate || null,
		transcendence_date: editData.transcendenceDate || null,
		wiki_en: editData.wikiEn,
		wiki_ja: editData.wikiJa,
		gamewith: editData.gamewith,
		kamigame: editData.kamigame,
		nicknames_en: editData.nicknamesEn,
		nicknames_jp: editData.nicknamesJp,
		recruits: editData.recruits,
		forged_from: editData.forgedFrom || null,
		forge_order: editData.forgeOrder
	}
}

/** What goes over the wire: JSON drops undefined */
const wire = (payload: object) => JSON.parse(JSON.stringify(payload)) as Record<string, unknown>

function omit(payload: Record<string, unknown>, ...keys: string[]) {
	return Object.fromEntries(Object.entries(payload).filter(([key]) => !keys.includes(key)))
}

/** Blanks the old pages left out or sent as '' */
const CLEARABLE = ['name_jp', 'series', 'recruits', 'wiki_en', 'wiki_ja', 'gamewith', 'kamigame']

/**
 * GBF-158: what the generated forms send differently from the old pages, as
 * decided with the maintainer. Applied to a legacy payload, so the parity
 * tests still pin every other key.
 * - Blank `series`, `recruits` and `name_jp` send null instead of being left
 *   out, so they can be cleared.
 * - Every blank text, link, date or reference sends null: the links no
 *   longer send ''.
 * - The awakening switch: a weapon without an awakening level sends
 *   `max_awakening_level: null` and no awakenings.
 */
function decided(payload: Record<string, unknown>) {
	const out = { ...payload }
	for (const key of CLEARABLE) if (out[key] === undefined || out[key] === '') out[key] = null
	if (!out.max_awakening_level) {
		out.max_awakening_level = null
		if ('awakening_ids' in out) out.awakening_ids = []
	}
	return out
}

/**
 * GBF-158: loading keeps the stored level caps; the old stats section
 * overwrote them from the uncap state on load
 */
function storedCaps(weapon: Weapon) {
	return { max_level: weapon.maxLevel || 100, max_skill_level: weapon.maxSkillLevel || 10 }
}

/** The edit page's payload for a weapon, with the decided changes */
function expectedEdit(weapon: Weapon) {
	return { ...decided(wire(legacyEditPayload(legacyEditData(weapon)))), ...storedCaps(weapon) }
}

const seriesRef = {
	id: 'series-uuid',
	slug: 'revans',
	name: { en: 'Revans', ja: 'レヴァンス' },
	hasWeaponKeys: false,
	hasAwakening: true,
	augmentType: 'no_augment',
	extra: false,
	elementChangeable: true,
	numWeaponKeys: null,
	weaponSeriesVariantId: 'variant-uuid',
	weaponSeriesVariantName: 'Revans (Gun)'
} as const

/** Element-changeable, fully uncapped gun: every conditional field shows */
const fullWeapon: Weapon = {
	id: 'weapon-uuid',
	granblueId: '1040912000',
	name: { en: 'Mjolnir', ja: 'ミョルニル' },
	rarity: 3,
	element: 0,
	proficiency: 6,
	series: { ...seriesRef },
	promotions: [1, 4],
	hp: { minHp: 30, maxHp: 230, maxHpFlb: 270, maxHpUlb: 300 },
	atk: { minAtk: 400, maxAtk: 2900, maxAtkFlb: 3400, maxAtkUlb: 3800 },
	uncap: { flb: true, ulb: true, transcendence: true, extraPrerequisite: 4 },
	maxLevel: 250,
	maxSkillLevel: 25,
	maxAwakeningLevel: 15,
	maxExorcismLevel: 3,
	limit: 1,
	extra: true,
	bulletSlots: [1, 2, 2, 4],
	awakenings: [
		{ id: 'awk-atk', name: { en: 'Attack' }, level: 1 },
		{ id: 'awk-def', name: { en: 'Defense' }, level: 1 }
	],
	nicknames: { en: ['hammer'], ja: ['ハンマー'] },
	recruits: { id: 'char-uuid', granblueId: '3040001000', name: { en: 'Thor' } },
	forgeOrder: 2,
	forgedFrom: { id: 'prev-uuid', granblueId: '1040911000', name: { en: 'Mjolnir (old)' } },
	elementVariantIds: { '1': '1040912100', '2': '1040912200' },
	releaseDate: '2020-01-01',
	flbDate: '2021-01-01',
	ulbDate: '2022-01-01',
	transcendenceDate: '2023-01-01',
	wiki: { en: 'Mjolnir', ja: 'ミョルニル' },
	gamewith: '519325',
	kamigame: 'ミョルニル'
}

/** Same shape with the optional parts blank: dates, series, variant, references, names */
const sparseWeapon: Weapon = {
	id: 'weapon-uuid-2',
	granblueId: '1040913000',
	name: { en: 'Blank' },
	rarity: 3,
	element: 0,
	proficiency: 6,
	series: null,
	uncap: { flb: true, ulb: true, transcendence: true, extraPrerequisite: null },
	maxLevel: 100,
	maxAwakeningLevel: 0,
	maxExorcismLevel: null,
	elementVariantIds: null,
	forgedFrom: null,
	forgeOrder: null
}

function schemaEditPayload(weapon: Weapon) {
	return toPayload(weaponsResource, fromRecord(weaponsResource, weapon), 'edit')
}

describe('weapons resource: edit payload parity', () => {
	it('matches the edit page for a fully filled weapon', () => {
		expect(wire(schemaEditPayload(fullWeapon))).toEqual(expectedEdit(fullWeapon))
		// Nothing filled in is affected by the decided changes
		expect(expectedEdit(fullWeapon)).toEqual(wire(legacyEditPayload(legacyEditData(fullWeapon))))
	})

	it('matches the edit page for blank optional values, with the decided changes', () => {
		const payload = wire(schemaEditPayload(sparseWeapon))
		expect(payload).toEqual(expectedEdit(sparseWeapon))
		// The empty-value rules these exercise
		expect(payload).toMatchObject({
			flb_date: null,
			release_date: null,
			weapon_series_variant_id: null,
			element_variant_ids: null,
			forged_from: null,
			extra_prerequisite: null,
			max_awakening_level: null,
			bullet_slots: [],
			awakening_ids: [],
			// GBF-158: blanks are null, so these can be cleared
			wiki_en: null,
			series: null,
			recruits: null,
			name_jp: null
		})
	})

	it('keeps the stored level caps on load (GBF-158)', () => {
		// Fully uncapped, yet stored at 100: the old page sent 250 / 25
		expect(schemaEditPayload(sparseWeapon)).toMatchObject({ max_level: 100, max_skill_level: 10 })
	})

	it('sends no awakening level or awakenings while awakening is off (GBF-158)', () => {
		const values = applyDerive(
			weaponsResource,
			{ ...fromRecord(weaponsResource, fullWeapon), awakening: false },
			'awakening'
		)
		expect(toPayload(weaponsResource, values, 'edit')).toMatchObject({
			max_awakening_level: null,
			awakening_ids: []
		})
		// The switch itself is never sent
		expect(toPayload(weaponsResource, values, 'edit')).not.toHaveProperty('awakening')
	})

	it('leaves out fields hidden for a plain weapon, which the edit page sent unchanged', () => {
		const plain: Weapon = {
			...fullWeapon,
			element: 3,
			proficiency: 1,
			uncap: { flb: false, ulb: false, transcendence: false, extraPrerequisite: null }
		}
		const hidden = [
			'max_hp_flb',
			'max_hp_ulb',
			'max_atk_flb',
			'max_atk_ulb',
			'flb_date',
			'ulb_date',
			'transcendence_date',
			'element_variant_ids',
			'bullet_slots'
		]
		expect(wire(schemaEditPayload(plain))).toEqual(omit(expectedEdit(plain), ...hidden))
	})

	it('reads the record into form values', () => {
		const values = fromRecord(weaponsResource, fullWeapon)
		expect(values).toMatchObject({
			name: { en: 'Mjolnir', ja: 'ミョルニル' },
			series: 'series-uuid',
			weapon_series_variant_id: 'variant-uuid',
			recruits: '3040001000',
			forged_from: '1040911000',
			awakening_ids: ['awk-atk', 'awk-def'],
			limit: true,
			extra_prerequisite: 4,
			// Form-only: from the awakening level
			awakening: true
		})
		// Read-only fields aren't form values
		expect(values).not.toHaveProperty('uncap')
		expect(values).not.toHaveProperty('forge_chain')
		expect(values).not.toHaveProperty('new_series')
	})
})

describe('weapons resource: create payload parity', () => {
	/** A user filling the new form, one edit at a time */
	const edits: [string, unknown, string, unknown][] = [
		['granblue_id', '1040914000', 'granblueId', '1040914000'],
		['name', { en: 'Fresh', ja: '' }, 'name', 'Fresh'],
		['element', 2, 'element', 2],
		['proficiency', 6, 'proficiency', 6],
		['series', 'series-uuid', 'series', 'series-uuid'],
		// Ticks FLB and ULB too, so every uncap field shows
		['transcendence', true, 'transcendence', true],
		['flb_date', '2026-10-01', 'flbDate', '2026-10-01'],
		['min_hp', 10, 'minHp', 10],
		['max_atk_flb', 3000, 'maxAtkFlb', 3000],
		['promotions', [1], 'promotions', [1]],
		['wiki_en', 'Fresh', 'wikiEn', 'Fresh']
	]

	function fill(recruits: string | null) {
		let values = initialValues(weaponsResource)
		const legacy = legacyNewData()
		for (const [key, value, legacyKey, legacyValue] of [
			...edits,
			['recruits', recruits, 'recruits', recruits] as const
		]) {
			values = applyDerive(weaponsResource, { ...values, [key]: value }, key)
			;(legacy as Record<string, unknown>)[legacyKey] = legacyValue
		}
		// WeaponUncapSection's change handler
		Object.assign(legacy, { flb: true, ulb: true })
		Object.assign(legacy, legacyLevelCaps(legacy))
		return { values, legacy }
	}

	it('matches the new page, with the decided changes', () => {
		const { values, legacy } = fill('3040001000')
		const payload = wire(toPayload(weaponsResource, values, 'create'))
		expect(payload).toEqual(decided(wire(legacyCreatePayload(legacy))))
		expect(payload).not.toHaveProperty('awakening_ids')
		expect(payload).not.toHaveProperty('weapon_series_variant_id')
		expect(payload).not.toHaveProperty('element_variant_ids')
		expect(payload).not.toHaveProperty('bullet_slots')
	})

	it('sends an empty recruit as null, as the new page did', () => {
		const { values, legacy } = fill(null)
		const payload = wire(toPayload(weaponsResource, values, 'create'))
		expect(payload).toEqual(decided(wire(legacyCreatePayload(legacy))))
		expect(payload.recruits).toBeNull()
	})

	it('starts from the new page defaults', () => {
		expect(initialValues(weaponsResource)).toMatchObject({
			rarity: 3,
			element: 0,
			// The new page defaults to 0 (None), which the API now rejects for weapons
			proficiency: null,
			max_level: 100,
			max_skill_level: 10,
			min_hp: 0,
			flb: false,
			release_date: '',
			nicknames: { en: [], ja: [] },
			recruits: null
		})
	})
})

// --- Validation and derive ---

function issues(values: Values, mode: 'create' | 'edit' = 'edit') {
	const result = buildZod(weaponsResource, mode).safeParse(values)
	return result.success ? [] : result.error.issues.map((i) => i.path.join('.'))
}

describe('weapons resource: validation', () => {
	const valid = () => fromRecord(weaponsResource, fullWeapon)

	it('accepts a loaded weapon', () => {
		expect(issues(valid())).toEqual([])
	})

	it('requires a 10-digit Granblue ID and an English name', () => {
		expect(issues({ ...valid(), granblue_id: '' })).toEqual(['granblue_id'])
		expect(issues({ ...valid(), granblue_id: '104091200' })).toEqual(['granblue_id'])
		expect(issues({ ...valid(), granblue_id: '10409120ab' })).toEqual(['granblue_id'])
		expect(issues({ ...valid(), name: { en: ' ', ja: '' } })).toEqual(['name.en'])
	})

	it('requires an awakening level of at least 1 while awakening is on (GBF-158)', () => {
		expect(issues({ ...valid(), max_awakening_level: null })).toEqual(['max_awakening_level'])
		expect(issues({ ...valid(), max_awakening_level: 0 })).toEqual(['max_awakening_level'])
		expect(issues({ ...valid(), awakening: false, max_awakening_level: null })).toEqual([])
	})

	it('requires the level caps, which the API never stores blank', () => {
		expect(issues({ ...valid(), max_level: null })).toEqual(['max_level'])
		expect(issues({ ...valid(), max_skill_level: null })).toEqual(['max_skill_level'])
	})

	it('checks integers and bounds', () => {
		expect(issues({ ...valid(), min_hp: 1.5 })).toEqual(['min_hp'])
		expect(issues({ ...valid(), min_hp: -1 })).toEqual(['min_hp'])
		expect(issues({ ...valid(), max_exorcism_level: 0 })).toEqual(['max_exorcism_level'])
		expect(issues({ ...valid(), max_exorcism_level: null })).toEqual([])
		expect(issues({ ...valid(), bullet_slots: [1, 1, 1, 1, 1, 1, 1] })).toEqual(['bullet_slots'])
		expect(issues({ ...valid(), bullet_slots: [9] })).toEqual(['bullet_slots.0'])
	})

	it('checks enums, dates and the variant ID map', () => {
		expect(issues({ ...valid(), rarity: 7 })).toEqual(['rarity'])
		expect(issues({ ...valid(), extra_prerequisite: null })).toEqual([])
		expect(issues({ ...valid(), release_date: '2020-13-01' })).toEqual(['release_date'])
		expect(issues({ ...valid(), release_date: '' })).toEqual([])
		expect(issues({ ...valid(), element_variant_ids: { '1': '123' } })).toEqual([
			'element_variant_ids.1'
		])
		expect(issues({ ...valid(), element_variant_ids: { '9': '1040912100' } })).toEqual([
			'element_variant_ids.9'
		])
	})

	it("doesn't check fields hidden by when", () => {
		const plain = { ...valid(), proficiency: 1, element: 3, flb: false, ulb: false }
		expect(
			issues({
				...plain,
				bullet_slots: [9, 9, 9, 9, 9, 9, 9],
				element_variant_ids: { x: 'y' },
				max_hp_flb: -5,
				flb_date: 'soon'
			})
		).toEqual([])
		expect(toPayload(weaponsResource, { ...plain, flb_date: 'soon' }, 'edit')).not.toHaveProperty(
			'flb_date'
		)
	})

	it('only checks fields on the mode', () => {
		const values = {
			...initialValues(weaponsResource),
			granblue_id: '1040914000',
			name: { en: 'Fresh', ja: '' },
			proficiency: 1
		}
		const awakening = { awakening: true, max_awakening_level: 1, awakening_ids: 'nope' }
		expect(issues({ ...values, ...awakening }, 'create')).toEqual([])
		expect(issues({ ...values, ...awakening }, 'edit')).toContain('awakening_ids')
	})
})

describe('weapons resource: derive', () => {
	const base = () => fromRecord(weaponsResource, fullWeapon)
	const change = (values: Values, key: string, value: unknown) =>
		applyDerive(weaponsResource, { ...values, [key]: value }, key)

	it('sets the standard level caps when an uncap changes, by rarity', () => {
		const none = { ...base(), flb: false, ulb: false, transcendence: false }
		expect(change(none, 'flb', true)).toMatchObject({ max_level: 150, max_skill_level: 15 })
		expect(change(none, 'ulb', true)).toMatchObject({ max_level: 200, max_skill_level: 20 })
		const flbOff = { ...base(), ulb: false, transcendence: false }
		expect(change(flbOff, 'flb', false)).toMatchObject({ max_level: 100, max_skill_level: 10 })
		expect(change({ ...flbOff, rarity: 2 }, 'flb', false)).toMatchObject({
			max_level: 75,
			max_skill_level: 10
		})
		expect(change({ ...flbOff, rarity: 1 }, 'flb', false)).toMatchObject({
			max_level: 50,
			max_skill_level: 10
		})
		expect(change({ ...none, rarity: 2 }, 'flb', true)).toMatchObject({
			max_level: 150,
			max_skill_level: 15
		})
	})

	it('keeps the stored caps on load and when anything but an uncap changes (GBF-158)', () => {
		const stored = { ...fullWeapon, maxLevel: 120, maxSkillLevel: 12 }
		const loaded = fromRecord(weaponsResource, stored)
		expect(loaded).toMatchObject({ max_level: 120, max_skill_level: 12 })
		expect(change(loaded, 'rarity', 2)).toMatchObject({ max_level: 120, max_skill_level: 12 })
	})

	it('switches awakening from the stored level, and off clears what it hid (GBF-158)', () => {
		expect(base().awakening).toBe(true)
		expect(fromRecord(weaponsResource, sparseWeapon).awakening).toBe(false)
		const off = change(base(), 'awakening', false)
		expect(off).toMatchObject({ max_awakening_level: null, awakening_ids: [] })
		const fields = weaponsResource.fields.filter((f) =>
			['max_awakening_level', 'awakening_ids'].includes(f.key)
		)
		expect(fields.map((f) => isShown(f, off))).toEqual([false, false])
		expect(fields.map((f) => isShown(f, base()))).toEqual([true, true])
	})

	it('keeps a cap the user typed', () => {
		expect(change(base(), 'max_level', 230)).toMatchObject({ max_level: 230 })
	})

	it('cascades uncaps', () => {
		const off = change(base(), 'flb', false)
		expect(off).toMatchObject({ flb: false, ulb: false, transcendence: false, max_level: 100 })
		const ulb = change(off, 'ulb', true)
		expect(ulb).toMatchObject({ flb: true, ulb: true, transcendence: false, max_level: 200 })
		expect(change(ulb, 'ulb', false)).toMatchObject({ flb: true, ulb: false, max_level: 150 })
		expect(change(off, 'transcendence', true)).toMatchObject({
			flb: true,
			ulb: true,
			transcendence: true,
			max_level: 250
		})
	})

	it('clears the variant when the series changes, not on load', () => {
		expect(base().weapon_series_variant_id).toBe('variant-uuid')
		expect(change(base(), 'series', 'other-uuid')).toMatchObject({
			series: 'other-uuid',
			weapon_series_variant_id: null
		})
		expect(change(base(), 'element', 2).weapon_series_variant_id).toBe('variant-uuid')
	})
})
