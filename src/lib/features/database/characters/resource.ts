/**
 * The characters resource: every field the characters list, detail, edit and
 * new pages show, described once (GBF-143). Style shifts keep their own pages
 * (`characters/[id]/style`); their list rows and panel ids carry a `-style`
 * suffix.
 */
import { z } from 'zod'
import * as m from '$lib/paraglide/messages'
import {
	characterAdapter,
	type Character,
	type CreateCharacterPayload
} from '$lib/api/adapters/character.adapter'
import { entityQueries } from '$lib/api/queries/entity.queries'
import {
	elementFilterOptions,
	rarityFilterOptions,
	seriesFilterOptions,
	weaponProficiencyFilterOptions
} from '$lib/components/data-table/filterOptions'
import { characterRowId } from '$lib/components/data-table/resultSync'
import CharacterUncapCell from '$lib/components/database/cells/CharacterUncapCell.svelte'
import CharacterImagesTab from '$lib/features/database/characters/tabs/CharacterImagesTab.svelte'
import CharacterRawDataTab from '$lib/features/database/characters/tabs/CharacterRawDataTab.svelte'
import CharacterSkillsTab from '$lib/features/database/characters/tabs/CharacterSkillsTab.svelte'
import { charactersSection } from '$lib/features/database/characters/section'
import { defineResource, type EnumOption, type Values } from '$lib/features/database/schema/types'
import { CHARACTER_SEASON_NAMES, PROMOTION_NAMES } from '$lib/types/enums'
import { getElementOptions } from '$lib/utils/element'
import {
	buildGamewithUrl,
	buildKamigameUrl,
	buildWikiEnUrl,
	buildWikiJaUrl
} from '$lib/utils/external-links'
import { getGenderOptions } from '$lib/utils/gender'
import { getCharacterImage } from '$lib/utils/images/characters'
import { localizedName } from '$lib/utils/locale'
import { getWeaponProficiencyOptions } from '$lib/utils/proficiency'
import { getRaceLabel, RACE_LABELS } from '$lib/utils/race'
import { getRarityOptions } from '$lib/utils/rarity'
import type { AdminCharacterRow } from '$lib/types/api/admin'
import type { CharacterSeries } from '$lib/types/api/characterSeries'

const GRANBLUE_ID = /^\d{10}$/

const UNCAPS = ['flb', 'ulb', 'transcendence']

const flb = (v: Values) => v.flb === true
const ulb = (v: Values) => v.ulb === true
const transcendence = (v: Values) => v.transcendence === true
const special = (v: Values) => v.special === true
const styleSwap = (v: Values) => v.style_swap === true

const options = (labels: Record<number, string>) => (): EnumOption[] =>
	Object.entries(labels).map(([value, label]) => ({ value: Number(value), label }))

const raceOptions = (): EnumOption[] =>
	Object.keys(RACE_LABELS).map((value) => ({
		value: Number(value),
		label: () => getRaceLabel(Number(value))
	}))

const stageOptions = (): EnumOption[] =>
	[1, 2, 3, 4, 5].map((stage) => ({
		value: stage,
		label: () => m.db_characters_stage({ stage: String(stage) })
	}))

/**
 * Story characters (special) uncap FLB then ULB; everyone else FLB then
 * transcendence, which needs its highest released stage. Ticking or unticking
 * one carries the rest, and switching special clears the other track.
 */
function uncapCascade(v: Values, changed: string | null): Values | undefined {
	switch (changed) {
		case 'flb':
			return flb(v)
				? undefined
				: { ulb: false, transcendence: false, max_transcendence_stage: null }
		case 'ulb':
			return ulb(v) ? { flb: true } : undefined
		case 'transcendence':
			return transcendence(v) ? { flb: true } : { max_transcendence_stage: null }
		case 'special':
			return special(v) ? { transcendence: false, max_transcendence_stage: null } : { ulb: false }
		default:
			return undefined
	}
}

