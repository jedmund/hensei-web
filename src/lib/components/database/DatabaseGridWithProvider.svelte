<script lang="ts">
	import { Grid, HeaderMenu } from 'wx-svelte-grid'
	import type { IColumn, IRow } from 'wx-svelte-grid'
	import { DatabaseProvider } from '$lib/providers/DatabaseProvider'
	import { onMount, onDestroy, tick, untrack } from 'svelte'
	import { goto } from '$app/navigation'
	import { page } from '$app/stores'
	import { storeListUrl } from '$lib/utils/listNavigation'
	import { toast } from 'svelte-sonner'
	import { extractErrorMessage } from '$lib/utils/errors'
	import { MediaQuery } from 'svelte/reactivity'
	import { getLocale, localizeHref } from '$lib/paraglide/runtime'
	import { ResultSet, setResultSet } from '$lib/features/database/resultSet.svelte'
	import RecordPanel from '$lib/features/database/panel/RecordPanel.svelte'
	import {
		openInPanel,
		opensInPanel,
		PANEL_MIN_QUERY
	} from '$lib/features/database/panel/openInPanel'
	import {
		OPEN_PARAM,
		preserveParams,
		readOpen,
		recordId,
		recordPath,
		withOpen
	} from '$lib/features/database/panel/panelUrl'

	import { DatabaseFilters } from './useDatabaseFilters.svelte'
	import { DatabaseSearch } from './useDatabaseSearch.svelte'
	import DatabaseGridControls from './DatabaseGridControls.svelte'
	import DatabaseGridFooter from './DatabaseGridFooter.svelte'

	import type { Snippet } from 'svelte'

	interface Props {
		resource: 'jobs'
		columns: IColumn[]
		pageSize?: number
		leftActions?: Snippet
		headerActions?: Snippet
	}

	const {
		resource,
		columns,
		pageSize: initialPageSize = 20,
		leftActions,
		headerActions
	}: Props = $props()

	// Create provider
	const provider = $derived(new DatabaseProvider({ resource, pageSize: initialPageSize }))

	// --- Composables ---

	const filters = $derived(new DatabaseFilters(provider))

	const search = $derived(new DatabaseSearch(provider, (pg) => loadData(pg)))

	// Watch for search term changes
	$effect(() => {
		search.handleSearch(search.searchTerm)
	})

	// --- Record panel ---

	// The rows in display order, for the record panel's j/k (GBF-140)
	const resultSet = setResultSet(new ResultSet())
	resultSet.loadPage = (pg) => loadData(pg)
	const panelFits = new MediaQuery(PANEL_MIN_QUERY)

	function rowRecordId(row: IRow): string {
		return recordId(String(row.granblueId))
	}

	function rowTitle(row: IRow): string | undefined {
		if (typeof row.displayName === 'string') return row.displayName
		if (typeof row.name === 'string') return row.name
		// Search results carry a localized name object ({ en, ja })
		const name = row.name as { en?: string; ja?: string } | undefined
		if (name && typeof name === 'object') {
			return (getLocale() === 'ja' ? (name.ja ?? name.en) : (name.en ?? name.ja)) || undefined
		}
		return undefined
	}

	// Called synchronously at the end of each load, so ResultSet.next()/prev()
	// see the new page as soon as loadPage resolves
	function syncResultSet() {
		resultSet.items = data
			.filter((row) => row.granblueId)
			.map((row) => {
				const id = rowRecordId(row)
				return { id, href: recordPath(resource, id), title: rowTitle(row) }
			})
		resultSet.page = currentPage
		resultSet.totalPages = totalPages
	}

	// --- Data loading ---

	let data = $state<IRow[]>([])
	let loading = $state(true)
	let currentPage = $state(1)
	let totalPages = $state(1)
	let total = $state(0)
	let pageSize = $state(untrack(() => initialPageSize))

	// Sort state
	let sortMarks = $state<Record<string, { order: 'asc' | 'desc' }>>({})

	// Computed pagination values
	const startItem = $derived((currentPage - 1) * pageSize + 1)
	const endItem = $derived(Math.min(currentPage * pageSize, total))

	async function loadData(
		pageNum: number = 1,
		updateUrlParam: boolean = true,
		showLoading: boolean = true
	) {
		if (showLoading) loading = true
		try {
			const result = await provider.loadPage(pageNum)
			data = result
			currentPage = pageNum

			const meta = provider.getPaginationMeta()
			if (meta) {
				total = meta.total || 0
				totalPages = meta.totalPages || 1
				if (meta.pageSize && meta.pageSize !== pageSize) {
					pageSize = meta.pageSize
				}
			}
			syncResultSet()

			if (updateUrlParam) {
				// Keep the open record (?open=) across list URL rebuilds
				const url = preserveParams(
					filters.buildUrlParams(search.searchTerm, pageNum, $page.url.pathname),
					$page.url,
					[OPEN_PARAM]
				)
				await goto(url, {
					replaceState: true,
					noScroll: true,
					keepFocus: true,
					state: $page.state
				})
			}
		} catch (error) {
			console.error('Failed to load data:', error)
			toast.error(extractErrorMessage(error, 'Failed to load data'))
		} finally {
			loading = false

			if (gridDataStore && Object.keys(sortMarks).length > 0) {
				await tick()
				gridDataStore.setState({ sortMarks })
			}
		}
	}

	// --- Column visibility persistence ---

	const isBrowser = typeof window !== 'undefined'
	const COLUMNS_STORAGE_KEY = $derived(`database-columns-${resource}`)
	let hasCustomColumns = $state(false)
	let restoringColumns = false

	function saveColumnVisibility() {
		if (!api || !isBrowser || restoringColumns) return
		const cols = api.getState()._columns
		const visibility: Record<string, boolean> = {}
		for (const col of cols) {
			visibility[col.id] = !col.hidden
		}
		localStorage.setItem(COLUMNS_STORAGE_KEY, JSON.stringify(visibility))
		hasCustomColumns = checkHasCustomColumns()
	}

	function restoreColumnVisibility() {
		if (!api || !isBrowser) return
		const saved = localStorage.getItem(COLUMNS_STORAGE_KEY)
		if (!saved) return

		try {
			const visibility: Record<string, boolean> = JSON.parse(saved)

			// Migrate old format: old saves only stored hidden columns (all true values)
			// New format stores all columns with true=visible, false=hidden
			if (!Object.values(visibility).includes(false)) {
				localStorage.removeItem(COLUMNS_STORAGE_KEY)
				return
			}

			const cols = api.getState()._columns
			restoringColumns = true
			for (const col of cols) {
				if (!(col.id in visibility)) continue
				const shouldBeVisible = visibility[col.id]
				if (col.hidden === shouldBeVisible) {
					api.exec('hide-column', { id: col.id, mode: !shouldBeVisible })
				}
			}
			restoringColumns = false
			hasCustomColumns = checkHasCustomColumns()
		} catch {
			restoringColumns = false
		}
	}

	function checkHasCustomColumns(): boolean {
		if (!isBrowser) return false
		return localStorage.getItem(COLUMNS_STORAGE_KEY) !== null
	}

	function resetColumns() {
		if (!api || !isBrowser) return
		restoringColumns = true
		const cols = api.getState()._columns
		for (const col of cols) {
			const originalCol = columns.find((c) => c.id === col.id)
			const shouldBeHidden = originalCol?.hidden ?? false
			if (col.hidden !== shouldBeHidden) {
				api.exec('hide-column', { id: col.id, mode: shouldBeHidden })
			}
		}
		restoringColumns = false
		localStorage.removeItem(COLUMNS_STORAGE_KEY)
		hasCustomColumns = false
	}

	// --- Grid init ---

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- wx-svelte-grid API doesn't export typed interfaces
	let api: any
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- wx-svelte-grid grid ref type
	let gridRef = $state<any>(undefined)
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- wx-svelte-grid data store type
	let gridDataStore: any

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- wx-svelte-grid API ref type
	const init = (apiRef: any) => {
		api = apiRef
		api.setNext(provider)

		const { data: dataStore } = api.getStores()
		gridDataStore = dataStore

		// Persist column visibility on toggle
		api.on('hide-column', () => {
			saveColumnVisibility()
		})

		// Intercept sort to do server-side sorting
		api.intercept('sort-rows', (ev: { key: string; add: boolean }) => {
			const { key } = ev
			const currentOrder = sortMarks[key]?.order

			let newSortKey: string | null
			let newSortOrder: 'asc' | 'desc' = 'asc'

			if (currentOrder === 'asc') {
				sortMarks = { [key]: { order: 'desc' } }
				newSortKey = key
				newSortOrder = 'desc'
			} else if (currentOrder === 'desc') {
				sortMarks = {}
				newSortKey = null
			} else {
				sortMarks = { [key]: { order: 'asc' } }
				newSortKey = key
				newSortOrder = 'asc'
			}

			dataStore.setState({ sortMarks })
			provider.setSort(newSortKey, newSortOrder)
			loadData(1, true, false)

			return false
		})

		// Row clicks are handled on the wrapper (handleRowClick): select-row
		// carries no modifier keys and doesn't fire for an already-selected row
	}

	// --- Row clicks ---

	function rowFromEvent(event: MouseEvent): IRow | undefined {
		const target = event.target as Element | null
		if (!target || typeof target.closest !== 'function') return undefined
		// Controls inside cells keep their own behaviour
		if (target.closest('a, button, input, select, textarea, label')) return undefined
		const rowEl = target.closest('.wx-row[data-id]')
		if (!rowEl) return undefined
		// wx-svelte-grid prefixes string ids with ":"
		const raw = rowEl.getAttribute('data-id') ?? ''
		const id = raw.startsWith(':') ? raw.slice(1) : raw
		return data.find((row) => String(row.id) === id)
	}

	function handleRowClick(event: MouseEvent) {
		const row = rowFromEvent(event)
		if (!row?.granblueId) return

		const id = rowRecordId(row)
		const href = localizeHref(recordPath(resource, id))
		// The full page's Back returns to the list, without the panel
		storeListUrl(withOpen($page.url, null).href, resource)

		if (opensInPanel(event, panelFits.current)) {
			openInPanel($page.url, id, $page.state)
		} else if (opensInPanel(event, true)) {
			// Plain click on a phone: the full page
			goto(href)
		} else {
			// ⌘/Ctrl/Shift-click and middle-click: a new tab
			event.preventDefault()
			window.open(href, '_blank', 'noopener')
		}
	}

	// Highlight the open record's row as j/k step through the results
	$effect(() => {
		const openId = readOpen($page.url)
		if (!api || !openId) return
		const row = data.find((r) => r.granblueId && rowRecordId(r) === openId)
		if (!row) return
		// After the grid has taken the new rows
		tick().then(() => {
			try {
				api.exec('select-row', { id: row.id })
			} catch {
				// Highlight only
			}
		})
	})

	// --- Pagination ---

	const handlePrevPage = () => {
		if (currentPage > 1) loadData(currentPage - 1)
	}

	const handleNextPage = () => {
		if (currentPage < totalPages) loadData(currentPage + 1)
	}

	// --- URL initialization ---

	let urlInitialized = $state(false)

	function initializeFromUrl() {
		if (urlInitialized) return

		const startPage = filters.initializeFromUrl(
			$page.url.searchParams,
			(v) => {
				search.searchTerm = v
			},
			(v) => {
				search.lastSearchTerm = v
			}
		)

		urlInitialized = true
		loadData(startPage, false)
	}

	onMount(() => {
		restoreColumnVisibility()
		initializeFromUrl()
	})

	// --- Scroll tracking for pinned column shadow ---

	let gridWrapperEl = $state<HTMLDivElement | undefined>(undefined)
	let isScrolled = $state(false)
	let scrollContainer: Element | null = null

	function onGridScroll() {
		isScrolled = scrollContainer ? scrollContainer.scrollLeft > 0 : false
	}

	$effect(() => {
		if (gridWrapperEl && !scrollContainer) {
			scrollContainer = gridWrapperEl.querySelector('.wx-scroll')
			if (scrollContainer) {
				scrollContainer.addEventListener('scroll', onGridScroll, { passive: true })
			}
		}
		return () => {
			if (scrollContainer) {
				scrollContainer.removeEventListener('scroll', onGridScroll)
				scrollContainer = null
			}
		}
	})

	onDestroy(() => {
		search.cleanup()
	})
