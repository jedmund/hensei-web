<!--
  DatabaseGrid component using SVAR DataGrid for Svelte 5
  Provides server-side pagination, sorting, and filtering for database tables
-->
<svelte:options runes={true} />

<script lang="ts">
	import { Grid } from 'wx-svelte-grid'
	import type { IColumn, IRow } from 'wx-svelte-grid'

	interface Props {
		data: any[]
		columns: IColumn[]
		page: number
		totalPages: number
		pageSize: number
		total: number
		onPageChange: (page: number) => void
		onPageSizeChange: (pageSize: number) => void
		loading?: boolean
	}

	const {
		data,
		columns,
		page,
		totalPages,
		pageSize,
		total,
		onPageChange,
		onPageSizeChange,
		loading = false
	}: Props = $props()

	// Search state
	let searchTerm = $state('')

	// Computed values for pagination display
	const startItem = $derived((page - 1) * pageSize + 1)
	const endItem = $derived(Math.min(page * pageSize, total))

	// Handle pagination controls
	const handlePrevPage = () => {
		if (page > 1) {
			onPageChange(page - 1)
		}
	}

	const handleNextPage = () => {
		if (page < totalPages) {
			onPageChange(page + 1)
		}
	}

	const handlePageSizeChange = (event: Event) => {
		const target = event.target as HTMLSelectElement
		onPageSizeChange(Number(target.value))
	}

	// Filter data based on search term (client-side for now)
	const filteredData = $derived.by(() => {
		if (!searchTerm) return data

		const term = searchTerm.toLowerCase()
		return data.filter(item => {
			// Search across all string fields
			return Object.values(item).some(value =>
				typeof value === 'string' && value.toLowerCase().includes(term)
			)
		})
	})

	// Grid configuration
	let api: any

	const init = (apiRef: any) => {
		api = apiRef
		console.log('[DatabaseGrid] Grid API initialized:', api)
		console.log('[DatabaseGrid] Data passed to grid:', data)
		console.log('[DatabaseGrid] Columns passed to grid:', columns)
	}
</script>

<div class="database-grid">
	<div class="grid-controls">
		<div class="search-bar">
			<input
				type="text"
				placeholder="Search..."
				bind:value={searchTerm}
				class="search-input"
			/>
		</div>

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

		<Grid
			data={filteredData}
			{columns}
			{init}
		/>
	</div>

	<div class="grid-footer">
		<div class="pagination-info">
			Showing {startItem} to {endItem} of {total} entries
		</div>

		<div class="pagination-controls">
			<button
				class="pagination-button"
				onclick={handlePrevPage}
				disabled={page <= 1}
			>
				Previous
			</button>

			<span class="page-display">
				Page {page} of {totalPages}
			</span>

			<button
				class="pagination-button"
				onclick={handleNextPage}
				disabled={page >= totalPages}
			>
				Next
			</button>
		</div>
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.database-grid {
		width: 100%;
		background: white;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.grid-controls {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: spacing.$unit;
		border-bottom: 1px solid #e5e5e5;
		gap: spacing.$unit;

		.search-bar {
			flex: 1;
			max-width: 300px;
		}

		.search-input {
			width: 100%;
			padding: spacing.$unit * 0.5 spacing.$unit;
			border: 1px solid #ddd;
			border-radius: 4px;
			font-size: typography.$font-small;

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
		padding: spacing.$unit * 0.75 spacing.$unit;
		border-bottom: 1px solid #dee2e6;
	}

	:global(.wx-grid .wx-row:hover) {
		background: #f8f9fa;
	}

	// Element color classes
	:global(.element-fire) { color: #ff6b6b; }
	:global(.element-water) { color: #4dabf7; }
	:global(.element-earth) { color: #51cf66; }
	:global(.element-wind) { color: #69db7c; }
	:global(.element-light) { color: #ffd43b; }
	:global(.element-dark) { color: #845ef7; }

	// Database image styling
	:global(.database-image) {
		width: 40px;
		height: 40px;
		object-fit: cover;
		border-radius: 4px;
	}
</style>