<!--
  DataTable: one table for the database section.

  - Rows are real links: the primary cell holds an <a> whose ::after covers
    the row (stretched link), so ⌘/middle-click, hover previews and keyboard
    focus behave like links. Interactive elements in other cells sit above it.
  - Rows come already searched/filtered/sorted/paged from a source (static or
    server); TanStack Table runs in manual mode and owns the column model,
    visibility and sort interaction. Sort/search/page live in the URL.
  - Long static lists are virtualised with spacer rows, keeping a real <table>.
-->
<script lang="ts" generics="T extends object">
	import { onMount, tick, untrack, type Snippet } from 'svelte'
	import { get } from 'svelte/store'
	import {
		columnVisibilityFeature,
		createTable,
		rowSortingFeature,
		tableFeatures,
		type ColumnDef,
		type SortingState,
		type Updater,
		type ColumnVisibilityState as VisibilityState
	} from '@tanstack/svelte-table'
	import { createVirtualizer } from '@tanstack/svelte-virtual'
	import * as m from '$lib/paraglide/messages'
	import { localizeHref } from '$lib/paraglide/runtime'
	import Button from '$lib/components/ui/Button.svelte'
	import EmptyState from '$lib/components/ui/EmptyState.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import { getResultSet, type ResultSet } from '$lib/features/database/resultSet.svelte'
	import DataTableCell from './DataTableCell.svelte'
	import DataTableFilters from './DataTableFilters.svelte'
	import DataTablePagination from './DataTablePagination.svelte'
	import DataTableToolbar from './DataTableToolbar.svelte'
	import {
		canHide,
		defaultVisibility,
		loadColumnVisibility,
		loadRowHeight,
		saveColumnVisibility,
		saveRowHeight
	} from './preferences'
	import { activeFilterCount, type FilterConfig } from './filters'
	import { syncResultSet } from './resultSync'
	import { isSortable } from './staticQuery'
	import {
		ROW_HEIGHTS,
		columnHeader,
		type DataTableColumn,
		type DataTableSource,
		type RowHeight
	} from './types'

	interface Props {
		columns: DataTableColumn<T>[]
		source: DataTableSource<T>
		/** Stable id: TanStack row id and the ResultSet item id (granblueId for catalogue items) */
		rowId: (row: T) => string
		/** Unlocalized full-page URL; localized for the link */
		rowHref: (row: T) => string
		/** Panel title before the record loads */
		rowTitle?: (row: T) => string | null | undefined
		/**
		 * Called on a click of the row link, before navigation. Call
		 * `event.preventDefault()` to handle it yourself (e.g. open the record
		 * panel for plain clicks); leave ⌘/ctrl/shift/middle clicks alone so they
		 * open the link. Middle-click never reaches this (it fires auxclick).
		 */
		onRowActivate?: (row: T, event: MouseEvent) => void
		/** Defaults to the one provided with setResultSet() */
		resultSet?: ResultSet | undefined
		/** Id of the row shown elsewhere (e.g. open in the record panel); marked aria-current */
		selectedId?: string | null | undefined
		/**
		 * Filter controls, shown under the toolbar behind a Filters button. Declare
		 * the same config on the table URL: `createTableUrl({ filters: filterSpecs(config) })`.
		 */
		filters?: FilterConfig[] | undefined
		/** localStorage key for column visibility and row height, e.g. 'weapons' */
		storageKey: string
		rowHeight?: RowHeight
		/** Keep the first visible column in place while scrolling sideways */
		pinFirstColumn?: boolean
		searchable?: boolean
		/** Lowercase plural noun for the search placeholder, e.g. "weapons" */
		searchEntity?: string
		/** Accessible name for the table */
		label: string
		emptyMessage?: string
		/** Static lists longer than this are virtualised */
		virtualizeAfter?: number
		/** Height of the scroll area when virtualising. Shorter lists scroll with the page. */
		maxHeight?: string
		/** Toolbar content after the columns menu, e.g. a "New" button */
		toolbarEnd?: Snippet
	}

	const {
		columns,
		source,
		rowId,
		rowHref,
		rowTitle,
		onRowActivate,
		resultSet: resultSetProp,
		selectedId = null,
		filters,
		storageKey,
		rowHeight: initialRowHeight = 'default',
		pinFirstColumn = false,
		searchable = true,
		searchEntity,
		label,
		emptyMessage,
		virtualizeAfter = 100,
		maxHeight = 'calc(100vh - 240px)',
		toolbarEnd
	}: Props = $props()

	const contextResultSet = getResultSet()
	const resultSet = $derived(resultSetProp ?? contextResultSet)

	// --- Preferences (column visibility, row height) ---------------------------

	let visibility = $state<VisibilityState>(untrack(() => defaultVisibility(columns)))
	let rowHeight = $state<RowHeight>(untrack(() => initialRowHeight))

	onMount(() => {
		visibility = loadColumnVisibility(storageKey, columns)
		rowHeight = loadRowHeight(storageKey, initialRowHeight)
	})

	const hasCustomColumns = $derived(
		columns.some((c) => (visibility[c.id] ?? true) !== !c.defaultHidden)
	)

	function setVisibility(next: VisibilityState) {
		visibility = next
		saveColumnVisibility(storageKey, columns, next)
	}

	function setRowHeight(next: RowHeight) {
		rowHeight = next
		saveRowHeight(storageKey, next)
	}

	// --- Filters ---------------------------------------------------------------

	const filterCount = $derived(filters ? activeFilterCount(source.url.state.filters, filters) : 0)
	// Open when the page loads with filters applied
	let filtersOpen = $state(untrack(() => filterCount > 0))

	// --- TanStack Table (manual mode) ----------------------------------------

	const features = tableFeatures({ rowSortingFeature, columnVisibilityFeature })
	type Features = typeof features

	const columnsById = $derived(new Map(columns.map((c) => [c.id, c])))

	const tableColumns: ColumnDef<Features, T>[] = $derived(
		columns.map((column) => ({
			id: column.id,
			accessorFn: (row: T) => column.value?.(row),
			enableSorting: isSortable(column),
			enableHiding: canHide(column)
		}))
	)

	function resolve<S>(updater: Updater<S>, current: S): S {
		return typeof updater === 'function' ? (updater as (old: S) => S)(current) : updater
	}

	const table = createTable({
		features,
		get columns() {
			return tableColumns
		},
		get data() {
			return source.rows
		},
		getRowId: (row: T) => rowId(row),
		manualSorting: true,
		enableMultiSort: true,
		sortDescFirst: false,
		state: {
			get sorting() {
				return source.url.state.sort
			},
			get columnVisibility() {
				return visibility
			}
		},
		onSortingChange: (updater: Updater<SortingState>) => {
			void source.url.setSort(resolve(updater, source.url.state.sort))
		},
		onColumnVisibilityChange: (updater: Updater<VisibilityState>) => {
			setVisibility(resolve(updater, visibility))
		}
	})

	const visibleColumns = $derived(
		table
			.getVisibleLeafColumns()
			.map((c) => columnsById.get(c.id))
			.filter((c): c is DataTableColumn<T> => !!c)
	)
	const rows = $derived(table.getRowModel().rows)
	const primaryId = $derived(
		(visibleColumns.find((c) => c.primary) ?? visibleColumns[0])?.id ?? null
	)
	const pinnedId = $derived(pinFirstColumn ? (visibleColumns[0]?.id ?? null) : null)
	const sorting = $derived(source.url.state.sort)

	const columnToggles = $derived(
		table.getAllLeafColumns().map((c) => {
			const def = columnsById.get(c.id)
			return {
				id: c.id,
				label: def ? columnHeader(def) : c.id,
				visible: c.getIsVisible(),
				canHide: c.getCanHide()
			}
		})
	)

	function ariaSort(columnId: string): 'ascending' | 'descending' | undefined {
		// aria-sort belongs on one header at a time: the primary sort column
		const first = sorting[0]
		if (!first || first.id !== columnId) return undefined
		return first.desc ? 'descending' : 'ascending'
	}

	// --- States ---------------------------------------------------------------

	const hasQuery = $derived(source.url.state.q !== '' || source.url.activeFilterCount > 0)
	const showSkeleton = $derived(source.isPending && !source.error)
	const showEmpty = $derived(!source.isPending && !source.error && rows.length === 0)
	const skeletonCount = $derived(Math.min(source.paginated ? source.per : 10, 10))

	// --- Virtualisation ---------------------------------------------------------

	let scrollEl = $state<HTMLDivElement>()
	let headHeight = $state(0)
	let scrolledX = $state(false)

	const rowPx = $derived(ROW_HEIGHTS[rowHeight])
	const virtualize = $derived(!source.paginated && rows.length > virtualizeAfter)

	const virtualizer = createVirtualizer<HTMLDivElement, HTMLTableRowElement>({
		count: 0,
		getScrollElement: () => scrollEl ?? null,
		estimateSize: () => ROW_HEIGHTS.default,
		overscan: 10
	})

	// Read through the store unconditionally so the template holds the subscription
	const virtualItems = $derived.by(() => {
		const instance = $virtualizer
		return virtualize ? instance.getVirtualItems() : []
	})
	const totalSize = $derived.by(() => {
		const instance = $virtualizer
		return virtualize ? instance.getTotalSize() : 0
	})

	$effect(() => {
		// The store adapter doesn't track getter options; push changes instead
		const count = virtualize ? rows.length : 0
		const size = rowPx
		const paddingStart = headHeight
		untrack(() => {
			get(virtualizer).setOptions({
				count,
				estimateSize: () => size,
				paddingStart,
				getScrollElement: () => scrollEl ?? null,
				getItemKey: (index) => rows[index]?.id ?? index
			})
			get(virtualizer).measure()
		})
	})

	const renderedRows = $derived(
		virtualize
			? virtualItems.map((item) => rows[item.index]).filter((row) => row !== undefined)
			: rows
	)
	// Keep the open row on screen as it moves (j/k in the panel, or a new page)
	const selectedIndex = $derived(
		selectedId === null ? -1 : rows.findIndex((row) => row.id === selectedId)
	)
	$effect(() => {
		const index = selectedIndex
		if (index === -1) return
		untrack(() => {
			if (virtualize) {
				get(virtualizer).scrollToIndex(index, { align: 'auto' })
				return
			}
			// Optional call: jsdom (component tests) has no scrollIntoView
			void tick().then(() =>
				scrollEl?.querySelector('tbody tr[aria-current]')?.scrollIntoView?.({ block: 'nearest' })
			)
		})
	})

	const topSpacer = $derived(virtualize && virtualItems[0] ? virtualItems[0].start - headHeight : 0)
	const bottomSpacer = $derived(
		virtualize && virtualItems.length > 0 ? totalSize - virtualItems.at(-1)!.end : 0
	)

	// Server sources request only the fields of the visible columns.
	// Declared after onMount so the first report has the saved visibility.
	$effect(() => {
		const ids = visibleColumns.map((c) => c.id)
		untrack(() => source.setVisibleColumns?.(ids))
	})

	// --- ResultSet --------------------------------------------------------------

	$effect(() => {
		if (!resultSet) return
		const snapshot = {
			rows: rows.map((row) => row.original),
			page: source.page,
			totalPages: source.totalPages,
			loadPage: source.loadPage
		}
		untrack(() => syncResultSet(resultSet, snapshot, { rowId, rowHref, rowTitle }))
	})

	// --- Keyboard: ↑/↓ move between row links ---------------------------------

	function handleKeydown(event: KeyboardEvent) {
		if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
		const target = event.target as HTMLElement
		if (!target.classList.contains('row-link')) return
		const row = target.closest('tr')
		const sibling =
			event.key === 'ArrowDown' ? row?.nextElementSibling : row?.previousElementSibling
		const link = sibling?.querySelector<HTMLAnchorElement>('.row-link')
		if (!link) return
		event.preventDefault()
		link.focus()
		link.scrollIntoView({ block: 'nearest' })
	}

	function handleScroll() {
		if (scrollEl) scrolledX = scrollEl.scrollLeft > 0
	}

	// The table lays out at fixed widths so columns don't jump as rows or sort
	// indicators change. Every column but the primary one has a set width (its
	// own, or one for its cell type); the primary column takes what's left.
	const TYPE_WIDTHS: Record<DataTableColumn<T>['type'], string> = {
		text: '140px',
		number: '96px',
		date: '128px',
		boolean: '96px',
		element: '88px',
		proficiency: '104px',
		code: '160px',
		image: '96px',
		name: '220px',
		flags: '200px',
		component: '128px'
	}

	function columnWidth(column: DataTableColumn<T>): string | undefined {
		if (column.id === primaryId) return undefined
		return column.width ?? column.minWidth ?? TYPE_WIDTHS[column.type]
	}

	// Below this the table scrolls sideways instead of squeezing the primary column
	const tableMinWidth = $derived.by(() => {
		let total = 0
		for (const column of visibleColumns) {
			const width =
				column.id === primaryId
					? (column.minWidth ?? TYPE_WIDTHS[column.type])
					: columnWidth(column)
			total += width?.endsWith('px') ? parseFloat(width) : 0
		}
		return `${total}px`
	})
