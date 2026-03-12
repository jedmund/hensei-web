<!--
  DatabaseGridWithProvider component using SVAR DataGrid with RestDataProvider
  Provides client-side pagination and data management with REST API integration
-->

<script lang="ts">
	import { Grid } from 'wx-svelte-grid'
	import type { IColumn, IRow } from 'wx-svelte-grid'
	import { DatabaseProvider } from '$lib/providers/DatabaseProvider'
	import CollectionFilters from '$lib/components/collection/CollectionFilters.svelte'
	import type { CollectionFilterState } from '$lib/components/collection/CollectionFilters.svelte'
	import { onMount, onDestroy } from 'svelte'
	import { goto } from '$app/navigation'
	import { page } from '$app/stores'
	import { createQuery, queryOptions } from '@tanstack/svelte-query'
	import { entityAdapter } from '$lib/api/adapters/entity.adapter'
	import {
		parseFiltersFromUrl,
		buildUrlFromFilters,
		type ParsedFilters,
		ELEMENT_TO_PARAM
	} from '$lib/utils/filterParams'
	import Button from '$lib/components/ui/Button.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import { storeListUrl } from '$lib/utils/listNavigation'
	import { toast } from 'svelte-sonner'
	import { extractErrorMessage } from '$lib/utils/errors'

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

	// Jobs don't use the standard CollectionFilters component
	const supportsCollectionFilters = $derived(resource !== 'jobs')

	// Fetch weapon series list for URL slug mapping (only for weapons)
	const weaponSeriesQuery = createQuery(() =>
		queryOptions({
			queryKey: ['weaponSeries', 'list'] as const,
			queryFn: () => entityAdapter.getWeaponSeriesList(),
			enabled: resource === 'weapons',
			staleTime: 1000 * 60 * 60, // 1 hour
			gcTime: 1000 * 60 * 60 * 24 // 24 hours
		})
	)

	// State
	let data = $state<any[]>([])
	let loading = $state(true)
	let currentPage = $state(1)
	let totalPages = $state(1)
	let total = $state(0)
	let searchTerm = $state('')
	let lastSearchTerm = $state('')
	let pageSize = $state(initialPageSize)
	let searchTimeout: ReturnType<typeof setTimeout> | undefined

	// Sort state - tracks which column is sorted and in which direction
	let sortMarks = $state<Record<string, { order: 'asc' | 'desc' }>>({})

	// Filter state
	let elementFilters = $state<number[]>([])
	let rarityFilters = $state<number[]>([])
	let seriesFilters = $state<(number | string)[]>([])
	let proficiencyFilters = $state<number[]>([])
	let seasonFilters = $state<number[]>([])

	// Filter visibility state
	let showFilters = $state(false)

	// Check if any filters are active (for button indicator)
	const hasActiveFilters = $derived(
		elementFilters.length > 0 ||
			rarityFilters.length > 0 ||
			seriesFilters.length > 0 ||
			proficiencyFilters.length > 0 ||
			seasonFilters.length > 0
	)

	// Get selected element name for button styling (only when exactly one element is selected)
	const selectedElement = $derived.by(() => {
		if (elementFilters.length === 1) {
			const elemId = elementFilters[0]
			if (elemId !== undefined) {
				const elemName = ELEMENT_TO_PARAM[elemId]
				if (elemName && elemName !== 'null') {
					return elemName as 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'
				}
			}
		}
		return undefined
	})

	// Handle filter changes from CollectionFilters component
	function handleFiltersChange(filters: CollectionFilterState) {
		// Convert series to string[] (weapon series are UUIDs, character series are numbers that need conversion)
		const seriesAsStrings =
			filters.series.length > 0 ? filters.series.map((s) => String(s)) : undefined

		provider.setFilters({
			element: filters.element.length > 0 ? filters.element : undefined,
			rarity: filters.rarity.length > 0 ? filters.rarity : undefined,
			series: seriesAsStrings,
			proficiency1: filters.proficiency.length > 0 ? filters.proficiency : undefined,
			season: filters.season.length > 0 ? filters.season : undefined,
			// For characters, also pass series as characterSeries (they use number enum values)
			characterSeries:
				resource === 'characters' && filters.series.length > 0
					? filters.series.filter((s): s is number => typeof s === 'number')
					: undefined
		})
		loadData(1) // Reset to first page when filters change (this will update URL)
	}

	// Create provider
	const provider = new DatabaseProvider({ resource, pageSize: initialPageSize })

	// Grid API reference
	let api: any

	// Build current filter state for URL building
	function getCurrentFilterState(): CollectionFilterState {
		return {
			element: elementFilters,
			rarity: rarityFilters,
			proficiency: proficiencyFilters,
			season: seasonFilters,
			series: seriesFilters,
			race: [],
			gender: []
		}
	}

	// Update URL with current filters, search, and page (without triggering navigation)
	function updateUrl(pageNum: number) {
		const params = buildUrlFromFilters(
			getCurrentFilterState(),
			searchTerm,
			pageNum,
			entityType,
			weaponSeriesQuery.data
		)
		const search = params.toString()
		const url = search ? `${$page.url.pathname}?${search}` : $page.url.pathname
		// Use replaceState to update URL without adding history entry
		goto(url, { replaceState: true, noScroll: true, keepFocus: true })
	}

	// Load data
	async function loadData(pageNum: number = 1, updateUrlParam: boolean = true) {
		loading = true
		try {
			const result = await provider.loadPage(pageNum)
			data = result
			currentPage = pageNum

			// Get pagination metadata from provider
			const meta = provider.getPaginationMeta()
			if (meta) {
				total = meta.total || 0
				totalPages = meta.totalPages || 1
				// Update pageSize if provider has a different value
				if (meta.pageSize && meta.pageSize !== pageSize) {
					pageSize = meta.pageSize
				}
			}

			// Update URL to reflect current page
			if (updateUrlParam) {
				updateUrl(pageNum)
			}
		} catch (error) {
			console.error('Failed to load data:', error)
			toast.error(extractErrorMessage(error, 'Failed to load data'))
		} finally {
			loading = false
		}
	}

	// Initialize grid
	const init = (apiRef: any) => {
		api = apiRef
		// Connect provider to grid
		api.setNext(provider)

		// Intercept sort-rows to prevent client-side sorting and do server-side instead
		api.intercept('sort-rows', (ev: { key: string; add: boolean }) => {
			const { key } = ev
			const currentOrder = sortMarks[key]?.order

			// Toggle: asc -> desc -> clear
			let newSortKey: string | null = null
			let newSortOrder: 'asc' | 'desc' = 'asc'

			if (currentOrder === 'asc') {
				sortMarks = { [key]: { order: 'desc' } }
				newSortKey = key
				newSortOrder = 'desc'
			} else if (currentOrder === 'desc') {
				sortMarks = {} // Clear sort
				newSortKey = null
			} else {
				sortMarks = { [key]: { order: 'asc' } }
				newSortKey = key
				newSortOrder = 'asc'
			}

			// Update provider and reload from server
			provider.setSort(newSortKey, newSortOrder)
			loadData(1) // Reset to first page when sorting

			return false // Prevent default client-side sorting
		})

		// Add row click handler
		api.on('select-row', (ev: any) => {
			const rowId = ev.id
			if (rowId) {
				// Find the row data to get the granblueId
				const rowData = data.find((item: any) => item.id === rowId)
				if (rowData && rowData.granblueId) {
					// Store current list URL before navigating so Back button can return here
					storeListUrl($page.url.href, resource)
					const styleSuffix = resource === 'characters' && rowData.styleSwap ? '/style' : ''
					goto(`/database/${resource}/${rowData.granblueId}${styleSuffix}`)
				}
			}
		})
	}

	// Handle pagination
	const handlePrevPage = () => {
		if (currentPage > 1) {
			loadData(currentPage - 1)
		}
	}

	const handleNextPage = () => {
		if (currentPage < totalPages) {
			loadData(currentPage + 1)
		}
	}

	const handlePageSizeChange = async (event: Event) => {
		const target = event.target as HTMLSelectElement
		const newPageSize = Number(target.value)
		pageSize = newPageSize // Update local state immediately
		await provider.setPageSize(newPageSize)
		loadData(1)
	}

	// Handle search with debounce
	const handleSearch = (term: string) => {
		// Clear existing timeout
		if (searchTimeout) {
			clearTimeout(searchTimeout)
		}

		const trimmed = term.trim()

		// Avoid triggering a fetch on initial mount when search is empty
		// Only clear search and reload if we previously had a non-empty query
		if (trimmed.length < 2) {
			if (lastSearchTerm !== '') {
				searchTimeout = setTimeout(() => {
					provider.clearSearch()
					lastSearchTerm = ''
					loadData(1)
				}, 300)
			}
			return
		}

		// Debounced search when user has typed enough characters
		searchTimeout = setTimeout(() => {
			lastSearchTerm = trimmed
			provider.setSearchQuery(trimmed)
			loadData(1) // Reset to first page when searching
		}, 300)
	}

	// Watch for search term changes
	$effect(() => {
		handleSearch(searchTerm)
	})

	// Computed values
	const startItem = $derived((currentPage - 1) * pageSize + 1)
	const endItem = $derived(Math.min(currentPage * pageSize, total))

	// Track if we've initialized from URL
	let urlInitialized = $state(false)

	// Initialize filters from URL (for weapons, wait for series list)
	function initializeFromUrl() {
		if (urlInitialized) return
		if (resource === 'weapons' && !weaponSeriesQuery.data) return // Wait for weapon series

		const parsed = parseFiltersFromUrl($page.url.searchParams, entityType, weaponSeriesQuery.data)

		// Set filter state
		elementFilters = parsed.element
		rarityFilters = parsed.rarity
		proficiencyFilters = parsed.proficiency
		seasonFilters = parsed.season
		seriesFilters = parsed.series
		searchTerm = parsed.searchQuery

		// Apply filters to provider
		if (
			parsed.element.length > 0 ||
			parsed.rarity.length > 0 ||
			parsed.proficiency.length > 0 ||
			parsed.season.length > 0 ||
			parsed.series.length > 0
		) {
			const seriesAsStrings =
				parsed.series.length > 0 ? parsed.series.map((s) => String(s)) : undefined

			provider.setFilters({
				element: parsed.element.length > 0 ? parsed.element : undefined,
				rarity: parsed.rarity.length > 0 ? parsed.rarity : undefined,
				series: seriesAsStrings,
				proficiency1: parsed.proficiency.length > 0 ? parsed.proficiency : undefined,
				season: parsed.season.length > 0 ? parsed.season : undefined,
				characterSeries:
					resource === 'characters' && parsed.series.length > 0
						? parsed.series.filter((s): s is number => typeof s === 'number')
						: undefined
			})
		}

		// Apply search query to provider
		if (parsed.searchQuery.length >= 2) {
			provider.setSearchQuery(parsed.searchQuery)
			lastSearchTerm = parsed.searchQuery
		}

		// Show filters panel if any filters are active from URL
		if (
			parsed.element.length > 0 ||
			parsed.rarity.length > 0 ||
			parsed.proficiency.length > 0 ||
			parsed.season.length > 0 ||
			parsed.series.length > 0
		) {
			showFilters = true
		}

		urlInitialized = true
		loadData(parsed.page, false) // Don't update URL on initial load
	}

	// Load initial data from URL params
	onMount(() => {
		// For non-weapon resources, initialize immediately
		// For weapons, wait for series query to complete
		if (resource !== 'weapons') {
			initializeFromUrl()
		}
	})

	// For weapons, initialize once series list is loaded
	$effect(() => {
		if (resource === 'weapons' && weaponSeriesQuery.data && !urlInitialized) {
			initializeFromUrl()
		}
	})

	// Clean up timeout on destroy
	onDestroy(() => {
		if (searchTimeout) {
			clearTimeout(searchTimeout)
		}
	})
