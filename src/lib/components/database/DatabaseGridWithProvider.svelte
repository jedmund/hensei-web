<!--
  DatabaseGridWithProvider component using SVAR DataGrid with RestDataProvider
  Provides client-side pagination and data management with REST API integration
-->
<svelte:options runes={true} />

<script lang="ts">
	import { Grid } from 'wx-svelte-grid'
	import type { IColumn, IRow } from 'wx-svelte-grid'
	import { DatabaseProvider } from '$lib/providers/DatabaseProvider'
	import { onMount, onDestroy } from 'svelte'
	import { goto } from '$app/navigation'

	interface Props {
		resource: 'weapons' | 'characters' | 'summons'
		columns: IColumn[]
		pageSize?: number
	}

	const { resource, columns, pageSize: initialPageSize = 20 }: Props = $props()

	// State
	let data = $state<any[]>([])
	let loading = $state(true)
	let currentPage = $state(1)
	let totalPages = $state(1)
	let total = $state(0)
	let searchTerm = $state('')
	let pageSize = $state(initialPageSize)
	let searchTimeout: ReturnType<typeof setTimeout> | undefined

	// Create provider
	const provider = new DatabaseProvider({ resource, pageSize: initialPageSize })

	// Grid API reference
	let api: any

	// Load data
	async function loadData(page: number = 1) {
		loading = true
		try {
			const result = await provider.loadPage(page)
			data = result
			currentPage = page

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
		} catch (error) {
			console.error('Failed to load data:', error)
		} finally {
			loading = false
		}
	}

	// Initialize grid
	const init = (apiRef: any) => {
		api = apiRef
		// Connect provider to grid
		api.setNext(provider)

		// Add row click handler
		api.on('select-row', (ev: any) => {
			console.log('Row selected:', ev)
			const rowId = ev.id
			if (rowId) {
				// Find the row data to get the granblue_id
				const rowData = data.find((item: any) => item.id === rowId)
				if (rowData && rowData.granblue_id) {
					console.log(`Navigating to: /database/${resource}/${rowData.granblue_id}`)
					goto(`/database/${resource}/${rowData.granblue_id}`)
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

		// Set new timeout for debounced search
		searchTimeout = setTimeout(() => {
			provider.setSearchQuery(term)
			loadData(1) // Reset to first page when searching
		}, 300) // 300ms debounce
	}

	// Watch for search term changes
	$effect(() => {
		handleSearch(searchTerm)
	})

	// Computed values
	const startItem = $derived((currentPage - 1) * pageSize + 1)
	const endItem = $derived(Math.min(currentPage * pageSize, total))

	// Load initial data
	onMount(() => {
		loadData()
	})

	// Clean up timeout on destroy
	onDestroy(() => {
		if (searchTimeout) {
			clearTimeout(searchTimeout)
		}
	})
</script>

<div class="grid">
	<div class="controls">
		<input type="text" placeholder="Search..." bind:value={searchTerm} />

		<div class="page-size-selector">
			<label for="page-size">Show:</label>
			<select id="page-size" value={pageSize} onchange={handlePageSizeChange}>
				<option value={10}>10</option>
				<option value={20}>20</option>
				<option value={50}>50</option>
				<option value={100}>100</option>
			</select>
		</div>
	</div>

	<div class="grid-wrapper" class:loading>
		{#if loading}
			<div class="loading-overlay">
				<div class="loading-spinner">Loading...</div>
			</div>
		{/if}

		<Grid {data} {columns} {init} sizes={{ rowHeight: 80 }} />
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
			<button class="pagination-button" onclick={handlePrevPage} disabled={currentPage <= 1}>
				Previous
			</button>

			<span class="page-display">
				Page {currentPage} of {totalPages}
			</span>

			<button
				class="pagination-button"
				onclick={handleNextPage}
				disabled={currentPage >= totalPages}
			>
				Next
			</button>
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
			justify-content: space-between;
			align-items: center;
			padding: spacing.$unit;
			border-bottom: 1px solid #e5e5e5;
			gap: spacing.$unit;

			input {
				padding: spacing.$unit spacing.$unit-2x;
				background: var(--input-bound-bg);
				border: none;
				border-radius: layout.$item-corner;
				font-size: typography.$font-medium;
				width: 100%;

				&:hover {
					background: var(--input-bound-bg-hover);
				}

				&:focus {
					outline: none;
					border-color: #007bff;
				}
			}

			.page-size-selector {
				display: flex;
				align-items: center;
				gap: spacing.$unit * 0.5;

				label {
					font-size: typography.$font-small;
				}

				select {
					padding: spacing.$unit * 0.25 spacing.$unit * 0.5;
					border: 1px solid #ddd;
					border-radius: 4px;
					font-size: typography.$font-small;
					background: white;
					cursor: pointer;
				}
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
			background: rgba(255, 255, 255, 0.9);
			display: flex;
			align-items: center;
			justify-content: center;
			z-index: 10;

			.loading-spinner {
				font-size: typography.$font-medium;
				color: #666;
			}
		}
	}

	.grid-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: spacing.$unit;
		border-top: 1px solid #e5e5e5;
		background: #f8f9fa;

		.pagination-info {
			font-size: typography.$font-small;
			color: #6c757d;
		}

		.pagination-controls {
			display: flex;
			align-items: center;
			gap: spacing.$unit;

			.pagination-button {
				padding: spacing.$unit * 0.5 spacing.$unit;
				background: white;
				border: 1px solid #ddd;
				border-radius: 4px;
				font-size: typography.$font-small;
				cursor: pointer;
				transition: all 0.2s;

				&:hover:not(:disabled) {
					background: #e9ecef;
					border-color: #adb5bd;
				}

				&:disabled {
					opacity: 0.5;
					cursor: not-allowed;
				}
			}

			.page-display {
				font-size: typography.$font-small;
				color: #495057;
				min-width: 100px;
				text-align: center;
			}
		}
	}

	// Global styles for SVAR Grid elements
	:global(.database-grid .wx-grid) {
		font-family: inherit;
		font-size: typography.$font-small;
		width: 100%;
	}

	:global(.database-grid .wx-table-box) {
		width: 100%;
		max-width: 100%;
	}

	:global(.wx-grid .wx-header-cell) {
		background: #f8f9fa;
		font-weight: typography.$bold;
		color: #495057;
		border-bottom: 2px solid #dee2e6;
	}

	:global(.wx-grid .wx-cell) {
		padding: spacing.$unit * 0.5;
		border-bottom: 1px solid #dee2e6;
		vertical-align: middle;
		display: flex;
		align-items: center;
	}

	:global(.wx-grid .wx-row:hover) {
		background: #f8f9fa;
		cursor: pointer;
	}

	// Element color classes
	:global(.element-fire) {
		color: #ff6b6b;
	}
	:global(.element-water) {
		color: #4dabf7;
	}
	:global(.element-earth) {
		color: #51cf66;
	}
	:global(.element-wind) {
		color: #69db7c;
	}
	:global(.element-light) {
		color: #ffd43b;
	}
	:global(.element-dark) {
		color: #845ef7;
	}

	// Database image styling - removed to allow cells to control sizing
</style>
