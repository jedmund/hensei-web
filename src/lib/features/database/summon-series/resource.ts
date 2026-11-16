/**
 * The summon series resource: list, detail, edit and new from one
 * description, like the weapon and character series. Series are keyed by
 * slug.
 */
import { m } from '$lib/paraglide/messages'
import { seriesAdapter } from '$lib/api/adapters/series.adapter'
import { entityKeys, entityQueries } from '$lib/api/queries/entity.queries'
import { seriesIconColumn, summonSeriesIcon } from '$lib/features/database/schema/seriesIcon'
import { sluggedFields } from '$lib/features/database/schema/sluggedFields'
import { defineResource } from '$lib/features/database/schema/types'
import { summonSeriesSection } from '$lib/features/database/summon-series/section'
import type { AdminSummonSeriesRow } from '$lib/types/api/admin'
import type {
	CreateSummonSeriesPayload,
	SummonSeries,
	UpdateSummonSeriesPayload
} from '$lib/types/api/summonSeries'

export const summonSeriesResource = defineResource<AdminSummonSeriesRow, SummonSeries>({
	name: 'summon-series',
	fields: [
		...sluggedFields,
		{
			key: 'summon_count',
			kind: 'number',
			label: m.db_summon_series_field_summon_count,
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
		label: m.db_summon_series_label,
		entity: m.db_summon_series_entity,
		empty: m.db_summon_series_empty,
		title: 'name',
		rowId: (s) => s.slug,
		columns: [
			seriesIconColumn(summonSeriesIcon),
			'order',
			'name',
			'slug',
			'summon_count',
			'updated_at'
		],
		filters: [],
		baseFields: ['slug', 'name_en', 'name_jp'],
		defaultSort: [{ id: 'order', desc: false }]
	},

	layout: {
		detail: [
			{ id: 'basic', title: m.db_section_basic, fields: ['name', 'slug', 'order'] },
			{ id: 'statistics', title: m.db_section_statistics, fields: ['summon_count'] }
		]
	},

	record: {
		fetch: (slug) => seriesAdapter.getSummonSeries(slug),
		query: (slug) => entityQueries.summonSeries(slug),
		routeId: (s) => s.slug,
		noun: m.db_summon_series_noun,
		type: 'series',
		image: (s) => summonSeriesIcon(s.slug)
	},

	save: {
		// Payload keys are the strong params by construction (see contract.test.ts)
		update: (s, payload) =>
			seriesAdapter.updateSummonSeries(s.id, payload as UpdateSummonSeriesPayload),
		create: (payload) =>
			seriesAdapter.createSummonSeries(payload as unknown as CreateSummonSeriesPayload),
		// Summon filters and forms read the series list
		invalidates: () => [entityKeys.allSummonSeries()]
	},

	section: summonSeriesSection
})
