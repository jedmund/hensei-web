<script lang="ts">
	import { Grid, HeaderMenu } from 'wx-svelte-grid'
	import type { IColumn } from 'wx-svelte-grid'
	import { DatabaseProvider } from '$lib/providers/DatabaseProvider'
	import CollectionFilters from '$lib/components/collection/CollectionFilters.svelte'
	import { onMount, onDestroy, tick } from 'svelte'
	import { goto } from '$app/navigation'
	import { page } from '$app/stores'
	import { createQuery, queryOptions } from '@tanstack/svelte-query'
	import { entityAdapter } from '$lib/api/adapters/entity.adapter'
	import { storeListUrl } from '$lib/utils/listNavigation'
	import { toast } from 'svelte-sonner'
	import { extractErrorMessage } from '$lib/utils/errors'

	import { DatabaseFilters } from './useDatabaseFilters.svelte'
	import { DatabaseSearch } from './useDatabaseSearch.svelte'
	import DatabaseGridControls from './DatabaseGridControls.svelte'
	import DatabaseGridFooter from './DatabaseGridFooter.svelte'
	import Button from '$lib/components/ui/Button.svelte'

	import type { Snippet } from 'svelte'

	interface Props {
		resource: 'weapons' | 'characters' | 'summons' | 'jobs'
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

	// Derive entity type from resource
	const entityType = $derived(
		resource === 'characters' ? 'character' :
		resource === 'summons' ? 'summon' :
		resource === 'jobs' ? 'job' : 'weapon'
	)

	const supportsCollectionFilters = $derived(resource !== 'jobs')

	// Create provider
	const provider = new DatabaseProvider({ resource, pageSize: initialPageSize })

	// Fetch weapon series list for URL slug mapping (only for weapons)
	const weaponSeriesQuery = createQuery(() =>
		queryOptions({
			queryKey: ['weaponSeries', 'list'] as const,
			queryFn: () => entityAdapter.getWeaponSeriesList(),
			enabled: resource === 'weapons',
			staleTime: 1000 * 60 * 60,
			gcTime: 1000 * 60 * 60 * 24
		})
	)

	// --- Composables ---

	const filters = new DatabaseFilters(
		resource,
		entityType,
		provider,
		() => weaponSeriesQuery.data,
		(pg) => loadData(pg)
	)

	const search = new DatabaseSearch(provider, (pg) => loadData(pg))

	// Watch for search term changes
	$effect(() => {
		search.handleSearch(search.searchTerm)
	})

	// --- Data loading ---

	let data = $state<any[]>([])
	let loading = $state(true)
	let currentPage = $state(1)
	let totalPages = $state(1)
	let total = $state(0)
	let pageSize = $state(initialPageSize)

	// Sort state
	let sortMarks = $state<Record<string, { order: 'asc' | 'desc' }>>({})

	// Computed pagination values
	const startItem = $derived((currentPage - 1) * pageSize + 1)
	const endItem = $derived(Math.min(currentPage * pageSize, total))

	async function loadData(pageNum: number = 1, updateUrlParam: boolean = true, showLoading: boolean = true) {
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

			if (updateUrlParam) {
				const url = filters.buildUrlParams(search.searchTerm, pageNum, $page.url.pathname)
				goto(url, { replaceState: true, noScroll: true, keepFocus: true })
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
	const COLUMNS_STORAGE_KEY = `database-columns-${resource}`
	let hasCustomColumns = $state(false)

	function saveColumnVisibility() {
		if (!api || !isBrowser) return
		const cols = api.getReactiveState()._columns
		const hidden: Record<string, boolean> = {}
		for (const col of cols) {
			if (col.hidden) hidden[col.id] = true
		}
		localStorage.setItem(COLUMNS_STORAGE_KEY, JSON.stringify(hidden))
		hasCustomColumns = checkHasCustomColumns()
	}

	function restoreColumnVisibility() {
		if (!api || !isBrowser) return
		const saved = localStorage.getItem(COLUMNS_STORAGE_KEY)
		if (!saved) return

		try {
			const hidden: Record<string, boolean> = JSON.parse(saved)
			const cols = api.getReactiveState()._columns
			for (const col of cols) {
				const shouldBeHidden = !!hidden[col.id]
				if (col.hidden !== shouldBeHidden) {
					api.exec('hide-column', { id: col.id, mode: shouldBeHidden })
				}
			}
			hasCustomColumns = checkHasCustomColumns()
		} catch {
			// ignore corrupt data
		}
	}

	function checkHasCustomColumns(): boolean {
		if (!isBrowser) return false
		return localStorage.getItem(COLUMNS_STORAGE_KEY) !== null
	}

	function resetColumns() {
		if (!api || !isBrowser) return
		localStorage.removeItem(COLUMNS_STORAGE_KEY)
		const cols = api.getReactiveState()._columns
		for (const col of cols) {
			const originalCol = columns.find((c) => c.id === col.id)
			const shouldBeHidden = originalCol?.hidden ?? false
			if (col.hidden !== shouldBeHidden) {
				api.exec('hide-column', { id: col.id, mode: shouldBeHidden })
			}
		}
		hasCustomColumns = false
	}

	// --- Expand mode ---

	const EXPAND_STORAGE_KEY = `database-expanded-${resource}`
	let expanded = $state(false)

	function toggleExpanded() {
		expanded = !expanded
		if (isBrowser) {
			if (expanded) {
				localStorage.setItem(EXPAND_STORAGE_KEY, 'true')
			} else {
				localStorage.removeItem(EXPAND_STORAGE_KEY)
			}
		}
	}

	$effect(() => {
		if (expanded) {
			document.documentElement.style.setProperty('--main-max-width', '90vw')
		} else {
			document.documentElement.style.removeProperty('--main-max-width')
		}
		return () => {
			document.documentElement.style.removeProperty('--main-max-width')
		}
	})

	// --- Grid init ---

	let api: any
	let gridRef = $state<any>(undefined)
	let gridDataStore: any

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

			let newSortKey: string | null = null
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

		// Row click navigation
		api.on('select-row', (ev: any) => {
			const rowId = ev.id
			if (rowId) {
				const rowData = data.find((item: any) => item.id === rowId)
				if (rowData && rowData.granblueId) {
					storeListUrl($page.url.href, resource)
					const styleSuffix = resource === 'characters' && rowData.styleSwap ? '/style' : ''
					goto(`/database/${resource}/${rowData.granblueId}${styleSuffix}`)
				}
			}
		})
	}

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
		if (resource === 'weapons' && !weaponSeriesQuery.data) return

		const startPage = filters.initializeFromUrl(
			$page.url.searchParams,
			(v) => { search.searchTerm = v },
			(v) => { search.lastSearchTerm = v }
		)

		urlInitialized = true
		loadData(startPage, false)
	}

	onMount(() => {
		expanded = localStorage.getItem(EXPAND_STORAGE_KEY) === 'true'
		restoreColumnVisibility()

		if (resource !== 'weapons') {
			initializeFromUrl()
		}
	})

	$effect(() => {
		if (resource === 'weapons' && weaponSeriesQuery.data && !urlInitialized) {
			initializeFromUrl()
		}
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

<div class="grid">
	<DatabaseGridControls
		hasActiveFilters={filters.hasActiveFilters}
		filterCount={filters.filterCount}
		{hasCustomColumns}
		selectedElement={filters.selectedElement}
		{supportsCollectionFilters}
		{leftActions}
		{headerActions}
		onToggleFilters={() => (filters.showFilters = !filters.showFilters)}
		onResetColumns={resetColumns}
	>
		{#snippet rightActions()}
			<input
				type="text"
				class="search-input"
				placeholder="Search..."
				value={search.searchTerm}
				oninput={(e) => { search.searchTerm = e.currentTarget.value }}
			/>
			<Button
				variant="ghost"
				size="small"
				iconOnly
				icon={expanded ? 'collapse' : 'expand'}
				onclick={toggleExpanded}
			/>
		{/snippet}
	</DatabaseGridControls>

	{#if filters.showFilters && supportsCollectionFilters}
		<div class="filters-row">
			<CollectionFilters
				entityType={resource === 'characters'
					? 'character'
					: resource === 'summons'
						? 'summon'
						: 'weapon'}
				bind:elementFilters={filters.elementFilters}
				bind:rarityFilters={filters.rarityFilters}
				bind:seriesFilters={filters.seriesFilters}
				bind:proficiencyFilters={filters.proficiencyFilters}
				bind:seasonFilters={filters.seasonFilters}
				onFiltersChange={(f) => filters.handleFiltersChange(f)}
				showSort={false}
				showSearch={false}
				contained={false}
			/>
		</div>
	{/if}

	<div class="grid-wrapper" class:loading class:scrolled={isScrolled} bind:this={gridWrapperEl}>
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

<style lang="scss">
	@use '$src/themes/effects' as effects;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use './database-grid.scss';

	.grid {
		width: 100%;
		background: var(--card-bg);
		border: 0.5px solid rgba(0, 0, 0, 0.18);
		border-radius: layout.$page-corner;
		box-shadow: effects.$page-elevation;
		overflow: hidden;

		.filters-row {
			display: flex;
			align-items: center;
			padding: 0 spacing.$unit spacing.$unit spacing.$unit;
			border-bottom: 1px solid var(--border-subtle);
			background: var(--card-bg);

			:global(.filters-container) {
				flex: 1;
				min-width: 0;

				:global([data-select-trigger]) {
					padding-top: 7px;
					padding-bottom: 7px;
				}
			}
		}

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
