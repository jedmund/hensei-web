<!--
  Example Component: Search with Adapters

  This component demonstrates how to use the SearchAdapter and SearchResource
  for reactive search functionality with Svelte 5 runes.
-->

<script lang="ts">
	import { createSearchResource } from '$lib/api/adapters'
	import type { SearchResult } from '$lib/api/adapters'

	// Create a search resource with debouncing
	const search = createSearchResource({
		debounceMs: 300,
		initialParams: {
			locale: 'en',
			per: 20
		}
	})

	// Reactive state for the search query
	let query = $state('')
	let selectedType = $state<'all' | 'weapons' | 'characters' | 'summons'>('all')
	let selectedElement = $state<number[]>([])
	let selectedRarity = $state<number[]>([])

	// Element and rarity options
	const elements = [
		{ value: 1, label: '🔥 Fire' },
		{ value: 2, label: '💧 Water' },
		{ value: 3, label: '🌍 Earth' },
		{ value: 4, label: '🌪️ Wind' },
		{ value: 5, label: '⚡ Light' },
		{ value: 6, label: '🌙 Dark' }
	]

	const rarities = [
		{ value: 3, label: 'SSR' },
		{ value: 2, label: 'SR' },
		{ value: 1, label: 'R' }
	]

	// Reactive search effect
	$effect(() => {
		const params = {
			query,
			filters: {
				element: selectedElement.length > 0 ? selectedElement : undefined,
				rarity: selectedRarity.length > 0 ? selectedRarity : undefined
			}
		}

		// Perform search based on selected type
		switch (selectedType) {
			case 'all':
				search.searchAll(params)
				break
			case 'weapons':
				search.searchWeapons(params)
				break
			case 'characters':
				search.searchCharacters(params)
				break
			case 'summons':
				search.searchSummons(params)
				break
		}
	})

	// Get current search state based on selected type
	$derived.by(() => {
		switch (selectedType) {
			case 'all':
				return search.all
			case 'weapons':
				return search.weapons
			case 'characters':
				return search.characters
			case 'summons':
				return search.summons
		}
	}) as currentSearch

	// Format result for display
	function getResultIcon(result: SearchResult): string {
		switch (result.searchableType) {
			case 'Weapon':
				return '⚔️'
			case 'Character':
				return '👤'
			case 'Summon':
				return '🐉'
			default:
				return '❓'
		}
	}

	function getElementIcon(element?: number): string {
		return elements.find(e => e.value === element)?.label.split(' ')[0] || ''
	}
</script>

