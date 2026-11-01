/**
 * The weapons resource: every field the weapons list, detail, edit and new
 * pages show, described once (GBF-142).
 */
import { z } from 'zod'
import * as m from '$lib/paraglide/messages'
import {
	weaponAdapter,
	type CreateWeaponPayload,
	type Weapon
} from '$lib/api/adapters/weapon.adapter'
import { entityQueries } from '$lib/api/queries/entity.queries'
import {
	elementFilterOptions,
	rarityFilterOptions,
	seriesFilterOptions,
	weaponProficiencyFilterOptions
} from '$lib/components/data-table/filterOptions'
import WeaponUncapCell from '$lib/components/database/cells/WeaponUncapCell.svelte'
import WeaponImagesTab from '$lib/features/database/weapons/tabs/WeaponImagesTab.svelte'
import WeaponRawDataTab from '$lib/features/database/weapons/tabs/WeaponRawDataTab.svelte'
import WeaponSkillsTab from '$lib/features/database/weapons/tabs/WeaponSkillsTab.svelte'
import { defineResource, type EnumOption, type Values } from '$lib/features/database/schema/types'
import { BULLET_TYPES } from '$lib/types/api/entities'
import { PROMOTION_NAMES } from '$lib/types/enums'
import { getElementOptions } from '$lib/utils/element'
import {
	buildGamewithUrl,
	buildKamigameUrl,
	buildWikiEnUrl,
	buildWikiJaUrl
} from '$lib/utils/external-links'
import { getWeaponFallbackImage, getWeaponGridImage } from '$lib/utils/images/weapons'
import { localizedName } from '$lib/utils/locale'
import { getWeaponProficiencyOptions, ProficiencyId } from '$lib/utils/proficiency'
import { getRarityOptions } from '$lib/utils/rarity'
import type { AdminWeaponRow } from '$lib/types/api/admin'
import type { Weapon as WeaponEntity } from '$lib/types/api/entities'
import type { WeaponSeries } from '$lib/types/api/weaponSeries'

const GRANBLUE_ID = /^\d{10}$/

const UNCAPS = ['flb', 'ulb', 'transcendence']

const flb = (v: Values) => v.flb === true
const ulb = (v: Values) => v.ulb === true
const transcendence = (v: Values) => v.transcendence === true
const awakening = (v: Values) => v.awakening === true
/** Detail rows shown whatever the form's `when` says */
const always = () => true

const options = (labels: Record<number, string>) => (): EnumOption[] =>
	Object.entries(labels).map(([value, label]) => ({ value: Number(value), label }))

const EXTRA_PREREQUISITES: Record<number, string> = {
	3: 'MLB',
	4: 'FLB',
	5: 'ULB',
	6: 'Transcendence'
}

/** Max level before any uncap, by rarity (R, SR, SSR) */
const BASE_LEVEL: Record<number, number> = { 1: 50, 2: 75, 3: 100 }

/** The standard max level and max skill level for a rarity and uncap state */
function levelCaps(v: Values): { max_level: number; max_skill_level: number } {
	if (transcendence(v)) return { max_level: 250, max_skill_level: 25 }
	if (ulb(v)) return { max_level: 200, max_skill_level: 20 }
	if (flb(v)) return { max_level: 150, max_skill_level: 15 }
	return { max_level: BASE_LEVEL[v.rarity as number] ?? 100, max_skill_level: 10 }
}

/** Uncaps stack: each needs the one before it, so ticking or unticking one carries the rest */
function uncapCascade(v: Values, changed: string | null): Values | undefined {
	if (changed === 'flb' && !flb(v)) return { ulb: false, transcendence: false }
	if (changed === 'ulb') return ulb(v) ? { flb: true } : { transcendence: false }
	if (changed === 'transcendence' && transcendence(v)) return { flb: true, ulb: true }
	return undefined
}

const stat = { kind: 'number', int: true, min: 0, default: 0 } as const

