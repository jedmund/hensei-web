<svelte:options runes={true} />

<script lang="ts">
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import { openSearchSidebar } from '$lib/features/search/openSearchSidebar.svelte'
	import type { SearchResult } from '$lib/api/adapters/search.adapter'

	let selectedItems = $state<SearchResult[]>([])

	function handleAddItems(items: SearchResult[]) {
		selectedItems = [...selectedItems, ...items]
		console.log('Added items:', items)
	}

	function openWeaponSearch() {
		openSearchSidebar({
			type: 'weapon',
			onAddItems: handleAddItems,
			canAddMore: true
		})
	}

	function openCharacterSearch() {
		openSearchSidebar({
			type: 'character',
			onAddItems: handleAddItems,
			canAddMore: true
		})
	}

	function openSummonSearch() {
		openSearchSidebar({
			type: 'summon',
			onAddItems: handleAddItems,
			canAddMore: true
		})
	}

	function openDetailsSidebar() {
		sidebar.open('Item Details', detailsContent)
	}

	function openFilterSidebar() {
		sidebar.open('Filters', filterContent)
	}
</script>

<div class="container">
	<h1>Sidebar Test Page</h1>
	<p>Click the buttons below to test different sidebar configurations:</p>

	<div class="button-group">
		<Button variant="primary" onclick={openWeaponSearch}>
			Search Weapons
		</Button>
		<Button variant="primary" onclick={openCharacterSearch}>
			Search Characters
		</Button>
		<Button variant="primary" onclick={openSummonSearch}>
			Search Summons
		</Button>
		<Button variant="secondary" onclick={openDetailsSidebar}>
			Open Details Sidebar
		</Button>
		<Button variant="secondary" onclick={openFilterSidebar}>
			Open Filter Sidebar
		</Button>
	</div>

	{#if selectedItems.length > 0}
		<div class="selected-items">
			<h3>Selected Items ({selectedItems.length})</h3>
			<ul>
				{#each selectedItems as item}
					<li>{item.name?.en || item.name?.ja || item.name || 'Unknown'}</li>
				{/each}
			</ul>
		</div>
	{/if}

	<div class="content">
		<h2>Main Content Area</h2>
		<p>This content will shrink when the sidebar opens, creating a two-pane layout.</p>
		<p>All sidebars have a standard width of 420px for consistency.</p>
		<p>On mobile devices, the sidebar will overlay the main content instead of shrinking it.</p>
	</div>
</div>

{#snippet detailsContent()}
	<div class="sidebar-demo-content">
		<h3>Item Name</h3>
		<p>This is a detailed view of an item with lots of information.</p>
		<div class="detail-section">
			<h4>Statistics</h4>
			<ul>
				<li>Attack: 1000</li>
				<li>HP: 500</li>
				<li>Element: Fire</li>
			</ul>
		</div>
		<div class="detail-section">
			<h4>Description</h4>
			<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
		</div>
	</div>
{/snippet}

{#snippet filterContent()}
	<div class="sidebar-demo-content">
		<div class="filter-group">
			<h4>Element</h4>
			<label><input type="checkbox" /> Fire</label>
			<label><input type="checkbox" /> Water</label>
			<label><input type="checkbox" /> Earth</label>
			<label><input type="checkbox" /> Wind</label>
		</div>
		<div class="filter-group">
			<h4>Rarity</h4>
			<label><input type="checkbox" /> SSR</label>
			<label><input type="checkbox" /> SR</label>
			<label><input type="checkbox" /> R</label>
		</div>
		<Button variant="primary" fullWidth onclick={() => sidebar.close()}>
			Apply Filters
		</Button>
	</div>
{/snippet}

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/colors' as *;
	@use '$src/themes/typography' as *;

	.container {
		padding: $unit-3x;
		max-width: 1200px;
		margin: 0 auto;
	}

	.button-group {
		display: flex;
		gap: $unit;
		margin: $unit-2x 0;
		flex-wrap: wrap;
	}

	.selected-items {
		margin: $unit-2x 0;
		padding: $unit-2x;
		background: var(--bg-secondary);
		border-radius: 8px;

		h3 {
			margin: 0 0 $unit 0;
			font-size: $font-medium;
			color: var(--text-primary);
		}

		ul {
			margin: 0;
			padding-left: $unit-2x;

			li {
				color: var(--text-secondary);
				margin-bottom: $unit-half;
			}
		}
	}

	.content {
		margin-top: $unit-3x;
		padding: $unit-2x;
		background: var(--bg-secondary);
		border-radius: 8px;
	}

	:global(.sidebar-demo-content) {
		.search-input {
			width: 100%;
			padding: $unit;
			border: 1px solid var(--border-primary);
			border-radius: 4px;
			background: var(--bg-secondary);
			color: var(--text-primary);
			font-size: $font-regular;
			margin-bottom: $unit-2x;

			&:focus {
				outline: none;
				border-color: var(--accent-blue);
			}
		}

		.search-results {
			display: flex;
			flex-direction: column;
			gap: $unit;
		}

		.result-item {
			padding: $unit;
			background: var(--bg-secondary);
			border-radius: 4px;
			cursor: pointer;

			&:hover {
				background: var(--bg-tertiary);
			}
		}

		.detail-section {
			margin: $unit-2x 0;

			h4 {
				margin-bottom: $unit;
				color: var(--text-secondary);
			}

			ul {
				list-style: none;
				padding: 0;
				margin: 0;

				li {
					padding: $unit-half 0;
				}
			}
		}

		.filter-group {
			margin-bottom: $unit-2x;

			h4 {
				margin-bottom: $unit;
				color: var(--text-secondary);
			}

			label {
				display: block;
				padding: $unit-half 0;
				cursor: pointer;

				input {
					margin-right: $unit;
				}
			}
		}
	}
</style>