</script>

<div class="data-table" data-row-height={rowHeight} style:--dt-row-height="{rowPx}px">
	<DataTableToolbar
		{searchable}
		{searchEntity}
		search={source.url.state.q}
		onSearch={(q) => source.url.setSearch(q)}
		columns={columnToggles}
		onToggleColumn={(id, visible) => table.getColumn(id)?.toggleVisibility(visible)}
		{hasCustomColumns}
		onResetColumns={() => setVisibility(defaultVisibility(columns))}
		{rowHeight}
		onRowHeight={setRowHeight}
		hasFilters={!!filters}
		{filterCount}
		{filtersOpen}
		onToggleFilters={() => (filtersOpen = !filtersOpen)}
		end={toolbarEnd}
	/>

	{#if filters && filtersOpen}
		<DataTableFilters config={filters} url={source.url} facets={source.facets} />
	{/if}

	{#if source.error}
		<div class="error" role="alert">
			<span>{m.data_table_error()}</span>
			<Button variant="ghost" size="small" onclick={() => source.refetch()}>{m.retry()}</Button>
		</div>
	{/if}

	{#if showEmpty}
		<EmptyState
			icon={hasQuery ? 'search' : undefined}
			message={hasQuery ? m.data_table_no_match() : (emptyMessage ?? m.data_table_empty())}
		>
			{#if hasQuery}
				<Button variant="ghost" size="small" onclick={() => source.url.clearFilters()}>
					{m.data_table_clear_filters()}
				</Button>
			{/if}
		</EmptyState>
	{:else if !source.error || rows.length > 0}
		<div
			class="scroll"
			class:scrolled-x={scrolledX}
			class:fetching={source.isFetching && !source.isPending}
			style:max-height={virtualize ? maxHeight : undefined}
			bind:this={scrollEl}
			onscroll={handleScroll}
		>
			<table aria-label={label} aria-busy={source.isFetching} style:min-width={tableMinWidth}>
				<colgroup>
					{#each visibleColumns as column (column.id)}
						<col style:width={columnWidth(column)} />
					{/each}
				</colgroup>
				<thead bind:clientHeight={headHeight}>
					<tr>
						{#each visibleColumns as column (column.id)}
							{@const tableColumn = table.getColumn(column.id)}
							{@const sortState = tableColumn?.getIsSorted()}
							{@const sortIndex = tableColumn?.getSortIndex() ?? -1}
							<th
								scope="col"
								class="align-{column.align ?? 'start'}"
								class:pinned={column.id === pinnedId}
								aria-sort={ariaSort(column.id)}
							>
								{#if tableColumn?.getCanSort()}
									<button
										type="button"
										class="sort"
										title={m.data_table_sort_by({ column: columnHeader(column) })}
										onclick={tableColumn.getToggleSortingHandler()}
									>
										<span>{columnHeader(column)}</span>
										<span class="sort-icon" class:active={!!sortState} aria-hidden="true">
											<Icon name={sortState === 'desc' ? 'arrow-down' : 'arrow-up'} size={12} />
											{#if sorting.length > 1 && sortIndex >= 0}
												<span class="sort-index">{sortIndex + 1}</span>
											{/if}
										</span>
									</button>
								{:else}
									{columnHeader(column)}
								{/if}
							</th>
						{/each}
					</tr>
				</thead>

				<!-- Arrow keys are delegated from the row links inside, which are focusable -->
				<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
				<tbody onkeydown={handleKeydown}>
					{#if showSkeleton}
						{#each Array.from({ length: skeletonCount }, (_, i) => i) as index (index)}
							<tr class="skeleton" aria-hidden="true">
								{#each visibleColumns as column (column.id)}
									<td class:pinned={column.id === pinnedId}><span class="bone"></span></td>
								{/each}
							</tr>
						{/each}
					{:else}
						{#if topSpacer > 0}
							<tr class="spacer" aria-hidden="true">
								<td colspan={visibleColumns.length} style:height="{topSpacer}px"></td>
							</tr>
						{/if}
						{#each renderedRows as row (row.id)}
							{@const original = row.original}
							<tr aria-current={selectedId !== null && row.id === selectedId ? 'true' : undefined}>
								{#each visibleColumns as column (column.id)}
									<td
										class="align-{column.align ?? 'start'} type-{column.type}"
										class:pinned={column.id === pinnedId}
										class:primary={column.id === primaryId}
									>
										{#if column.id === primaryId}
											<a
												class="row-link"
												href={localizeHref(rowHref(original))}
												onclick={onRowActivate
													? (event) => onRowActivate(original, event)
													: undefined}
											>
												<DataTableCell {column} row={original} />
											</a>
										{:else}
											<DataTableCell {column} row={original} />
										{/if}
									</td>
								{/each}
							</tr>
						{/each}
						{#if bottomSpacer > 0}
							<tr class="spacer" aria-hidden="true">
								<td colspan={visibleColumns.length} style:height="{bottomSpacer}px"></td>
							</tr>
						{/if}
					{/if}
				</tbody>
			</table>
			{#if showSkeleton}
				<span class="visually-hidden" role="status">{m.data_table_loading()}</span>
			{/if}
		</div>
	{/if}

	{#if !showEmpty && !showSkeleton && !(source.error && rows.length === 0)}
		<DataTablePagination
			page={source.page}
			totalPages={source.totalPages}
			total={source.total}
			per={source.per}
			count={rows.length}
			paginated={source.paginated}
			onPageChange={(page) => source.url.setPage(page)}
		/>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/database' as database;
	@use '$src/themes/effects' as effects;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.data-table {
		background: var(--card-bg);
		border: 0.5px solid var(--border-subtle);
		border-radius: layout.$page-corner;
		box-shadow: effects.$page-elevation;
		overflow: hidden;

		// Tall rows have room to separate the name lines
		&[data-row-height='image'] {
			--dt-name-gap: #{spacing.$unit-fourth};
		}
	}

	.error {
		@include database.error-banner;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: spacing.$unit;
	}

	.scroll {
		overflow: auto;
		position: relative;
		transition: opacity effects.$duration-quick;

		&.fetching {
			opacity: 0.7;
		}
	}

	table {
		width: 100%;
		table-layout: fixed;
		border-collapse: separate;
		border-spacing: 0;
	}

	th,
	td {
		padding: 0 spacing.$unit-2x;
		text-align: left;
		color: var(--text-primary);
		white-space: nowrap;
		vertical-align: middle;

		&.align-center {
			text-align: center;
		}

		&.align-end {
			text-align: right;
		}
	}

	th {
		position: sticky;
		top: 0;
		z-index: 4;
		height: calc(spacing.$unit * 5);
		background: var(--bar-bg);
		font-weight: typography.$bold;
		font-size: typography.$font-small;
		color: var(--text-secondary);
		border-bottom: 1px solid var(--border-medium);
	}

	.sort {
		display: inline-flex;
		align-items: center;
		gap: spacing.$unit-half;
		padding: 0;
		border: none;
		background: none;
		font: inherit;
		color: inherit;
		cursor: pointer;
		border-radius: layout.$item-corner-small;

		&:hover {
			color: var(--text-primary);
		}

		&:focus-visible {
			outline: 2px solid var(--accent-blue);
			outline-offset: 2px;
		}
	}

	.sort-icon {
		display: inline-flex;
		align-items: center;
		opacity: 0;

		&.active {
			opacity: 1;
		}
	}

	.sort:hover .sort-icon:not(.active) {
		opacity: 0.4;
	}

	.sort-index {
		font-size: typography.$font-tiny;
	}

	tbody tr {
		// Containing block for the stretched row link
		position: relative;
	}

	td {
		height: var(--dt-row-height);
		max-height: var(--dt-row-height);
		border-bottom: 1px solid var(--border-subtle);
		overflow: hidden;
		text-overflow: ellipsis;
		background: var(--card-bg);
	}

	tbody tr:not(.skeleton, .spacer):hover td {
		background: var(--table-row-hover);
	}

	// Scrolled into view clear of the fixed top nav
	tbody tr {
		scroll-margin-top: calc(
			#{layout.$nav-height} + var(--bahamut-offset, 0px) + #{spacing.$unit-2x}
		);
		scroll-margin-bottom: spacing.$unit-2x;
	}

	// The row open elsewhere (e.g. in the record panel)
	tbody tr[aria-current] td {
		background: var(--table-row-hover);
	}

	tbody tr[aria-current] td:first-child {
		box-shadow: inset 3px 0 0 var(--database-accent, var(--text-primary));
	}

	tbody tr:has(.row-link:focus-visible) {
		outline: 2px solid var(--accent-blue);
		outline-offset: -2px;
	}

	.row-link {
		display: block;
		color: inherit;
		text-decoration: none;
		outline: none;

		&::after {
			content: '';
			position: absolute;
			inset: 0;
			z-index: 1;
		}
	}

	// Controls in other cells stay clickable above the row link
	td:not(.primary) :global(:is(a, button, input, select, textarea, label, summary, [tabindex])) {
		position: relative;
		z-index: 2;
	}

	.pinned {
		position: sticky;
		left: 0;
		z-index: 3;
		transition: box-shadow effects.$duration-quick;
	}

	th.pinned {
		z-index: 5;
	}

	// A pinned non-primary cell lets clicks fall through to the row link
	td.pinned:not(.primary) {
		pointer-events: none;

		:global(:is(a, button, input, select, textarea, label, summary, [tabindex])) {
			pointer-events: auto;
		}
	}

	.scrolled-x .pinned {
		box-shadow: 4px 0 6px -4px rgba(0, 0, 0, 0.2);
	}

	.spacer td {
		padding: 0;
		border: none;
		max-height: none;
	}

	.skeleton .bone {
		display: block;
		height: 0.8em;
		width: 70%;
		border-radius: layout.$item-corner-small;
		background: var(--bar-bg);
		animation: pulse 1.2s ease-in-out infinite;
	}

	@keyframes pulse {
		50% {
			opacity: 0.5;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.skeleton .bone {
			animation: none;
		}

		.scroll {
			transition: none;
		}
	}

	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
	}
</style>
