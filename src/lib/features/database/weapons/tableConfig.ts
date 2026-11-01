/**
 * The weapons list's columns and filters, as WeaponsTable declares them by
 * hand. Kept in a module so the schema layer's parity test can compare its
 * generated config against it; both go away when the list is generated
 * from the weapons resource (GBF-142 phase 4).
 */
import type { Snippet } from 'svelte'
import * as m from '$lib/paraglide/messages'
import type { FilterConfig } from '$lib/components/data-table/filters'
import {
	elementFilterOptions,
	rarityFilterOptions,
	seriesFilterOptions,
	weaponProficiencyFilterOptions
} from '$lib/components/data-table/filterOptions'
import type { DataTableColumn } from '$lib/components/data-table/types'
import type { SortSpec } from '$lib/components/data-table/urlState'
import { localizedName } from '$lib/utils/locale'
import { getRarityLabel } from '$lib/utils/rarity'
import type { AdminWeaponRow } from '$lib/types/api/admin'
import type { WeaponSeries } from '$lib/types/api/weaponSeries'

export const WEAPONS_DEFAULT_SORT: SortSpec[] = [
	{ id: 'latest_date', desc: true },
	{ id: 'name', desc: false }
]

/** Ids, links and the panel title, whichever columns are visible */
export const WEAPONS_BASE_FIELDS = ['granblue_id', 'name_en', 'name_jp']

export function weaponsFilters(series: () => WeaponSeries[] | undefined): FilterConfig[] {
	return [
		{
			kind: 'multi',
			key: 'element',
			label: m.db_weapons_col_element,
			options: () => elementFilterOptions({ includeNull: true }),
			facet: true
		},
		{
			kind: 'multi',
			key: 'rarity',
			label: m.db_weapons_col_rarity,
			options: rarityFilterOptions,
			facet: true
		},
		{
			kind: 'multi',
			key: 'proficiency',
			label: m.db_weapons_col_proficiency,
			options: weaponProficiencyFilterOptions,
			facet: true
		},
		{
			kind: 'multi',
			key: 'series',
			label: m.db_weapons_col_series,
			options: () => seriesFilterOptions(series(), m.db_weapons_filter_no_series),
			facet: true
		},
		{
			kind: 'toggles',
			id: 'uncap',
			label: m.db_weapons_filter_uncap,
			toggles: [
				{ key: 'flb', label: m.db_weapons_filter_flb },
				{ key: 'ulb', label: m.db_weapons_filter_ulb },
				{ key: 'transcendence', label: m.db_weapons_filter_transcendence }
			]
		},
		{
			kind: 'toggles',
			id: 'type',
			label: m.db_weapons_filter_type,
			toggles: [
				{ key: 'extra', label: m.db_weapons_filter_extra },
				{ key: 'limit', label: m.db_weapons_filter_limit }
			]
		},
		{
			kind: 'toggles',
			id: 'quality',
			label: m.db_weapons_filter_quality,
			toggles: [
				{ key: 'missing_name_jp', label: m.db_weapons_filter_missing_name_jp },
				{ key: 'no_skills', label: m.db_weapons_filter_no_skills }
			]
		},
		{
			kind: 'recent',
			key: 'updated_at',
			label: m.db_weapons_filter_updated,
			presets: [
				{ days: 7, label: m.db_weapons_filter_updated_7 },
				{ days: 30, label: m.db_weapons_filter_updated_30 }
			]
		}
	]
}

// Column ids are the API sort fields, so the URL reads ?sort=-latest_date
export function weaponsColumns(
	uncapCell: Snippet<[AdminWeaponRow]>
): DataTableColumn<AdminWeaponRow>[] {
	return [
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
		{
			id: 'name',
			header: m.db_weapons_col_name,
			type: 'name',
			name: (w) => ({ en: w.nameEn, ja: w.nameJp }),
			sortField: 'name_en',
			primary: true,
			minWidth: '220px',
			fields: ['name_en', 'name_jp']
		},
		{
			id: 'rarity',
			header: m.db_weapons_col_rarity,
			type: 'text',
			value: (w) => (w.rarity === null ? null : getRarityLabel(w.rarity)),
			sortValue: (w) => w.rarity,
			width: '80px',
			fields: ['rarity']
		},
		{
			id: 'element',
			header: m.db_weapons_col_element,
			type: 'element',
			value: (w) => w.element,
			fields: ['element']
		},
		{
			id: 'proficiency',
			header: m.db_weapons_col_proficiency,
			type: 'proficiency',
			value: (w) => w.proficiency,
			fields: ['proficiency']
		},
		{
			id: 'uncap',
			header: m.db_weapons_col_uncap,
			type: 'custom',
			cell: uncapCell,
			sortable: false,
			width: '144px',
			fields: ['flb', 'ulb', 'transcendence']
		},
		{
			id: 'series',
			header: m.db_weapons_col_series,
			type: 'text',
			value: (w) =>
				w.seriesNameEn || w.seriesNameJp
					? localizedName({ en: w.seriesNameEn ?? '', ja: w.seriesNameJp ?? '' })
					: null,
			sortable: false,
			width: '172px',
			fields: ['series_name_en', 'series_name_jp']
		},
		{
			id: 'release_date',
			header: m.db_weapons_col_release_date,
			type: 'date',
			value: (w) => w.releaseDate,
			fields: ['release_date']
		},
		{
			id: 'flb_date',
			header: m.db_weapons_col_flb_date,
			type: 'date',
			value: (w) => w.flbDate,
			defaultHidden: true,
			fields: ['flb_date']
		},
		{
			id: 'ulb_date',
			header: m.db_weapons_col_ulb_date,
			type: 'date',
			value: (w) => w.ulbDate,
			defaultHidden: true,
			fields: ['ulb_date']
		},
		{
			id: 'transcendence_date',
			header: m.db_weapons_col_transcendence_date,
			type: 'date',
			value: (w) => w.transcendenceDate,
			defaultHidden: true,
			fields: ['transcendence_date']
		},
		// The newest of the release and uncap dates: when the game last changed it
		{
			id: 'latest_date',
			header: m.db_weapons_col_latest_date,
			type: 'date',
			value: (w) => w.latestDate,
			fields: ['latest_date']
		},
		// When someone last edited the record on the site
		{
			id: 'updated_at',
			header: m.db_weapons_col_updated_at,
			type: 'date',
			value: (w) => w.updatedAt,
			defaultHidden: true,
			fields: ['updated_at']
		},
		{
			id: 'skill_count',
			header: m.db_weapons_col_skill_count,
			type: 'number',
			value: (w) => w.skillCount,
			sortable: false,
			align: 'end',
			defaultHidden: true,
			fields: ['skill_count']
		}
	]
}
