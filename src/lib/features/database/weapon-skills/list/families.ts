/**
 * The weapon skill families list: columns and filters for a static DataTable
 * source. Families come from one request (`GET /weapon_skill_families`), so
 * search, filters and sorting run on the client.
 */
import * as m from '$lib/paraglide/messages'
import type { DataTableColumn, FlagValue } from '$lib/components/data-table/types'
import type { FilterConfig } from '$lib/components/data-table/filters'
import type { StaticFilterFn } from '$lib/components/data-table/staticQuery'
import { getBoostTypeLabel } from '$lib/utils/boostType'
import type { WeaponSkillFamilySummary as Family } from '$lib/types/api/weaponSkillFamily'
import FamilyIconCell from './FamilyIconCell.svelte'

export const FAMILY_SERIES = ['normal', 'omega', 'ex', 'odious'] as const
export const FAMILY_SIZES = ['small', 'medium', 'big', 'big2', 'massive', 'ancestral'] as const

const SERIES_LABELS: Record<string, () => string> = {
	normal: m.db_weapon_skills_series_normal,
	omega: m.db_weapon_skills_series_omega,
	ex: m.db_weapon_skills_series_ex,
	odious: m.db_weapon_skills_series_odious
}

const seriesLabel = (series: string) => SERIES_LABELS[series]?.() ?? series
const joined = (values: string[]) => values.join(', ')

export const familyHref = (family: Family) =>
	`/database/weapon-skills/${encodeURIComponent(family.modifier)}`

export const familyColumns: DataTableColumn<Family>[] = [
	{
		id: 'icon',
		header: m.db_weapon_skills_col_icon,
		type: 'component',
		component: FamilyIconCell,
		sortable: false,
		width: '64px',
		align: 'center'
	},
	{
		id: 'name',
		header: m.db_weapon_skills_col_family,
		type: 'name',
		name: (f) => ({ en: f.displayName?.en ?? f.modifier, ja: f.displayName?.ja }),
		primary: true,
		minWidth: '200px'
	},
	{
		id: 'modifier',
		header: m.db_weapon_skills_col_modifier,
		type: 'code',
		value: (f) => f.modifier,
		searchable: true,
		// Usually the family's name; the name column falls back to it
		defaultHidden: true,
		width: '200px'
	},
	{
		id: 'boost_types',
		header: m.db_weapon_skills_col_boost_types,
		type: 'text',
		value: (f) => joined(f.boostTypes.map(getBoostTypeLabel)),
		minWidth: '180px'
	},
	{
		id: 'series',
		header: m.db_weapon_skills_col_series,
		type: 'text',
		value: (f) => joined(f.series.map(seriesLabel)),
		width: '120px'
	},
	{
		id: 'sizes',
		header: m.db_weapon_skills_col_sizes,
		type: 'text',
		value: (f) => joined(f.sizes),
		width: '140px'
	},
	{
		id: 'weapons',
		header: m.db_weapon_skills_col_weapons,
		type: 'number',
		value: (f) => f.counts.weapons,
		width: '96px',
		align: 'end'
	},
	{
		id: 'versions',
		header: m.db_weapon_skills_col_versions,
		type: 'number',
		value: (f) => f.counts.versions,
		width: '96px',
		align: 'end'
	},
	{
		id: 'edited',
		header: m.db_weapon_skills_col_edited,
		type: 'flags',
		flags: (f): FlagValue[] =>
			f.manuallyEdited ? [{ label: m.db_weapon_skills_flag_edited(), tone: 'awaken' }] : [],
		sortValue: (f) => f.manuallyEdited,
		width: '140px'
	}
]

/** Filters; the boost types come from the loaded families */
export function familyFilters(families: () => Family[]): FilterConfig[] {
	return [
		{
			kind: 'multi',
			key: 'series',
			label: m.db_weapon_skills_col_series,
			options: () => FAMILY_SERIES.map((s) => ({ value: s, label: seriesLabel(s) }))
		},
		{
			kind: 'multi',
			key: 'size',
			label: m.db_weapon_skills_col_sizes,
			options: () => FAMILY_SIZES.map((s) => ({ value: s, label: s }))
		},
		{
			kind: 'multi',
			key: 'boost_type',
			label: m.db_weapon_skills_col_boost_types,
			options: () =>
				[...new Set(families().flatMap((f) => f.boostTypes))]
					.sort()
					.map((bt) => ({ value: bt, label: getBoostTypeLabel(bt) }))
		},
		{
			kind: 'toggles',
			id: 'flags',
			label: m.db_weapon_skills_filter_flags,
			toggles: [{ key: 'edited', label: m.db_weapon_skills_flag_edited }]
		}
	]
}

const anyOf =
	(pick: (f: Family) => string[]): StaticFilterFn<Family> =>
	(family, value) => {
		const wanted = Array.isArray(value) ? value : []
		return wanted.length === 0 || pick(family).some((v) => wanted.includes(v))
	}

export const familyFilterFns: Record<string, StaticFilterFn<Family>> = {
	series: anyOf((f) => f.series),
	size: anyOf((f) => f.sizes),
	boost_type: anyOf((f) => f.boostTypes),
	edited: (family, value) => value !== true || family.manuallyEdited
}
