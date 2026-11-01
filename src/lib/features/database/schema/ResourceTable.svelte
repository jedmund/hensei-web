<!--
  A registered resource's list, generated from its definition: DataTable over
  the editor admin API, with filters and the record side panel. It provides
  the ResultSet the panel steps through with j/k.
-->
<script lang="ts">
	import { untrack, type Snippet } from 'svelte'
	import { MediaQuery } from 'svelte/reactivity'
	import { page } from '$app/state'
	import { createQuery } from '@tanstack/svelte-query'
	import DataTable from '$lib/components/data-table/DataTable.svelte'
	import { createTableUrl } from '$lib/components/data-table/tableUrl.svelte'
	import { createServerSource } from '$lib/components/data-table/serverSource.svelte'
	import { catalogueRowId } from '$lib/components/data-table/resultSync'
	import { facetKeys, filterSpecs } from '$lib/components/data-table/filters'
	import RecordPanel from '$lib/features/database/panel/RecordPanel.svelte'
	import {
		openInPanel,
		opensInPanel,
		PANEL_MIN_QUERY
	} from '$lib/features/database/panel/openInPanel'
	import { readOpen, recordPath, withOpen } from '$lib/features/database/panel/panelUrl'
	import { ResultSet, setResultSet } from '$lib/features/database/resultSet.svelte'
	import { storeListUrl } from '$lib/utils/listNavigation'
	import { columnsFor, elementFor, filterQueries, filtersFor, titleFor } from './columns'
	import type { ResourceName } from './names'
	import { RESOURCES } from './registry'

	// Rows are the resource's admin list rows; catalogue rows carry a granblueId
	type Row = { granblueId: string }

	interface Props {
		resource: ResourceName
		/** Extra toolbar controls after the built-in ones (e.g. a list screen's actions menu) */
		toolbarEnd?: Snippet
	}

	const props: Props = $props()

	// The table is built once; a different resource is a different screen
	const name = untrack(() => props.resource)
	const def = RESOURCES[name]
	const list = def.list

	setResultSet(new ResultSet())

	const filterData = Object.fromEntries(
		filterQueries(def).map(([key, options]) => {
			const query = createQuery(options)
			return [key, () => query.data]
		})
	)
	const filters = filtersFor(def, filterData)
	const columns = columnsFor(def)
	const rowTitle = titleFor(def)
	const rowId: (row: Row) => string = list.rowId ?? catalogueRowId
	const rowElement = elementFor(def)

	const url = createTableUrl({ filters: filterSpecs(filters), defaultSort: list.defaultSort })

	const source = createServerSource<Row>({
		url,
		resource: name,
		columns,
		// The element colours the open row whichever columns are visible
		fields: list.element ? [...list.baseFields, list.element] : list.baseFields,
		facets: facetKeys(filters)
	})

	// --- Record panel ---

	const panelFits = new MediaQuery(PANEL_MIN_QUERY)
	const openId = $derived(readOpen(page.url))

	function rowHref(row: Row): string {
		return recordPath(name, rowId(row))
	}

	// Rows are links: ⌘/ctrl/shift/middle-click and phones follow them
	function handleRowActivate(row: Row, event: MouseEvent) {
		// Back from the full page returns to this list, without the panel
		storeListUrl(withOpen(page.url, null).href, name)
		if (!opensInPanel(event, panelFits.current)) return
		event.preventDefault()
		void openInPanel(page.url, rowId(row), page.state)
	}
</script>

<div class="list-layout">
	<div class="list">
		<DataTable
			{columns}
			{source}
			{filters}
			{rowId}
			{rowHref}
			{rowTitle}
			{rowElement}
			onRowActivate={handleRowActivate}
			selectedId={openId}
			storageKey={name}
			rowHeight={list.rowHeight}
			pinFirstColumn={list.pinFirstColumn}
			label={list.label()}
			searchEntity={list.entity()}
			emptyMessage={list.empty()}
			toolbarEnd={props.toolbarEnd}
		/>
	</div>

	<RecordPanel resource={name} />
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