export const weaponsResource = defineResource<AdminWeaponRow, Weapon>({
	name: 'weapons',
	fields: [
		// Metadata
		{
			key: 'name',
			kind: 'localized',
			label: m.db_weapons_col_name,
			keys: { en: 'name_en', ja: 'name_jp' },
			labels: { en: m.db_weapons_field_name_en, ja: m.db_weapons_field_name_jp },
			required: true,
			list: { primary: true, minWidth: '220px' }
		},
		{
			key: 'rarity',
			kind: 'enum',
			label: m.db_weapons_col_rarity,
			options: getRarityOptions,
			default: 3,
			required: true,
			list: { width: '80px' },
			filter: { kind: 'multi', options: rarityFilterOptions, facet: true }
		},
		{
			key: 'granblue_id',
			kind: 'code',
			label: m.db_weapons_field_granblue_id,
			required: true,
			validate: z
				.string()
				.regex(GRANBLUE_ID, { error: () => m.db_weapons_field_granblue_id_invalid() })
		},
		// Element variant IDs (element-changeable weapons)
		{
			key: 'element_variant_ids',
			kind: 'custom',
			label: m.db_weapons_field_element_variant_ids,
			default: {},
			when: (v) => v.element === 0,
			form: { create: false },
			render: { input: 'elementVariantIds' },
			validate: z.record(
				z.string().regex(/^[0-6]$/),
				z.string().regex(GRANBLUE_ID, {
					error: () => m.db_weapons_field_element_variant_ids_invalid()
				})
			)
		},
		// Gacha
		{
			key: 'promotions',
			kind: 'enumList',
			label: m.db_weapons_field_promotions,
			sublabel: m.db_weapons_hint_promotions,
			options: options(PROMOTION_NAMES)
		},
		{
			key: 'recruits',
			kind: 'reference',
			label: m.db_weapons_field_recruits,
			sublabel: m.db_weapons_hint_recruits,
			resource: 'character',
			id: (ref) =>
				typeof ref === 'string' ? ref : ((ref as Weapon['recruits'])?.granblueId ?? null)
		},
		// Uncap
		{
			key: 'uncap',
			kind: 'custom',
			label: m.db_weapons_col_uncap,
			write: false,
			// The forms show the stars too, following the checkboxes
			render: { cell: WeaponUncapCell, detail: 'uncapIndicator', input: 'uncapIndicator' },
			detail: { hideWhenEmpty: true },
			list: { sortable: false, width: '144px', fields: UNCAPS }
		},
		{
			key: 'flb',
			kind: 'boolean',
			label: m.db_weapons_filter_flb,
			read: (w) => w.uncap?.flb,
			// The detail's uncap stars show these
			detail: false
		},
		{
			key: 'ulb',
			kind: 'boolean',
			label: m.db_weapons_filter_ulb,
			read: (w) => w.uncap?.ulb,
			// The detail's uncap stars show these
			detail: false
		},
		{
			key: 'transcendence',
			kind: 'boolean',
			label: m.db_weapons_filter_transcendence,
			read: (w) => w.uncap?.transcendence,
			// The detail's uncap stars show these
			detail: false
		},
		{
			key: 'extra_prerequisite',
			kind: 'enum',
			label: m.db_weapons_field_extra_prerequisite,
			sublabel: m.db_weapons_hint_extra_prerequisite,
			options: options(EXTRA_PREREQUISITES),
			read: (w) => w.uncap?.extraPrerequisite,
			detail: { hideWhenEmpty: true, sublabel: false }
		},
		// Details
		{
			key: 'element',
			kind: 'enum',
			label: m.db_weapons_col_element,
			options: getElementOptions,
			default: 0,
			required: true,
			list: { type: 'element' },
			filter: {
				kind: 'multi',
				options: () => elementFilterOptions({ includeNull: true }),
				facet: true
			}
		},
		{
			key: 'proficiency',
			kind: 'enum',
			label: m.db_weapons_col_proficiency,
			options: getWeaponProficiencyOptions,
			// No default: weapons always have a proficiency, so new ones must pick one
			default: null,
			required: true,
			list: { type: 'proficiency' },
			filter: { kind: 'multi', options: weaponProficiencyFilterOptions, facet: true }
		},
		{
			key: 'series',
			kind: 'reference',
			label: m.db_weapons_col_series,
			resource: 'weaponSeries',
			list: {
				value: (w) =>
					w.seriesNameEn || w.seriesNameJp
						? localizedName({ en: w.seriesNameEn ?? '', ja: w.seriesNameJp ?? '' })
						: null,
				sortable: false,
				width: '172px',
				fields: ['series_name_en', 'series_name_jp']
			},
			filter: {
				kind: 'multi',
				query: () => entityQueries.weaponSeriesList(),
				options: (series) =>
					seriesFilterOptions(series as WeaponSeries[] | undefined, m.db_weapons_filter_no_series),
				facet: true
			}
		},
		{
			key: 'weapon_series_variant_id',
			kind: 'reference',
			label: m.db_weapons_field_variant,
			sublabel: m.db_weapons_hint_variant,
			resource: 'weaponSeriesVariant',
			read: (w) => w.series?.weaponSeriesVariantId,
			detail: {
				hideWhenEmpty: true,
				sublabel: false,
				value: (w) => w.series?.weaponSeriesVariantName
			},
			// The new page shows the picker but never sent it
			form: { create: false }
		},
		{
			key: 'extra',
			kind: 'boolean',
			label: m.db_weapons_filter_extra,
			sublabel: m.db_weapons_hint_extra
		},
		{
			key: 'limit',
			kind: 'boolean',
			label: m.db_weapons_field_limit,
			sublabel: m.db_weapons_hint_limit,
			read: (w) => Boolean(w.limit),
			filter: { kind: 'toggle', label: m.db_weapons_filter_limit }
		},
		// HP and attack
		{ ...stat, key: 'min_hp', label: m.db_weapons_field_min_hp, read: (w) => w.hp?.minHp },
		{ ...stat, key: 'max_hp', label: m.db_weapons_field_max_hp, read: (w) => w.hp?.maxHp },
		{
			...stat,
			key: 'max_hp_flb',
			label: m.db_weapons_field_max_hp_flb,
			read: (w) => w.hp?.maxHpFlb,
			when: flb
		},
		{
			...stat,
			key: 'max_hp_ulb',
			label: m.db_weapons_field_max_hp_ulb,
			read: (w) => w.hp?.maxHpUlb,
			when: ulb
		},
		{ ...stat, key: 'min_atk', label: m.db_weapons_field_min_atk, read: (w) => w.atk?.minAtk },
		{ ...stat, key: 'max_atk', label: m.db_weapons_field_max_atk, read: (w) => w.atk?.maxAtk },
		{
			...stat,
			key: 'max_atk_flb',
			label: m.db_weapons_field_max_atk_flb,
			read: (w) => w.atk?.maxAtkFlb,
			when: flb
		},
		{
			...stat,
			key: 'max_atk_ulb',
			label: m.db_weapons_field_max_atk_ulb,
			read: (w) => w.atk?.maxAtkUlb,
			when: ulb
		},
		// Caps
		{
			key: 'max_level',
			kind: 'number',
			label: m.db_weapons_field_max_level,
			int: true,
			min: 1,
			default: 100,
			required: true
		},
		{
			key: 'max_skill_level',
			kind: 'number',
			label: m.db_weapons_field_max_skill_level,
			int: true,
			min: 1,
			default: 10,
			required: true,
			detail: { hideWhenEmpty: true }
		},
		// Whether the weapon awakens: a form-only switch for the level and the awakenings
		{
			key: 'awakening',
			kind: 'boolean',
			label: m.db_weapons_field_awakening,
			read: (w) => (w.maxAwakeningLevel ?? 0) > 0,
			write: false,
			form: {},
			detail: false
		},
		{
			key: 'max_awakening_level',
			kind: 'number',
			label: m.db_weapons_field_max_awakening_level,
			int: true,
			min: 1,
			required: true,
			when: awakening,
			// A weapon that doesn't awaken has no level
			whenHidden: 'empty',
			detail: { when: always, empty: '0' }
		},
		{
			key: 'max_exorcism_level',
			kind: 'number',
			label: m.db_weapons_field_max_exorcism_level,
			sublabel: m.db_weapons_hint_max_exorcism_level,
			int: true,
			min: 1,
			detail: { hideWhenEmpty: true, sublabel: false }
		},
		// Awakenings
		{
			key: 'awakening_ids',
			kind: 'referenceList',
			label: m.db_nav_awakenings,
			resource: 'awakening',
			read: (w) => w.awakenings,
			when: awakening,
			// A weapon that doesn't awaken has no awakenings
			whenHidden: 'empty',
			form: { create: false },
			render: { input: 'weaponAwakenings' },
			detail: { when: always, hideWhenEmpty: true }
		},
		// Forge chain
		{
			key: 'forge_chain',
			kind: 'custom',
			label: m.db_weapons_field_forge_chain,
			write: false,
			read: (w) => (w as Weapon & Pick<WeaponEntity, 'forgeChain'>).forgeChain,
			detail: { hideWhenEmpty: true }
		},
		{
			key: 'forged_from',
			kind: 'reference',
			label: m.db_weapons_field_forged_from,
			resource: 'weapon',
			id: (ref) => (ref as Weapon['forgedFrom'])?.granblueId ?? null,
			detail: { hideWhenEmpty: true }
		},
		{
			key: 'forge_order',
			kind: 'number',
			label: m.db_weapons_field_forge_order,
			int: true,
			min: 0,
			detail: { hideWhenEmpty: true }
		},
		// Bullet slots (guns)
		{
			key: 'bullet_slots',
			kind: 'enumList',
			label: m.db_weapons_field_bullet_slots,
			options: options(BULLET_TYPES),
			ordered: true,
			max: 6,
			when: (v) => v.proficiency === ProficiencyId.Gun,
			// The detail shows a weapon's slots whatever its proficiency
			detail: { when: always, hideWhenEmpty: true },
			form: { create: false }
		},
		// Nicknames
		{
			key: 'nicknames',
			kind: 'localized',
			of: 'tags',
			label: m.db_weapons_field_nicknames,
			keys: { en: 'nicknames_en', ja: 'nicknames_jp' },
			labels: { en: m.db_weapons_field_nicknames_en, ja: m.db_weapons_field_nicknames_ja }
		},
		// Dates
		{
			key: 'release_date',
			kind: 'date',
			label: m.db_weapons_field_release_date,
			list: { header: m.db_weapons_col_release_date }
		},
		{
			key: 'flb_date',
			kind: 'date',
			label: m.db_weapons_field_flb_date,
			when: flb,
			// The detail shows every date, uncapped or not
			detail: { when: always },
			list: { header: m.db_weapons_col_flb_date, defaultHidden: true }
		},
		{
			key: 'ulb_date',
			kind: 'date',
			label: m.db_weapons_field_ulb_date,
			when: ulb,
			// The detail shows every date, uncapped or not
			detail: { when: always },
			list: { header: m.db_weapons_col_ulb_date, defaultHidden: true }
		},
		{
			key: 'transcendence_date',
			kind: 'date',
			label: m.db_weapons_field_transcendence_date,
			when: transcendence,
			// The detail shows every date, uncapped or not
			detail: { when: always },
			list: { header: m.db_weapons_col_transcendence_date, defaultHidden: true }
		},
		// Links
		{
			key: 'wiki_en',
			kind: 'link',
			label: m.db_weapons_field_wiki_en,
			read: (w) => w.wiki?.en,
			href: (v) => buildWikiEnUrl(v),
			detail: { empty: m.db_detail_not_available },
			form: { placeholder: m.db_weapons_hint_wiki_en, width: '480px' }
		},
		{
			key: 'wiki_ja',
			kind: 'link',
			label: m.db_weapons_field_wiki_ja,
			read: (w) => w.wiki?.ja,
			href: (v) => buildWikiJaUrl(v, 'weapon'),
			detail: { empty: m.db_detail_not_available },
			form: { placeholder: m.db_weapons_hint_wiki_ja, width: '480px' }
		},
		{
			key: 'gamewith',
			kind: 'link',
			label: m.details_link_gamewith,
			href: (v) => buildGamewithUrl(v),
			detail: { empty: m.db_detail_not_available },
			form: { placeholder: m.db_weapons_hint_gamewith, width: '480px' }
		},
		{
			key: 'kamigame',
			kind: 'link',
			label: m.details_link_kamigame,
			href: (v, values) => buildKamigameUrl(v, 'weapon', values.rarity as number | undefined),
			detail: { empty: m.db_detail_not_available },
			form: { placeholder: m.db_weapons_hint_kamigame, width: '480px' }
		},
		// Create only: the legacy series param. No input sets it, so it's never sent
		{
			key: 'new_series',
			kind: 'number',
			label: m.db_weapons_field_new_series,
			empty: 'omit',
			write: { value: (v) => v || null },
			form: { edit: false }
		},
		// List only
		{
			key: 'latest_date',
			kind: 'date',
			label: m.db_weapons_col_latest_date,
			write: false
		},
		{
			key: 'updated_at',
			kind: 'datetime',
			label: m.db_weapons_col_updated_at,
			write: false,
			list: { defaultHidden: true },
			filter: {
				kind: 'recent',
				label: m.db_weapons_filter_updated,
				presets: [
					{ days: 7, label: m.db_weapons_filter_updated_7 },
					{ days: 30, label: m.db_weapons_filter_updated_30 }
				]
			}
		},
		{
			key: 'skill_count',
			kind: 'number',
			label: m.db_weapons_col_skill_count,
			write: false,
			list: { sortable: false, defaultHidden: true }
		}
	],

	list: {
		label: m.db_weapons_label,
		entity: m.collection_entity_weapons,
		empty: m.db_weapons_empty,
		title: 'name',
		rowHeight: 'image',
		pinFirstColumn: true,
		columns: [
			{
				id: 'image',
				header: '',
				type: 'image',
				image: 'weapon',
				sortable: false,
				hideable: false,
				width: '96px',
				// Table cells shrink to their content's minimum, and a thumb has none
				minWidth: '96px',
				fields: ['element']
			},
			'name',
			'rarity',
			'element',
			'proficiency',
			'uncap',
			'series',
			'release_date',
			'flb_date',
			'ulb_date',
			'transcendence_date',
			// The newest of the release and uncap dates: when the game last changed it
			'latest_date',
			// When someone last edited the record on the site
			'updated_at',
			'skill_count'
		],
		filters: [
			'element',
			'rarity',
			'proficiency',
			'series',
			{ id: 'uncap', label: m.db_weapons_filter_uncap, toggles: UNCAPS },
			{ id: 'type', label: m.db_weapons_filter_type, toggles: ['extra', 'limit'] },
			{
				id: 'quality',
				label: m.db_weapons_filter_quality,
				toggles: [
					{ key: 'missing_name_jp', label: m.db_weapons_filter_missing_name_jp },
					{ key: 'no_skills', label: m.db_weapons_filter_no_skills }
				]
			},
			'updated_at'
		],
		baseFields: ['granblue_id', 'name_en', 'name_jp'],
		defaultSort: [
			{ id: 'latest_date', desc: true },
			{ id: 'name', desc: false }
		]
	},

	// The detail Info tab's order; edit and create use it too. A section shows
	// while any of its fields does
	layout: {
		detail: [
			{
				id: 'metadata',
				title: m.db_weapons_section_metadata,
				fields: ['name', 'rarity', 'granblue_id']
			},
			{
				id: 'element_variant_ids',
				title: m.db_weapons_field_element_variant_ids,
				fields: ['element_variant_ids'],
				component: 'elementVariantIds'
			},
			{ id: 'gacha', title: m.db_weapons_section_gacha, fields: ['promotions', 'recruits'] },
			{
				id: 'uncap',
				title: m.db_weapons_col_uncap,
				fields: ['uncap', 'flb', 'ulb', 'transcendence', 'extra_prerequisite']
			},
			{
				id: 'details',
				title: m.db_weapons_section_details,
				fields: ['element', 'proficiency', 'series', 'weapon_series_variant_id', 'extra', 'limit']
			},
			{
				id: 'hp',
				title: m.db_weapons_section_hp,
				fields: ['min_hp', 'max_hp', 'max_hp_flb', 'max_hp_ulb']
			},
			{
				id: 'attack',
				title: m.db_weapons_section_attack,
				fields: ['min_atk', 'max_atk', 'max_atk_flb', 'max_atk_ulb']
			},
			{
				id: 'caps',
				title: m.db_weapons_section_caps,
				fields: [
					'max_level',
					'max_skill_level',
					'awakening',
					'max_awakening_level',
					'max_exorcism_level'
				]
			},
			{
				id: 'awakenings',
				title: m.db_nav_awakenings,
				fields: ['awakening_ids'],
				component: 'weaponAwakenings'
			},
			{
				id: 'forge',
				title: m.db_weapons_field_forge_chain,
				fields: ['forge_chain', 'forged_from', 'forge_order'],
				component: 'weaponForge'
			},
			{
				id: 'bullet_slots',
				title: m.db_weapons_field_bullet_slots,
				fields: ['bullet_slots'],
				component: 'bulletSlots'
			},
			{ id: 'nicknames', title: m.db_weapons_field_nicknames, fields: ['nicknames'] },
			{
				id: 'dates',
				title: m.db_weapons_section_dates,
				fields: ['release_date', 'flb_date', 'ulb_date', 'transcendence_date']
			},
			{
				id: 'links',
				title: m.db_weapons_section_links,
				fields: ['wiki_en', 'wiki_ja', 'gamewith', 'kamigame']
			}
		]
	},

	derive: [
		uncapCascade,
		// Only when an uncap changes: loading keeps the stored caps, and a cap
		// typed by hand sticks until the next uncap change
		(v, changed) => (changed !== null && UNCAPS.includes(changed) ? levelCaps(v) : undefined),
		// Switching awakening off clears what it hid
		(v, changed) =>
			changed === 'awakening' && !awakening(v)
				? { max_awakening_level: null, awakening_ids: [] }
				: undefined,
		// A variant belongs to its series
		(_, changed) => (changed === 'series' ? { weapon_series_variant_id: null } : undefined)
	],

	record: {
		fetch: (id) => weaponAdapter.getWeapon(id),
		query: (id) => entityQueries.weapon(id),
		routeId: (w) => w.granblueId,
		noun: m.db_weapons_noun,
		type: 'weapon',
		image: (w) => getWeaponGridImage(w.granblueId, w.element, undefined, w.elementVariantIds),
		// Element-changeable weapons have no _0 image
		fallbackImage: (w) =>
			w.element === 0 ? getWeaponFallbackImage(w.granblueId, 'grid') : undefined,
		element: (w) => w.element,
		tabs: [
			// Always shown: with no skills it says why, and editors can build them
			{ id: 'skills', label: m.details_tab_skills, component: WeaponSkillsTab },
			{ id: 'images', label: m.db_detail_tab_images, component: WeaponImagesTab },
			{ id: 'raw', label: m.db_detail_tab_raw, component: WeaponRawDataTab, editorOnly: true }
		]
	},

	save: {
		// Payload keys are the strong params by construction (see contract.test.ts)
		update: (w, payload) =>
			weaponAdapter.updateWeapon(w.id, payload as Partial<CreateWeaponPayload>)
	},

	// Today's screens until the generated ones replace them (phase 7). The
	// list screen renders the generated list for weapons and keeps the Series,
	// Awakenings and Skills views by hand (they move in GBF-143)
	screens: {
		list: () => import('$lib/features/database/weapons/screens/WeaponsListScreen.svelte'),
		edit: () => import('$lib/features/database/weapons/screens/WeaponEditScreen.svelte'),
		new: () => import('$lib/features/database/weapons/screens/WeaponNewScreen.svelte')
	}
})
