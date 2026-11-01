/**
 * The summons resource: every field the summons list, detail, edit and new
 * pages show, described once (GBF-143).
 */
import { z } from 'zod'
import * as m from '$lib/paraglide/messages'
import {
	summonAdapter,
	type CreateSummonPayload,
	type Summon
} from '$lib/api/adapters/summon.adapter'
import { entityQueries } from '$lib/api/queries/entity.queries'
import {
	elementFilterOptions,
	rarityFilterOptions,
	seriesFilterOptions
} from '$lib/components/data-table/filterOptions'
// Weapons and summons draw the same uncap stars
import WeaponUncapCell from '$lib/components/database/cells/WeaponUncapCell.svelte'
import SummonAurasTab from '$lib/features/database/summons/tabs/SummonAurasTab.svelte'
import SummonImagesTab from '$lib/features/database/summons/tabs/SummonImagesTab.svelte'
import SummonRawDataTab from '$lib/features/database/summons/tabs/SummonRawDataTab.svelte'
import { summonsSection } from '$lib/features/database/summons/section'
import { defineResource, type EnumOption, type Values } from '$lib/features/database/schema/types'
import {
	STACKED_UNCAPS,
	stackedUncapCascade,
	standardMaxLevel
} from '$lib/features/database/uncapRules'
import { PROMOTION_NAMES } from '$lib/types/enums'
import { getElementOptions } from '$lib/utils/element'
import {
	buildGamewithUrl,
	buildKamigameUrl,
	buildWikiEnUrl,
	buildWikiJaUrl
} from '$lib/utils/external-links'
import { getSummonImage } from '$lib/utils/images/summons'
import { localizedName } from '$lib/utils/locale'
import { getRarityOptions } from '$lib/utils/rarity'
import type { AdminSummonRow } from '$lib/types/api/admin'
import type { SummonSeries } from '$lib/types/api/summonSeries'

const GRANBLUE_ID = /^\d{10}$/

const UNCAPS = STACKED_UNCAPS

const flb = (v: Values) => v.flb === true
const ulb = (v: Values) => v.ulb === true
const transcendence = (v: Values) => v.transcendence === true
/** Detail rows shown whatever the form's `when` says */
const always = () => true

const promotionOptions = (): EnumOption[] =>
	Object.entries(PROMOTION_NAMES).map(([value, label]) => ({ value: Number(value), label }))

/** Every summon has an element: no Null */
const elementOptions = (): EnumOption[] => getElementOptions().filter((o) => o.value !== 0)

/** Stats are whole numbers the API never stores below zero */
const stat = { kind: 'number', int: true, min: 0 } as const