</script>

<svelte:head>
	<link rel="stylesheet" href="https://cdn.svar.dev/fonts/wxi/wx-icons.css" />
</svelte:head>

<div class="grid">
	<div class="controls">
		{#if leftActions}
			{@render leftActions()}
		{/if}

		<div class="controls-right">
			{#if headerActions}
				{@render headerActions()}
			{/if}

			{#if supportsCollectionFilters}
				<Button
					variant="ghost"
					size="small"
					onclick={() => (showFilters = !showFilters)}
					class="filter-toggle {hasActiveFilters ? 'has-active' : ''}"
				>
					Filters
					{#if hasActiveFilters}
						<span class="filter-count {selectedElement ?? ''}">
							{elementFilters.length +
								rarityFilters.length +
								seriesFilters.length +
								proficiencyFilters.length +
								seasonFilters.length}
						</span>
					{/if}
				</Button>
			{/if}

			<input type="text" placeholder="Search..." bind:value={searchTerm} />
		</div>
	</div>

	{#if showFilters && supportsCollectionFilters}
		<div class="filters-row">
			<CollectionFilters
				entityType={resource === 'characters'
					? 'character'
					: resource === 'summons'
						? 'summon'
						: 'weapon'}
				bind:elementFilters
				bind:rarityFilters
				bind:seriesFilters
				bind:proficiencyFilters
				bind:seasonFilters
				onFiltersChange={handleFiltersChange}
				showSort={false}
				contained={false}
			/>
		</div>
	{/if}

	<div class="grid-wrapper" class:loading>
		{#if loading}
			<div class="loading-overlay">
				<div class="loading-spinner">Loading...</div>
			</div>
		{/if}

		<Grid
			{data}
			{columns}
			{init}
			{sortMarks}
			sizes={{ rowHeight: 80 }}
			class="database-grid-theme"
		/>
	</div>

	<div class="grid-footer">
		<div class="pagination-info">
			{#if total > 0}
				Showing {startItem} to {endItem} of {total} entries
			{:else}
				No entries found
			{/if}
		</div>

		<div class="pagination-controls">
			<Button variant="ghost" size="small" onclick={handlePrevPage} disabled={currentPage <= 1}>
				Previous
			</Button>

			<span class="page-display">
				Page {currentPage} of {totalPages}
			</span>

			<Button variant="ghost" size="small" onclick={handleNextPage} disabled={currentPage >= totalPages}>
				Next
			</Button>
		</div>
	</div>
</div>

<style lang="scss">
	@use '$src/themes/effects' as effects;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.grid {
		width: 100%;
		background: var(--card-bg);
		border: 0.5px solid rgba(0, 0, 0, 0.18);
		border-radius: layout.$page-corner;
		box-shadow: effects.$page-elevation;
		overflow: hidden;

		.controls {
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			justify-content: space-between;
			padding: spacing.$unit-2x;
			gap: spacing.$unit;

			.controls-right {
				display: flex;
				align-items: center;
				gap: spacing.$unit;
				margin-left: auto;

				:global(.filter-toggle) {
					gap: spacing.$unit-half;

					:global(svg) {
						transition: transform 0.15s ease;
					}

					&:global(.has-active) {
						color: var(--accent-color);
					}
				}

				.filter-count {
					display: inline-flex;
					align-items: center;
					justify-content: center;
					min-width: 18px;
					height: 18px;
					margin-left: spacing.$unit;
					padding: 0 spacing.$unit-half;
					background: var(--accent-color);
					color: white;
					font-size: 11px;
					font-weight: typography.$medium;
					border-radius: 9px;

					// Element-colored badges
					&:global(.wind) {
						background: var(--wind-button-bg);
					}
					&:global(.fire) {
						background: var(--fire-button-bg);
					}
					&:global(.water) {
						background: var(--water-button-bg);
					}
					&:global(.earth) {
						background: var(--earth-button-bg);
					}
					&:global(.dark) {
						background: var(--dark-button-bg);
					}
					&:global(.light) {
						background: var(--light-button-bg);
					}
				}

				input {
					padding: spacing.$unit spacing.$unit-2x;
					background: var(--input-bound-bg);
					border: none;
					border-radius: layout.$item-corner;
					font-family: 'AGrot', system-ui, sans-serif;
					font-size: typography.$font-small;
					width: 200px;

					&:hover {
						background: var(--input-bound-bg-hover);
					}

					&:focus {
						outline: none;
						border-color: var(--accent-blue);
					}
				}
			}
		}

		.filters-row {
			display: flex;
			align-items: center;
			padding: 0 spacing.$unit spacing.$unit spacing.$unit;
			border-bottom: 1px solid var(--border-subtle);
			background: var(--card-bg);

			:global(.filters-container) {
				flex: 1;
				min-width: 0;

				// Override filter trigger padding
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

		.grid-footer {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: spacing.$unit-2x;
			border-top: 1px solid var(--border-subtle);
			background: var(--bar-bg);

			.pagination-info {
				font-size: typography.$font-small;
				color: var(--text-secondary);
			}

			.pagination-controls {
				display: flex;
				align-items: center;
				gap: spacing.$unit;

				.page-display {
					font-size: typography.$font-small;
					color: var(--text-primary);
					min-width: 100px;
					text-align: center;
				}
			}
		}
	}

	// Global styles for SVAR Grid elements
	:global(.database-grid-theme) {
		font-size: typography.$font-small;
		width: 100%;
	}

	:global(.database-grid .wx-table-box) {
		width: 100%;
		max-width: 100%;
	}

	:global(.wx-grid .wx-header) {
		background: var(--bar-bg);
	}

	:global(.wx-grid .wx-h-row) {
		background: var(--bar-bg);
		border-bottom: 1px solid var(--border-subtle);
	}

	:global(.wx-grid .wx-header-cell) {
		background: var(--bar-bg);
		font-weight: typography.$bold;
		color: var(--text-secondary);
		border-bottom: 2px solid var(--border-medium);
		border-radius: layout.$item-corner;
		transition: background-color 0.15s ease;
		cursor: pointer;

		&:hover {
			background: var(--button-bg-hover);
		}
	}

	:global(.wx-grid .wx-cell) {
		padding: spacing.$unit * 0.5;
		vertical-align: middle;
		display: flex;
		align-items: center;
		border: none;
		--wx-table-cell-border: none;
	}

	:global(.wx-grid .wx-cell:first-child) {
		padding-left: spacing.$unit-2x;
	}

	:global(.wx-grid .wx-cell:not(:last-child)) {
		border-right: none;
	}

	:global(.wx-grid .wx-row:hover) {
		background: var(--bar-bg);
		cursor: pointer;
	}

	// Element color classes
	:global(.element-fire) {
		color: var(--fire-text);
	}
	:global(.element-water) {
		color: var(--water-text);
	}
	:global(.element-earth) {
		color: var(--earth-text);
	}
	:global(.element-wind) {
		color: var(--wind-text);
	}
	:global(.element-light) {
		color: var(--light-text);
	}
	:global(.element-dark) {
		color: var(--dark-text);
	}

	// Database image styling - removed to allow cells to control sizing
</style>
