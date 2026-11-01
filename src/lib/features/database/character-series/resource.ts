/**
 * The character series resource (GBF-143): list, detail, edit and new from
 * one description. Series are keyed by slug.
 */
import * as m from '$lib/paraglide/messages'
import { seriesAdapter } from '$lib/api/adapters/series.adapter'
import { entityKeys, entityQueries } from '$lib/api/queries/entity.queries'
import { characterSeriesSection } from '$lib/features/database/character-series/section'
import { sluggedFields } from '$lib/features/database/schema/sluggedFields'
import { defineResource } from '$lib/features/database/schema/types'
import type { AdminCharacterSeriesRow } from '$lib/types/api/admin'
import type {
	CharacterSeries,
	CreateCharacterSeriesPayload,
	UpdateCharacterSeriesPayload
} from '$lib/types/api/characterSeries'

export const characterSeriesResource = defineResource<AdminCharacterSeriesRow, CharacterSeries>({
	name: 'character-series',
	fields: [
		...sluggedFields,
		{
			key: 'character_count',
			kind: 'number',
			label: m.db_character_series_field_character_count,
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
		label: m.db_character_series_label,
		entity: m.db_character_series_entity,
		empty: m.db_character_series_empty,
		title: 'name',
		rowId: (s) => s.slug,
		columns: ['order', 'name', 'slug', 'character_count', 'updated_at'],
		filters: [],
		baseFields: ['slug', 'name_en', 'name_jp'],
		defaultSort: [{ id: 'order', desc: false }]
	},

	layout: {
		detail: [
			{ id: 'basic', title: m.db_section_basic, fields: ['name', 'slug', 'order'] },
			{ id: 'statistics', title: m.db_section_statistics, fields: ['character_count'] }
		]
	},

	record: {
		fetch: (slug) => seriesAdapter.getCharacterSeries(slug),
		query: (slug) => entityQueries.characterSeries(slug),
		routeId: (s) => s.slug,
		noun: m.db_character_series_noun
	},

	save: {
		// Payload keys are the strong params by construction (see contract.test.ts)
		update: (s, payload) =>
			seriesAdapter.updateCharacterSeries(s.id, payload as UpdateCharacterSeriesPayload),
		create: (payload) =>
			seriesAdapter.createCharacterSeries(payload as unknown as CreateCharacterSeriesPayload),
		// Character filters and forms read the series list
		invalidates: () => [entityKeys.allCharacterSeries()]
	},

	section: characterSeriesSection
})