export const summonsResource = defineResource<AdminSummonRow, Summon>({
	name: 'summons',
	fields: [
		// Metadata
		{
			key: 'name',
			kind: 'localized',
			label: m.db_summons_col_name,
			keys: { en: 'name_en', ja: 'name_jp' },
			labels: { en: m.db_summons_field_name_en, ja: m.db_summons_field_name_jp },
			required: true,
			list: { primary: true, minWidth: '220px' }
		},
		{
			key: 'rarity',
			kind: 'enum',
			label: m.db_summons_col_rarity,
			options: getRarityOptions,
			default: 3,
			required: true,
			list: { width: '80px' },
			filter: { kind: 'multi', options: rarityFilterOptions, facet: true }
		},
		{
			key: 'granblue_id',
			kind: 'code',
			label: m.db_summons_field_granblue_id,
			required: true,
			validate: z
				.string()
				.regex(GRANBLUE_ID, { error: () => m.db_summons_field_granblue_id_invalid() })
		},
		// The game's internal number: the full record doesn't carry it, so only
		// the new page sets it, as before
		{
			key: 'summon_id',
			kind: 'number',
			label: m.db_summons_field_summon_id,
			sublabel: m.db_summons_hint_summon_id,
			int: true,
			min: 0,
			form: { edit: false, placeholder: m.db_summons_hint_optional },
			detail: false
		},
		// Gacha
		{
			key: 'promotions',
			kind: 'enumList',
			label: m.db_summons_field_promotions,
			sublabel: m.db_summons_hint_promotions,
			options: promotionOptions
		},
		// Uncap
		{
			key: 'uncap',
			kind: 'custom',
			label: m.db_summons_col_uncap,
			write: false,
			// The forms show the stars too, following the checkboxes
			render: { cell: WeaponUncapCell, detail: 'uncapIndicator', input: 'uncapIndicator' },
			list: { sortable: false, width: '144px', fields: UNCAPS }
		},
		{
			key: 'flb',
			kind: 'boolean',
			label: m.db_summons_field_flb,
			read: (s) => s.uncap?.flb,
			// The detail's uncap stars show these
			detail: false,
			list: { sortable: false, defaultHidden: true }
		},
		{
			key: 'ulb',
			kind: 'boolean',
			label: m.db_summons_field_ulb,
			read: (s) => s.uncap?.ulb,
			detail: false,
			list: { sortable: false, defaultHidden: true }
		},
		{
			key: 'transcendence',
			kind: 'boolean',
			label: m.db_summons_field_transcendence,
			read: (s) => s.uncap?.transcendence,
			detail: false,
			list: { sortable: false, defaultHidden: true }
		},
		{
			key: 'subaura',
			kind: 'boolean',
			label: m.db_summons_field_subaura,
			list: { sortable: false }
		},
		{
			key: 'limit',
			kind: 'boolean',
			label: m.db_summons_field_limit,
			list: { sortable: false, defaultHidden: true }
		},
		// Details
		{
			key: 'element',
			kind: 'enum',
			label: m.db_summons_col_element,
			options: elementOptions,
			// No default: new summons pick one
			default: null,
			required: true,
			list: { type: 'element' },
			filter: { kind: 'multi', options: () => elementFilterOptions(), facet: true }
		},
		{
			key: 'series',
			kind: 'reference',
			label: m.db_summons_col_series,
			resource: 'summonSeries',
			list: {
				value: (s) =>
					s.seriesNameEn || s.seriesNameJp
						? localizedName({ en: s.seriesNameEn ?? '', ja: s.seriesNameJp ?? '' })
						: null,
				sortable: false,
				width: '172px',
				defaultHidden: true,
				fields: ['series_name_en', 'series_name_jp']
			},
			filter: {
				kind: 'multi',
				query: () => entityQueries.summonSeriesList(),
				options: (series) =>
					seriesFilterOptions(series as SummonSeries[] | undefined, m.db_summons_filter_no_series),
				facet: true
			}
		},
		// HP and attack
		{ ...stat, key: 'min_hp', label: m.db_summons_field_min_hp, read: (s) => s.hp?.minHp },
		{ ...stat, key: 'max_hp', label: m.db_summons_field_max_hp, read: (s) => s.hp?.maxHp },
		{
			...stat,
			key: 'max_hp_flb',
			label: m.db_summons_field_max_hp_flb,
			read: (s) => s.hp?.maxHpFlb,
			when: flb
		},
		{
			...stat,
			key: 'max_hp_ulb',
			label: m.db_summons_field_max_hp_ulb,
			read: (s) => s.hp?.maxHpUlb,
			when: ulb
		},
		{
			...stat,
			key: 'max_hp_xlb',
			label: m.db_summons_field_max_hp_xlb,
			read: (s) => s.hp?.maxHpXlb,
			when: transcendence
		},
		{ ...stat, key: 'min_atk', label: m.db_summons_field_min_atk, read: (s) => s.atk?.minAtk },
		{ ...stat, key: 'max_atk', label: m.db_summons_field_max_atk, read: (s) => s.atk?.maxAtk },
		{
			...stat,
			key: 'max_atk_flb',
			label: m.db_summons_field_max_atk_flb,
			read: (s) => s.atk?.maxAtkFlb,
			when: flb
		},
		{
			...stat,
			key: 'max_atk_ulb',
			label: m.db_summons_field_max_atk_ulb,
			read: (s) => s.atk?.maxAtkUlb,
			when: ulb
		},
		{
			...stat,
			key: 'max_atk_xlb',
			label: m.db_summons_field_max_atk_xlb,
			read: (s) => s.atk?.maxAtkXlb,
			when: transcendence
		},
		// Caps
		{
			key: 'max_level',
			kind: 'number',
			label: m.db_summons_field_max_level,
			int: true,
			min: 1,
			default: 100,
			required: true,
			list: { header: m.db_summons_col_max_level, defaultHidden: true }
		},
		// Nicknames
		{
			key: 'nicknames',
			kind: 'localized',
			of: 'tags',
			label: m.db_summons_section_nicknames,
			keys: { en: 'nicknames_en', ja: 'nicknames_jp' },
			labels: { en: m.db_summons_field_nicknames_en, ja: m.db_summons_field_nicknames_ja }
		},
		// Dates
		{
			key: 'release_date',
			kind: 'date',
			label: m.db_summons_field_release_date,
			list: { header: m.db_summons_col_release_date, defaultHidden: true }
		},
		{
			key: 'flb_date',
			kind: 'date',
			label: m.db_summons_field_flb_date,
			when: flb,
			// The detail shows every date, uncapped or not
			detail: { when: always },
			list: { header: m.db_summons_col_flb_date, defaultHidden: true }
		},
		{
			key: 'ulb_date',
			kind: 'date',
			label: m.db_summons_field_ulb_date,
			when: ulb,
			detail: { when: always },
			list: { header: m.db_summons_col_ulb_date, defaultHidden: true }
		},
		{
			key: 'transcendence_date',
			kind: 'date',
			label: m.db_summons_field_transcendence_date,
			when: transcendence,
			detail: { when: always },
			list: { header: m.db_summons_col_transcendence_date, defaultHidden: true }
		},
		// Links
		{
			key: 'wiki_en',
			kind: 'link',
			label: m.db_summons_field_wiki_en,
			read: (s) => s.wiki?.en,
			href: (v) => buildWikiEnUrl(v),
			form: { placeholder: m.db_summons_hint_wiki_en, width: '480px' }
		},
		{
			key: 'wiki_ja',
			kind: 'link',
			label: m.db_summons_field_wiki_ja,
			read: (s) => s.wiki?.ja,
			href: (v) => buildWikiJaUrl(v, 'summon'),
			form: { placeholder: m.db_summons_hint_wiki_ja, width: '480px' }
		},
		{
			key: 'gamewith',
			kind: 'link',
			label: m.db_summons_field_gamewith,
			href: (v) => buildGamewithUrl(v),
			form: { placeholder: m.db_summons_hint_gamewith, width: '480px' }
		},
		{
			key: 'kamigame',
			kind: 'link',
			label: m.db_summons_field_kamigame,
			href: (v) => buildKamigameUrl(v, 'summon'),
			form: { placeholder: m.db_summons_hint_kamigame, width: '480px' }
		},
		// List only
		{
			key: 'latest_date',
			kind: 'date',
			label: m.db_summons_col_latest_date,
			write: false
		},
		{
			key: 'updated_at',
			kind: 'datetime',
			label: m.db_summons_col_updated_at,
			write: false,
			list: { defaultHidden: true },
			filter: {
				kind: 'recent',
				label: m.db_summons_filter_updated,
				presets: [
					{ days: 7, label: m.db_summons_filter_updated_7 },
					{ days: 30, label: m.db_summons_filter_updated_30 }
				]
			}
		},
		{
			key: 'aura_count',
			kind: 'number',
			label: m.db_summons_col_aura_count,
			write: false,
			list: { sortable: false, defaultHidden: true }
		}
	],

	list: {
		label: m.db_summons_label,
		pageTitle: m.page_title_db_summons,
		entity: m.collection_entity_summons,
		empty: m.db_summons_empty,
		title: 'name',
		element: 'element',
		rowHeight: 'image',
		pinFirstColumn: true,
		columns: [
			{
				id: 'image',
				header: '',
				type: 'image',
				image: 'summon',
				sortable: false,
				hideable: false,
				width: '96px',
				// Table cells shrink to their content's minimum, and a thumb has none
				minWidth: '96px'
			},
			'name',
			'rarity',
			'element',
			'uncap',
			'subaura',
			'series',
			'limit',
			'flb',
			'ulb',
			'transcendence',
			'max_level',
			'release_date',
			'flb_date',
			'ulb_date',
			'transcendence_date',
			// The newest of the release and uncap dates: when the game last changed it
			'latest_date',
			// When someone last edited the record on the site
			'updated_at',
			'aura_count'
		],
		filters: [
			'element',
			'rarity',
			'series',
			{ id: 'uncap', label: m.db_summons_filter_uncap, toggles: UNCAPS },
			{ id: 'type', label: m.db_summons_filter_type, toggles: ['subaura', 'limit'] },
			{
				id: 'quality',
				label: m.db_summons_filter_quality,
				toggles: [
					{ key: 'missing_name_jp', label: m.db_summons_filter_missing_name_jp },
					{ key: 'no_auras', label: m.db_summons_filter_no_auras },
					// Max level not the standard cap for the rarity and uncaps
					{ key: 'caps_mismatch', label: m.db_summons_filter_caps_mismatch }
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
				title: m.db_summons_section_metadata,
				fields: ['name', 'rarity', 'granblue_id', 'summon_id']
			},
			{ id: 'gacha', title: m.db_summons_section_gacha, fields: ['promotions'] },
			{
				id: 'uncap',
				title: m.db_summons_section_uncap,
				fields: ['uncap', 'flb', 'ulb', 'transcendence', 'subaura', 'limit']
			},
			{ id: 'details', title: m.db_summons_section_details, fields: ['element', 'series'] },
			{
				id: 'hp',
				title: m.db_summons_section_hp,
				fields: ['min_hp', 'max_hp', 'max_hp_flb', 'max_hp_ulb', 'max_hp_xlb']
			},
			{
				id: 'attack',
				title: m.db_summons_section_attack,
				fields: ['min_atk', 'max_atk', 'max_atk_flb', 'max_atk_ulb', 'max_atk_xlb']
			},
			{ id: 'caps', title: m.db_summons_section_caps, fields: ['max_level'] },
			{ id: 'nicknames', title: m.db_summons_section_nicknames, fields: ['nicknames'] },
			{
				id: 'dates',
				title: m.db_summons_section_dates,
				fields: ['release_date', 'flb_date', 'ulb_date', 'transcendence_date']
			},
			{
				id: 'links',
				title: m.db_summons_section_links,
				fields: ['wiki_en', 'wiki_ja', 'gamewith', 'kamigame']
			}
		]
	},

	derive: [
		stackedUncapCascade,
		// Only when the rarity or an uncap changes: loading keeps the stored level,
		// and a level typed by hand sticks until the next such change
		(v, changed) =>
			changed === 'rarity' || (changed !== null && UNCAPS.includes(changed))
				? { max_level: standardMaxLevel(v) }
				: undefined
	],

	record: {
		fetch: (id) => summonAdapter.getSummon(id),
		query: (id) => entityQueries.summon(id),
		routeId: (s) => s.granblueId,
		noun: m.db_summons_noun,
		type: 'summon',
		image: (s) => getSummonImage(s.granblueId, 'grid'),
		element: (s) => s.element,
		tabs: [
			// Only once the summon has auras
			{
				id: 'skills',
				label: m.db_summons_tab_auras,
				component: SummonAurasTab,
				when: (s) => (s.summonAuras?.length ?? 0) > 0
			},
			{ id: 'images', label: m.db_detail_tab_images, component: SummonImagesTab },
			{ id: 'raw', label: m.db_detail_tab_raw, component: SummonRawDataTab, editorOnly: true }
		]
	},

	save: {
		// Payload keys are the strong params by construction (see contract.test.ts)
		update: (s, payload) =>
			summonAdapter.updateSummon(s.id, payload as Partial<CreateSummonPayload>),
		create: (payload) => summonAdapter.createSummon(payload as unknown as CreateSummonPayload),
		asyncValidate: {
			granblue_id: async (id) => {
				const result = await summonAdapter.validateSummonGranblueId(id as string)
				if (result.existsInDb) return m.db_summons_field_granblue_id_exists()
				return result.valid ? null : result.error || m.db_summons_field_granblue_id_no_images()
			}
		},
		// Queues a job; the new summon's page doesn't wait for it
		afterCreate: (s) => summonAdapter.downloadSummonImages(s.id)
	},

	section: summonsSection
})