</script>

<svelte:head>
	<link rel="stylesheet" href="https://cdn.svar.dev/fonts/wxi/wx-icons.css" />
</svelte:head>

<div class="list-layout">
	<div class="grid">
		<DatabaseGridControls
			{hasCustomColumns}
			{leftActions}
			{headerActions}
			onResetColumns={resetColumns}
		>
			{#snippet rightActions()}
				<input
					type="text"
					class="search-input"
					placeholder="Search..."
					value={search.searchTerm}
					oninput={(e) => {
						search.searchTerm = e.currentTarget.value
					}}
				/>
			{/snippet}
		</DatabaseGridControls>

		<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions (rows are reachable from the grid's own keyboard navigation) -->
		<div
			class="grid-wrapper"
			class:loading
			class:scrolled={isScrolled}
			bind:this={gridWrapperEl}
			onclick={handleRowClick}
			onauxclick={(e) => e.button === 1 && handleRowClick(e)}
		>
			{#if loading}
				<div class="loading-overlay">
					<div class="loading-spinner">Loading...</div>
				</div>
			{/if}

			<HeaderMenu api={gridRef}>
				<Grid
					bind:this={gridRef}
					{data}
					{columns}
					{init}
					sizes={{ rowHeight: 80 }}
					split={{ left: 2 }}
					class="database-grid-theme"
				/>
			</HeaderMenu>
		</div>

		<DatabaseGridFooter
			{currentPage}
			{totalPages}
			{total}
			{startItem}
			{endItem}
			onPrevPage={handlePrevPage}
			onNextPage={handleNextPage}
		/>
	</div>

	<RecordPanel {resource} />
</div>

<style lang="scss">
	@use '$src/themes/effects' as effects;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use './database-grid.scss';

	.list-layout {
		display: flex;
		align-items: flex-start;
		width: 100%;
	}

	.grid {
		flex: 1;
		min-width: 0;
		background: var(--card-bg);
		border: 0.5px solid rgba(0, 0, 0, 0.18);
		border-radius: layout.$page-corner;
		box-shadow: effects.$page-elevation;
		overflow: hidden;

		.grid-wrapper {
			position: relative;
			overflow-x: auto;
			min-height: 400px;

			&.loading {
				opacity: 0.6;
			}

			.loading-overlay {
				position: absolute;
				top: 0;
				left: 0;
				right: 0;
				bottom: 0;
				background: color-mix(in srgb, var(--card-bg) 90%, transparent);
				display: flex;
				align-items: center;
				justify-content: center;
				z-index: effects.$z-sticky;

				.loading-spinner {
					font-size: typography.$font-medium;
					color: var(--text-tertiary);
				}
			}
		}
	}

	.search-input {
		padding: spacing.$unit spacing.$unit-2x;
		border: 1px solid var(--border-subtle);
		border-radius: layout.$card-corner;
		background: var(--input-bg, var(--card-bg));
		color: var(--text-primary);
		font-size: typography.$font-small;
		outline: none;
		width: 200px;

		&:focus {
			border-color: var(--accent-color);
		}

		&::placeholder {
			color: var(--text-tertiary);
		}
	}

	// Scroll-dependent pinned column shadow (needs scoped .grid-wrapper class)
	.grid-wrapper:not(.scrolled) {
		:global(.wx-grid .wx-cell.wx-shadow) {
			box-shadow: none;
			border-right-color: transparent !important;
		}
	}

	.grid-wrapper.scrolled {
		:global(.wx-grid .wx-cell.wx-shadow) {
			box-shadow: 4px 0 8px -2px rgba(0, 0, 0, 0.08);
		}
	}
</style>
