<!--
  The main weapons list: DataTable over the editor admin API, with filters
  and the record side panel. Mount it inside a component that provides a
  ResultSet (setResultSet) so the panel steps through these rows.
-->
<script lang="ts">
	import type { Snippet } from 'svelte'
	import { MediaQuery } from 'svelte/reactivity'
	import { page } from '$app/state'
	import { createQuery } from '@tanstack/svelte-query'
	import * as m from '$lib/paraglide/messages'
	import { entityQueries } from '$lib/api/queries/entity.queries'
	import DataTable from '$lib/components/data-table/DataTable.svelte'
	import { createTableUrl } from '$lib/components/data-table/tableUrl.svelte'
	import { createServerSource } from '$lib/components/data-table/serverSource.svelte'
	import { catalogueRowId } from '$lib/components/data-table/resultSync'
	import { facetKeys, filterSpecs, type FilterConfig } from '$lib/components/data-table/filters'
	import {
		elementFilterOptions,
		rarityFilterOptions,
		seriesFilterOptions,
		weaponProficiencyFilterOptions
	} from '$lib/components/data-table/filterOptions'
	import type { DataTableColumn } from '$lib/components/data-table/types'
	import WeaponUncapCell from '$lib/components/database/cells/WeaponUncapCell.svelte'
	import RecordPanel from '$lib/features/database/panel/RecordPanel.svelte'
	import {
		openInPanel,
		opensInPanel,
		PANEL_MIN_QUERY
	} from '$lib/features/database/panel/openInPanel'
	import { readOpen, recordPath, withOpen } from '$lib/features/database/panel/panelUrl'
	import { storeListUrl } from '$lib/utils/listNavigation'
	import { localizedName } from '$lib/utils/locale'
	import { getRarityLabel } from '$lib/utils/rarity'
	import type { AdminWeaponRow } from '$lib/types/api/admin'

	interface Props {
		/** Toolbar content before the search box (the view tabs) */
		toolbar?: Snippet
	}

	const { toolbar }: Props = $props()

	const seriesQuery = createQuery(() => entityQueries.weaponSeriesList())

	const filters: FilterConfig[] = [
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
			options: () => seriesFilterOptions(seriesQuery.data, m.db_weapons_filter_no_series),
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

	// Column ids are the API sort fields, so the URL reads ?sort=-updated_at
	const columns: DataTableColumn<AdminWeaponRow>[] = [
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
			minWidth: '140px',
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
			id: 'updated_at',
			header: m.db_weapons_col_updated_at,
			type: 'date',
			value: (w) => w.updatedAt,
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

	const url = createTableUrl({
		filters: filterSpecs(filters),
		defaultSort: [
			{ id: 'updated_at', desc: true },
			{ id: 'name', desc: false }
		]
	})

	const source = createServerSource<AdminWeaponRow>({
		url,
		resource: 'weapons',
		columns,
		// Ids, links and the panel title, whichever columns are visible
		fields: ['granblue_id', 'name_en', 'name_jp'],
		facets: facetKeys(filters)
	})

	// --- Record panel ---

	const panelFits = new MediaQuery(PANEL_MIN_QUERY)
	const openId = $derived(readOpen(page.url))

	function rowHref(row: AdminWeaponRow): string {
		return recordPath('weapons', catalogueRowId(row))
	}

	function rowTitle(row: AdminWeaponRow): string {
		return localizedName({ en: row.nameEn ?? '', ja: row.nameJp ?? '' })
	}

	// Rows are links: ⌘/ctrl/shift/middle-click and phones follow them
	function handleRowActivate(row: AdminWeaponRow, event: MouseEvent) {
		// Back from the full page returns to this list, without the panel
		storeListUrl(withOpen(page.url, null).href, 'weapons')
		if (!opensInPanel(event, panelFits.current)) return
		event.preventDefault()
		void openInPanel(page.url, catalogueRowId(row), page.state)
	}
</script>

{#snippet uncapCell(row: AdminWeaponRow)}
	<WeaponUncapCell
		row={{
			id: row.id,
			uncap: { flb: !!row.flb, ulb: !!row.ulb, transcendence: !!row.transcendence }
		}}
	/>
{/snippet}

<div class="list-layout">
	<div class="list">
		<DataTable
			{columns}
			{source}
			{filters}
			rowId={catalogueRowId}
			{rowHref}
			{rowTitle}
			onRowActivate={handleRowActivate}
			selectedId={openId}
			storageKey="weapons"
			rowHeight="image"
			pinFirstColumn
			label={m.db_weapons_label()}
			emptyMessage={m.db_weapons_empty()}
			{toolbar}
		/>
	</div>

	<RecordPanel resource="weapons" />
</div>

<style lang="scss">
	.list-layout {
		display: flex;
		align-items: flex-start;
		width: 100%;
	}

	.list {
		flex: 1;
		min-width: 0;
	}
</style>
