/**
 * The weapon series resource (GBF-143): list, detail, edit and new from one
 * description. Series are keyed by slug. Variants have their own endpoint:
 * the detail lists them and the edit form edits each in a dialog.
 */
import * as m from '$lib/paraglide/messages'
import { seriesAdapter } from '$lib/api/adapters/series.adapter'
import { entityKeys, entityQueries } from '$lib/api/queries/entity.queries'
import type { FlagValue } from '$lib/components/data-table/types'
import { sluggedFields } from '$lib/features/database/schema/sluggedFields'
import { defineResource, type EnumOption, type Values } from '$lib/features/database/schema/types'
import { weaponSeriesSection } from '$lib/features/database/weapon-series/section'
import type { AdminWeaponSeriesRow } from '$lib/types/api/admin'
import type {
	CreateWeaponSeriesPayload,
	UpdateWeaponSeriesPayload,
	WeaponSeries
} from '$lib/types/api/weaponSeries'
import { AUGMENT_TYPE_LABELS } from '$lib/utils/augmentType'

const FLAGS = ['extra', 'element_changeable', 'has_weapon_keys', 'has_awakening'] as const

const augmentTypeOptions = (): EnumOption[] =>
	Object.entries(AUGMENT_TYPE_LABELS).map(([value, label]) => ({ value, label }))

/** The list's flag chips */
function flags(row: AdminWeaponSeriesRow): FlagValue[] {
	const out: FlagValue[] = []
	if (row.extra) out.push({ label: m.db_weapon_series_flag_extra(), tone: 'extra' })
	if (row.elementChangeable) out.push({ label: m.db_weapon_series_flag_element(), tone: 'element' })
	if (row.hasWeaponKeys) out.push({ label: m.db_weapon_series_flag_keys(), tone: 'keys' })
	if (row.hasAwakening) out.push({ label: m.db_weapon_series_flag_awaken(), tone: 'awaken' })
	if (row.augmentType === 'ax') out.push({ label: m.db_weapon_series_flag_ax(), tone: 'ax' })
	if (row.augmentType === 'befoulment') {
		out.push({ label: m.db_weapon_series_flag_befoulment(), tone: 'neutral' })
	}
	return out
}

const hasKeys = (v: Values) => v.has_weapon_keys === true

/** The flags and their hints; the detail shows only the labels, as it always has */
const flag = {
	kind: 'boolean',
	detail: { sublabel: false },
	list: { defaultHidden: true, sortable: false }
} as const

export const weaponSeriesResource = defineResource<AdminWeaponSeriesRow, WeaponSeries>({
	name: 'weapon-series',
	fields: [
		...sluggedFields,
		{
			...flag,
			key: 'extra',
			label: m.db_weapon_series_field_extra,
			sublabel: m.db_weapon_series_hint_extra
		},
		{
			...flag,
			key: 'element_changeable',
			label: m.db_weapon_series_field_element_changeable,
			sublabel: m.db_weapon_series_hint_element_changeable
		},
		{
			...flag,
			key: 'has_weapon_keys',
			label: m.db_weapon_series_field_has_weapon_keys,
			sublabel: m.db_weapon_series_hint_has_weapon_keys
		},
		{
			key: 'num_weapon_keys',
			kind: 'number',
			label: m.db_weapon_series_field_num_weapon_keys,
			sublabel: m.db_weapon_series_hint_num_weapon_keys,
			int: true,
			min: 0,
			when: hasKeys,
			// Unticking keys clears the slots
			whenHidden: 'empty',
			detail: { sublabel: false },
			list: { defaultHidden: true, sortable: false }
		},
		{
			...flag,
			key: 'has_awakening',
			label: m.db_weapon_series_field_has_awakening,
			sublabel: m.db_weapon_series_hint_has_awakening
		},
		{
			key: 'augment_type',
			kind: 'enum',
			label: m.db_weapon_series_field_augment_type,
			sublabel: m.db_weapon_series_hint_augment_type,
			options: augmentTypeOptions,
			default: 'no_augment',
			required: true,
			detail: { sublabel: false },
			list: { defaultHidden: true, sortable: false },
			filter: { kind: 'multi', facet: true }
		},
		{
			key: 'variants',
			kind: 'custom',
			label: m.db_weapon_series_section_variants,
			write: false,
			// Variants save through their own dialog, which needs the saved series
			form: { create: false },
			render: { input: 'weaponSeriesVariants' }
		},
		{
			key: 'weapon_count',
			kind: 'number',
			label: m.db_weapon_series_field_weapon_count,
			write: false,
			list: { sortable: false, defaultHidden: true }
		},
		{
			key: 'updated_at',
			kind: 'datetime',
			label: m.db_field_updated_at,
			write: false,
			detail: false,
			list: { defaultHidden: true }
		}
	],

	list: {
		label: m.db_weapon_series_label,
		entity: m.db_weapon_series_entity,
		empty: m.db_weapon_series_empty,
		title: 'name',
		rowId: (s) => s.slug,
		columns: [
			'order',
			'name',
			'slug',
			{
				id: 'flags',
				header: m.db_weapon_series_col_flags,
				type: 'flags',
				flags,
				sortable: false,
				minWidth: '200px',
				fields: [...FLAGS, 'augment_type']
			},
			...FLAGS,
			'num_weapon_keys',
			'augment_type',
			'weapon_count',
			'updated_at'
		],
		filters: [
			'augment_type',
			{ id: 'flags', label: m.db_weapon_series_section_flags, toggles: [...FLAGS] }
		],
		baseFields: ['slug', 'name_en', 'name_jp'],
		defaultSort: [{ id: 'order', desc: false }]
	},

	layout: {
		detail: [
			{ id: 'basic', title: m.db_section_basic, fields: ['name', 'slug', 'order'] },
			{
				id: 'flags',
				title: m.db_weapon_series_section_flags,
				fields: [
					'extra',
					'element_changeable',
					'has_weapon_keys',
					'num_weapon_keys',
					'has_awakening',
					'augment_type'
				]
			},
			{
				id: 'variants',
				title: m.db_weapon_series_section_variants,
				fields: ['variants'],
				component: 'weaponSeriesVariants'
			},
			{ id: 'statistics', title: m.db_section_statistics, fields: ['weapon_count'] }
		]
	},

	record: {
		fetch: (slug) => seriesAdapter.getWeaponSeries(slug),
		query: (slug) => entityQueries.weaponSeries(slug),
		routeId: (s) => s.slug,
		noun: m.db_weapon_series_noun
	},

	save: {
		// Payload keys are the strong params by construction (see contract.test.ts)
		update: (s, payload) =>
			seriesAdapter.updateWeaponSeries(s.id, payload as UpdateWeaponSeriesPayload),
		create: (payload) =>
			seriesAdapter.createWeaponSeries(payload as unknown as CreateWeaponSeriesPayload),
		// Weapon filters and forms read the series list
		invalidates: () => [entityKeys.allWeaponSeries()]
	},

	section: weaponSeriesSection
})
