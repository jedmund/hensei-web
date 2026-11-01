<!--
  The main weapons list: DataTable over the editor admin API, with filters
  and the record side panel. Mount it inside a component that provides a
  ResultSet (setResultSet) so the panel steps through these rows.
-->
<script lang="ts">
	import { MediaQuery } from 'svelte/reactivity'
	import { page } from '$app/state'
	import { createQuery } from '@tanstack/svelte-query'
	import * as m from '$lib/paraglide/messages'
	import { entityQueries } from '$lib/api/queries/entity.queries'
	import DataTable from '$lib/components/data-table/DataTable.svelte'
	import { createTableUrl } from '$lib/components/data-table/tableUrl.svelte'
	import { createServerSource } from '$lib/components/data-table/serverSource.svelte'
	import { catalogueRowId } from '$lib/components/data-table/resultSync'
	import { facetKeys, filterSpecs } from '$lib/components/data-table/filters'
	import WeaponUncapCell from '$lib/components/database/cells/WeaponUncapCell.svelte'
	import {
		WEAPONS_BASE_FIELDS,
		WEAPONS_DEFAULT_SORT,
		weaponsColumns,
		weaponsFilters
	} from '$lib/features/database/weapons/tableConfig'
	import RecordPanel from '$lib/features/database/panel/RecordPanel.svelte'
	import {
		openInPanel,
		opensInPanel,
		PANEL_MIN_QUERY
	} from '$lib/features/database/panel/openInPanel'
	import { readOpen, recordPath, withOpen } from '$lib/features/database/panel/panelUrl'
	import { storeListUrl } from '$lib/utils/listNavigation'
	import { localizedName } from '$lib/utils/locale'
	import type { AdminWeaponRow } from '$lib/types/api/admin'

	const seriesQuery = createQuery(() => entityQueries.weaponSeriesList())

	const filters = weaponsFilters(() => seriesQuery.data)
	const columns = weaponsColumns(uncapCell)

	const url = createTableUrl({
		filters: filterSpecs(filters),
		defaultSort: WEAPONS_DEFAULT_SORT
	})

	const source = createServerSource<AdminWeaponRow>({
		url,
		resource: 'weapons',
		columns,
		fields: WEAPONS_BASE_FIELDS,
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
			searchEntity={m.collection_entity_weapons()}
			emptyMessage={m.db_weapons_empty()}
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