<div class="search-example">
	<h2>Search Example with Adapters</h2>

	<div class="search-controls">
		<div class="search-input-group">
			<input
				type="text"
				bind:value={query}
				placeholder="Search for items..."
				class="search-input"
			/>

			<select bind:value={selectedType} class="type-selector">
				<option value="all">All Types</option>
				<option value="weapons">Weapons Only</option>
				<option value="characters">Characters Only</option>
				<option value="summons">Summons Only</option>
			</select>
		</div>

		<div class="filters">
			<div class="filter-group">
				<label>Elements:</label>
				<div class="checkbox-group">
					{#each elements as element}
						<label class="checkbox-label">
							<input
								type="checkbox"
								value={element.value}
								on:change={(e) => {
									if (e.currentTarget.checked) {
										selectedElement = [...selectedElement, element.value]
									} else {
										selectedElement = selectedElement.filter(v => v !== element.value)
									}
								}}
							/>
							<span>{element.label}</span>
						</label>
					{/each}
				</div>
			</div>

			<div class="filter-group">
				<label>Rarity:</label>
				<div class="checkbox-group">
					{#each rarities as rarity}
						<label class="checkbox-label">
							<input
								type="checkbox"
								value={rarity.value}
								on:change={(e) => {
									if (e.currentTarget.checked) {
										selectedRarity = [...selectedRarity, rarity.value]
									} else {
										selectedRarity = selectedRarity.filter(v => v !== rarity.value)
									}
								}}
							/>
							<span>{rarity.label}</span>
						</label>
					{/each}
				</div>
			</div>
		</div>

		<div class="action-buttons">
			<button onclick={() => search.clearAll()}>Clear All Results</button>
			<button onclick={() => search.clearCache()}>Clear Cache</button>
		</div>
	</div>

	<div class="search-results">
		{#if currentSearch.loading}
			<div class="loading">
				<p>Searching...</p>
			</div>
		{:else if currentSearch.error}
			<div class="error">
				<p>❌ Error: {currentSearch.error.message}</p>
				<p class="error-code">Code: {currentSearch.error.code}</p>
			</div>
		{:else if currentSearch.data}
			{#if currentSearch.data.results.length === 0}
				<div class="no-results">
					<p>No results found</p>
				</div>
			{:else}
				<div class="results-header">
					<p>Found {currentSearch.data.total || currentSearch.data.results.length} results</p>
					{#if currentSearch.data.totalPages && currentSearch.data.totalPages > 1}
						<p class="pagination-info">
							Page {currentSearch.data.page || 1} of {currentSearch.data.totalPages}
						</p>
					{/if}
				</div>

				<div class="results-grid">
					{#each currentSearch.data.results as result}
						<div class="result-card">
							<div class="result-header">
								<span class="result-icon">{getResultIcon(result)}</span>
								<span class="result-element">{getElementIcon(result.element)}</span>
							</div>
							<h3 class="result-name">{result.name.en || result.name.ja || 'Unknown'}</h3>
							<div class="result-meta">
								<span class="result-type">{result.searchableType}</span>
								{#if result.rarity}
									<span class="result-rarity rarity-{result.rarity}">
										{result.rarity === 3 ? 'SSR' : result.rarity === 2 ? 'SR' : 'R'}
									</span>
								{/if}
							</div>
							{#if result.imageUrl}
								<img src={result.imageUrl} alt={result.name.en} class="result-image" />
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		{:else}
			<div class="empty-state">
				<p>Enter a search term to begin</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.search-example {
		padding: 1rem;
		max-width: 1200px;
		margin: 0 auto;
	}

	h2 {
		margin-bottom: 1.5rem;
		color: #333;
	}

	.search-controls {
		margin-bottom: 2rem;
	}

	.search-input-group {
		display: flex;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.search-input {
		flex: 1;
		padding: 0.75rem;
		font-size: 1rem;
		border: 1px solid #ddd;
		border-radius: 4px;
	}

	.type-selector {
		padding: 0.75rem;
		font-size: 1rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		background: white;
		cursor: pointer;
	}

	.filters {
		display: flex;
		gap: 2rem;
		margin: 1rem 0;
		padding: 1rem;
		background: #f5f5f5;
		border-radius: 4px;
	}

	.filter-group label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: bold;
	}

	.checkbox-group {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-weight: normal;
	}

	.action-buttons {
		display: flex;
		gap: 1rem;
		margin-top: 1rem;
	}

	button {
		padding: 0.5rem 1rem;
		background: #007bff;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9rem;
	}

	button:hover {
		background: #0056b3;
	}

	.search-results {
		min-height: 200px;
	}

	.loading, .error, .no-results, .empty-state {
		padding: 2rem;
		text-align: center;
		background: #f8f9fa;
		border-radius: 4px;
	}

	.error {
		background: #fee;
		color: #c00;
	}

	.error-code {
		font-size: 0.875rem;
		margin-top: 0.5rem;
		opacity: 0.8;
	}

	.results-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		padding: 0.5rem;
		background: #e9ecef;
		border-radius: 4px;
	}

	.pagination-info {
		font-size: 0.875rem;
		color: #666;
	}

	.results-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 1rem;
	}

	.result-card {
		padding: 1rem;
		background: white;
		border: 1px solid #ddd;
		border-radius: 4px;
		transition: transform 0.2s;
	}

	.result-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0,0,0,0.1);
	}

	.result-header {
		display: flex;
		justify-content: space-between;
		margin-bottom: 0.5rem;
	}

	.result-icon, .result-element {
		font-size: 1.25rem;
	}

	.result-name {
		font-size: 1rem;
		margin: 0.5rem 0;
		color: #333;
	}

	.result-meta {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 0.5rem;
		font-size: 0.875rem;
	}

	.result-type {
		color: #666;
	}

	.result-rarity {
		padding: 0.125rem 0.5rem;
		border-radius: 12px;
		font-weight: bold;
		font-size: 0.75rem;
	}

	.rarity-3 {
		background: linear-gradient(135deg, #ffd700, #ffed4e);
		color: #333;
	}

	.rarity-2 {
		background: linear-gradient(135deg, #c0c0c0, #e8e8e8);
		color: #333;
	}

	.rarity-1 {
		background: linear-gradient(135deg, #cd7f32, #e4a05e);
		color: white;
	}

	.result-image {
		width: 100%;
		height: auto;
		margin-top: 0.5rem;
		border-radius: 4px;
	}
</style>