/** Stats are whole numbers the API never stores below zero */
const stat = { kind: 'number', int: true, min: 0 } as const

export const charactersResource = defineResource<AdminCharacterRow, Character>({
	name: 'characters',
	fields: [
		// Metadata
		{
			key: 'name',
			kind: 'localized',
			label: m.db_characters_col_name,
			keys: { en: 'name_en', ja: 'name_jp' },
			labels: { en: m.db_characters_field_name_en, ja: m.db_characters_field_name_jp },
			required: true,
			list: { primary: true, minWidth: '220px' }
		},
		{
			key: 'rarity',
			kind: 'enum',
			label: m.db_characters_col_rarity,
			options: getRarityOptions,
			default: 3,
			required: true,
			list: { width: '80px' },
			filter: { kind: 'multi', options: rarityFilterOptions, facet: true }
		},
		{
			key: 'granblue_id',
			kind: 'code',
			label: m.db_characters_field_granblue_id,
			required: true,
			validate: z
				.string()
				.regex(GRANBLUE_ID, { error: () => m.db_characters_field_granblue_id_invalid() })
		},
		{
			key: 'character_id',
			kind: 'numberList',
			label: m.db_characters_field_character_id,
			sublabel: m.db_characters_hint_character_id,
			detail: { hideWhenEmpty: true, sublabel: false }
		},
		// The weapon that recruits the character (its `recruits`), and that weapon's gacha pools
		{
			key: 'recruited_by',
			kind: 'reference',
			label: m.db_characters_field_recruited_by,
			resource: 'weapon',
			write: false,
			detail: { hideWhenEmpty: true }
		},
		{
			key: 'promotions',
			kind: 'enumList',
			label: m.db_characters_field_promotions,
			sublabel: m.db_characters_hint_promotions,
			options: options(PROMOTION_NAMES),
			read: (c) => c.recruitedBy?.promotions,
			write: false,
			detail: { when: (v) => Boolean(v.recruited_by) }
		},
		{
			key: 'series',
			kind: 'referenceList',
			label: m.db_characters_col_series,
			resource: 'characterSeries',
			// Characters not yet moved to the series table still carry legacy numbers
			detail: { value: (c) => c.seriesNames },
			list: {
				value: (c) =>
					c.series
						?.map((s) => localizedName({ en: s.nameEn ?? '', ja: s.nameJp ?? '' }))
						.join(', ') || null,
				sortable: false,
				width: '172px',
				defaultHidden: true
			},
			filter: {
				kind: 'multi',
				query: () => entityQueries.characterSeriesList(),
				options: (series) => seriesFilterOptions(series as CharacterSeries[] | undefined),
				facet: true
			}
		},
		{
			key: 'season',
			kind: 'enum',
			label: m.db_characters_col_season,
			sublabel: m.db_characters_hint_season,
			options: options(CHARACTER_SEASON_NAMES),
			detail: { sublabel: false },
			list: { defaultHidden: true },
			filter: { kind: 'multi', facet: true }
		},
		// Uncap
		{
			key: 'uncap',
			kind: 'custom',
			label: m.db_characters_field_uncap,
			write: false,
			// The forms show the stars too, following the checkboxes
			render: { cell: CharacterUncapCell, detail: 'characterUncap', input: 'characterUncap' },
			list: {
				header: m.db_characters_col_uncap,
				sortable: false,
				width: '160px',
				fields: [...UNCAPS, 'max_transcendence_stage', 'special']
			}
		},
		{
			key: 'flb',
			kind: 'boolean',
			label: m.db_characters_field_flb,
			read: (c) => c.uncap?.flb,
			list: { sortable: false, defaultHidden: true }
		},
		{
			key: 'ulb',
			kind: 'boolean',
			label: m.db_characters_field_ulb,
			read: (c) => c.uncap?.ulb,
			when: special,
			// Unticking special clears it
			whenHidden: 'empty',
			list: { sortable: false, defaultHidden: true }
		},
		{
			key: 'transcendence',
			kind: 'boolean',
			label: m.db_characters_field_transcendence,
			read: (c) => c.uncap?.transcendence,
			when: (v) => !special(v),
			// Ticking special clears it
			whenHidden: 'empty',
			// The detail says No for a story character too
			detail: { when: () => true },
			list: { sortable: false, defaultHidden: true }
		},
		{
			key: 'max_transcendence_stage',
			kind: 'enum',
			label: m.db_characters_field_max_transcendence_stage,
			options: stageOptions,
			// Zero (no transcendence) is the API's blank
			read: (c) => c.uncap?.maxTranscendenceStage || null,
			required: true,
			// Hidden, the API stores 0
			when: transcendence,
			list: {
				header: m.db_characters_col_max_transcendence_stage,
				type: 'number',
				value: (c) => c.maxTranscendenceStage,
				sortable: false,
				defaultHidden: true
			}
		},
		{
			key: 'special',
			kind: 'boolean',
			label: m.db_characters_field_special,
			sublabel: m.db_characters_hint_special,
			detail: { sublabel: false },
			list: { sortable: false, defaultHidden: true }
		},
		// Appearance
		{
			key: 'gender_variants',
			kind: 'boolean',
			label: m.db_characters_field_gender_variants,
			sublabel: m.db_characters_hint_gender_variants
		},
		// Details
		{
			key: 'element',
			kind: 'enum',
			label: m.db_characters_col_element,
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
			key: 'race1',
			kind: 'enum',
			label: m.db_characters_field_race1,
			options: raceOptions,
			read: (c) => c.race?.[0] ?? null
		},
		{
			key: 'race2',
			kind: 'enum',
			label: m.db_characters_field_race2,
			options: raceOptions,
			read: (c) => c.race?.[1] ?? null
		},
		{
			key: 'gender',
			kind: 'enum',
			label: m.db_characters_col_gender,
			options: getGenderOptions,
			default: 0,
			required: true,
			list: { sortable: false, defaultHidden: true },
			filter: { kind: 'multi' }
		},
		// Both proficiencies, for the list's column and filter (the API matches either)
		{
			key: 'proficiency',
			kind: 'enumList',
			label: m.db_characters_col_proficiency,
			options: getWeaponProficiencyOptions,
			write: false,
			form: false,
			detail: false,
			list: {
				type: 'proficiency',
				value: (c) => [c.proficiency1, c.proficiency2],
				sortable: false,
				// Room for two badges: characters can have a second proficiency
				width: '168px',
				fields: ['proficiency1', 'proficiency2']
			},
			filter: { kind: 'multi', options: weaponProficiencyFilterOptions, facet: true }
		},
		{
			key: 'proficiency1',
			kind: 'enum',
			label: m.db_characters_field_proficiency1,
			options: getWeaponProficiencyOptions,
			read: (c) => c.proficiency?.[0] ?? null,
			required: true,
			// Draws as the proficiency's label
			list: { type: 'proficiency' }
		},
		{
			key: 'proficiency2',
			kind: 'enum',
			label: m.db_characters_field_proficiency2,
			options: getWeaponProficiencyOptions,
			// None (0) and null both mean no second proficiency; blank sends null
			read: (c) => c.proficiency?.[1] || null,
			list: { type: 'proficiency' }
		},
		{
			key: 'style_swap',
			kind: 'boolean',
			label: m.db_characters_field_style_swap,
			// Only a style shift says so
			detail: { when: styleSwap },
			list: { sortable: false, defaultHidden: true },
			filter: { kind: 'toggle', label: m.db_characters_filter_style_swap }
		},
		{
			key: 'style_name',
			kind: 'localized',
			label: m.db_characters_field_style_name,
			keys: { en: 'style_name_en', ja: 'style_name_jp' },
			labels: { en: m.db_characters_field_style_name_en, ja: m.db_characters_field_style_name_jp },
			read: (c) => c.styleName,
			when: styleSwap,
			form: { width: '480px' }
		},
		{
			key: 'base_character',
			kind: 'reference',
			label: m.db_characters_field_base_character,
			resource: 'character',
			write: false,
			detail: { when: styleSwap, hideWhenEmpty: true }
		},
		// HP and attack
		{ ...stat, key: 'min_hp', label: m.db_characters_field_min_hp, read: (c) => c.hp?.minHp },
		{ ...stat, key: 'max_hp', label: m.db_characters_field_max_hp, read: (c) => c.hp?.maxHp },
		{
			...stat,
			key: 'max_hp_flb',
			label: m.db_characters_field_max_hp_flb,
			read: (c) => c.hp?.maxHpFlb,
			when: flb
		},
		{
			...stat,
			key: 'max_hp_transcendence',
			label: m.db_characters_field_max_hp_transcendence,
			read: (c) => c.hp?.maxHpTranscendence,
			when: transcendence
		},
		{
			...stat,
			key: 'max_hp_ulb',
			label: m.db_characters_field_max_hp_ulb,
			read: (c) => c.hp?.maxHpUlb,
			when: ulb
		},
		{ ...stat, key: 'min_atk', label: m.db_characters_field_min_atk, read: (c) => c.atk?.minAtk },
		{ ...stat, key: 'max_atk', label: m.db_characters_field_max_atk, read: (c) => c.atk?.maxAtk },
		{
			...stat,
			key: 'max_atk_flb',
			label: m.db_characters_field_max_atk_flb,
			read: (c) => c.atk?.maxAtkFlb,
			when: flb
		},
		{
			...stat,
			key: 'max_atk_transcendence',
			label: m.db_characters_field_max_atk_transcendence,
			read: (c) => c.atk?.maxAtkTranscendence,
			when: transcendence
		},
		{
			...stat,
			key: 'max_atk_ulb',
			label: m.db_characters_field_max_atk_ulb,
			read: (c) => c.atk?.maxAtkUlb,
			when: ulb
		},
		// Other stats: charge attack ratios are decimals
		{ ...stat, key: 'base_da', label: m.db_characters_field_base_da },
		{ ...stat, key: 'base_ta', label: m.db_characters_field_base_ta },
		{
			key: 'ougi_ratio',
			kind: 'number',
			label: m.db_characters_field_ougi_ratio,
			min: 0,
			read: (c) => c.ougiRatio?.ougiRatio
		},
		{
			key: 'ougi_ratio_flb',
			kind: 'number',
			label: m.db_characters_field_ougi_ratio_flb,
			min: 0,
			read: (c) => c.ougiRatio?.ougiRatioFlb,
			when: flb
		},
		// Nicknames
		{
			key: 'nicknames',
			kind: 'localized',
			of: 'tags',
			label: m.db_characters_section_nicknames,
			keys: { en: 'nicknames_en', ja: 'nicknames_jp' },
			labels: { en: m.db_characters_field_nicknames_en, ja: m.db_characters_field_nicknames_jp }
		},
		// Dates
		{
			key: 'release_date',
			kind: 'date',
			label: m.db_characters_field_release_date,
			list: { header: m.db_characters_col_release_date, defaultHidden: true }
		},
		{
			key: 'flb_date',
			kind: 'date',
			label: m.db_characters_field_flb_date,
			when: flb,
			list: { header: m.db_characters_col_flb_date, defaultHidden: true }
		},
		{
			key: 'transcendence_date',
			kind: 'date',
			label: m.db_characters_field_transcendence_date,
			when: transcendence,
			list: { header: m.db_characters_col_transcendence_date, defaultHidden: true }
		},
		{
			key: 'ulb_date',
			kind: 'date',
			label: m.db_characters_field_ulb_date,
			when: ulb,
			list: { header: m.db_characters_col_ulb_date, defaultHidden: true }
		},
		// Links
		{
			key: 'wiki_en',
			kind: 'link',
			label: m.db_characters_field_wiki_en,
			read: (c) => c.wiki?.en,
			href: (v) => buildWikiEnUrl(v),
			form: { placeholder: m.db_characters_hint_wiki_en, width: '480px' }
		},
		{
			key: 'wiki_ja',
			kind: 'link',
			label: m.db_characters_field_wiki_ja,
			read: (c) => c.wiki?.ja,
			href: (v) => buildWikiJaUrl(v, 'character'),
			form: { placeholder: m.db_characters_hint_wiki_ja, width: '480px' }
		},
		{
			key: 'gamewith',
			kind: 'link',
			label: m.db_characters_field_gamewith,
			href: (v) => buildGamewithUrl(v),
			form: { placeholder: m.db_characters_hint_gamewith, width: '480px' }
		},
		{
			key: 'kamigame',
			kind: 'link',
			label: m.db_characters_field_kamigame,
			href: (v) => buildKamigameUrl(v, 'character'),
			form: { placeholder: m.db_characters_hint_kamigame, width: '480px' }
		},
		// The other units sharing its character ID; the section loads them
		{
			key: 'related',
			kind: 'custom',
			label: m.db_characters_section_related,
			read: (c) => c.characterId,
			write: false,
			detail: { hideWhenEmpty: true }
		},
		// List only
		{
			key: 'latest_date',
			kind: 'date',
			label: m.db_characters_col_latest_date,
			write: false
		},
		{
			key: 'updated_at',
			kind: 'datetime',
			label: m.db_characters_col_updated_at,
			write: false,
			list: { defaultHidden: true },
			filter: {
				kind: 'recent',
				label: m.db_characters_filter_updated,
				presets: [
					{ days: 7, label: m.db_characters_filter_updated_7 },
					{ days: 30, label: m.db_characters_filter_updated_30 }
				]
			}
		},
		{
			key: 'skill_count',
			kind: 'number',
			label: m.db_characters_col_skill_count,
			write: false,
			list: { sortable: false, defaultHidden: true }
		}
	],

	list: {
		label: m.db_characters_label,
		entity: m.collection_entity_characters,
		empty: m.db_characters_empty,
		title: 'name',
		element: 'element',
		rowId: characterRowId,
		rowHeight: 'image',
		pinFirstColumn: true,
		columns: [
			{
				id: 'image',
				header: '',
				type: 'image',
				image: 'character',
				sortable: false,
				hideable: false,
				width: '96px',
				// Table cells shrink to their content's minimum, and a thumb has none
				minWidth: '96px'
			},
			'name',
			'rarity',
			'element',
			'proficiency',
			'uncap',
			'series',
			'season',
			'gender',
			'special',
			'style_swap',
			'flb',
			'ulb',
			'transcendence',
			'max_transcendence_stage',
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
			'season',
			'gender',
			{ id: 'uncap', label: m.db_characters_filter_uncap, toggles: UNCAPS },
			{ id: 'type', label: m.db_characters_filter_type, toggles: ['special', 'style_swap'] },
			{
				id: 'quality',
				label: m.db_characters_filter_quality,
				toggles: [
					{ key: 'missing_name_jp', label: m.db_characters_filter_missing_name_jp },
					{ key: 'no_skills', label: m.db_characters_filter_no_skills }
				]
			},
			'updated_at'
		],
		// A style shift's row needs its flag for its id, link and thumbnail
		baseFields: ['granblue_id', 'name_en', 'name_jp', 'style_swap'],
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
				title: m.db_characters_section_metadata,
				fields: [
					'name',
					'rarity',
					'granblue_id',
					'character_id',
					'recruited_by',
					'promotions',
					'series',
					'season'
				]
			},
			{
				id: 'uncap',
				title: m.db_characters_section_uncap,
				fields: ['uncap', 'flb', 'ulb', 'transcendence', 'max_transcendence_stage', 'special']
			},
			{
				id: 'appearance',
				title: m.db_characters_section_appearance,
				fields: ['gender_variants']
			},
			{
				id: 'details',
				title: m.db_characters_section_details,
				fields: [
					'element',
					'race1',
					'race2',
					'gender',
					'proficiency1',
					'proficiency2',
					'style_swap',
					'style_name',
					'base_character'
				]
			},
			{
				id: 'hp',
				title: m.db_characters_section_hp,
				fields: ['min_hp', 'max_hp', 'max_hp_flb', 'max_hp_transcendence', 'max_hp_ulb']
			},
			{
				id: 'attack',
				title: m.db_characters_section_attack,
				fields: ['min_atk', 'max_atk', 'max_atk_flb', 'max_atk_transcendence', 'max_atk_ulb']
			},
			{
				id: 'other',
				title: m.db_characters_section_other,
				fields: ['base_da', 'base_ta', 'ougi_ratio', 'ougi_ratio_flb']
			},
			{ id: 'nicknames', title: m.db_characters_section_nicknames, fields: ['nicknames'] },
			{
				id: 'dates',
				title: m.db_characters_section_dates,
				fields: ['release_date', 'flb_date', 'transcendence_date', 'ulb_date']
			},
			{
				id: 'links',
				title: m.db_characters_section_links,
				fields: ['wiki_en', 'wiki_ja', 'gamewith', 'kamigame']
			},
			{
				id: 'related',
				title: m.db_characters_section_related,
				fields: ['related'],
				component: 'characterRelated',
				// Shown only once the related units load
				container: false
			}
		]
	},

	derive: [uncapCascade],

	// The model's uncap rules, should the cascade ever be bypassed
	refine: (v, issue) => {
		if (transcendence(v) && !v.max_transcendence_stage) {
			issue('max_transcendence_stage', m.db_characters_error_stage())
		}
		if (special(v) && transcendence(v)) {
			issue('transcendence', m.db_characters_error_special_transcendence())
		}
		if (ulb(v) && (!special(v) || !flb(v))) issue('ulb', m.db_characters_error_ulb())
	},

	record: {
		fetch: (id) => characterAdapter.getCharacter(id),
		query: (id) => entityQueries.character(id),
		routeId: (c) => c.granblueId,
		// A style shift has its own page
		path: (c) => `/database/characters/${c.granblueId}${c.styleSwap ? '/style' : ''}`,
		noun: m.db_characters_noun,
		type: 'character',
		image: (c) => getCharacterImage(c.granblueId, 'grid', c.styleSwap ? '01_style' : '01'),
		element: (c) => c.element,
		tabs: [
			{ id: 'skills', label: m.character_skills_tab, component: CharacterSkillsTab },
			{ id: 'images', label: m.db_detail_tab_images, component: CharacterImagesTab },
			{ id: 'raw', label: m.db_detail_tab_raw, component: CharacterRawDataTab, editorOnly: true }
		]
	},

	save: {
		// Payload keys are the strong params by construction (see contract.test.ts)
		update: (c, payload) =>
			characterAdapter.updateCharacter(c.id, payload as Partial<CreateCharacterPayload>),
		create: (payload) =>
			characterAdapter.createCharacter(payload as unknown as CreateCharacterPayload),
		asyncValidate: {
			granblue_id: async (id, values) => {
				const result = await characterAdapter.validateCharacterGranblueId(id as string)
				// A style shift shares its base character's ID
				if (result.existsInDb && !styleSwap(values)) {
					return m.db_characters_field_granblue_id_exists()
				}
				return result.valid ? null : result.error || m.db_characters_field_granblue_id_no_images()
			}
		},
		// Queues a job; the new character's page doesn't wait for it
		afterCreate: (c) => characterAdapter.downloadCharacterImages(c.id)
	},

	section: charactersSection,

	// The list screen renders the generated list with the batch refresh action,
	// and keeps the Series view by hand until series become a resource (GBF-143)
	screens: {
		list: () => import('$lib/features/database/characters/screens/CharactersListScreen.svelte')
	}
})
