<svelte:options runes={true} />

<script lang="ts">
  import { onMount } from 'svelte'
  import { searchWeapons, searchCharacters, searchSummons, type SearchResult } from '$lib/api/resources/search'

  interface Props {
    open?: boolean
    type: 'weapon' | 'character' | 'summon'
    onClose?: () => void
    onAddItems?: (items: SearchResult[]) => void
    canAddMore?: boolean
  }

  let {
    open = false,
    type = 'weapon',
    onClose = () => {},
    onAddItems = () => {},
    canAddMore = true
  }: Props = $props()

  // Search state
  let searchQuery = $state('')
  let searchResults = $state<SearchResult[]>([])
  let isLoading = $state(false)
  let currentPage = $state(1)
  let totalPages = $state(1)
  let hasInitialLoad = $state(false)

  // Filter state
  let elementFilters = $state<number[]>([])
  let rarityFilters = $state<number[]>([])
  let proficiencyFilters = $state<number[]>([])

  // Refs
  let searchInput: HTMLInputElement
  let resultsContainer: HTMLDivElement

  // Constants
  const elements = [
    { value: 0, label: 'Null', color: '#888' },
    { value: 1, label: 'Wind', color: '#4A9B3F' },
    { value: 2, label: 'Fire', color: '#D94444' },
    { value: 3, label: 'Water', color: '#4A7FB8' },
    { value: 4, label: 'Earth', color: '#9B6E3F' },
    { value: 5, label: 'Dark', color: '#6B3E9B' },
    { value: 6, label: 'Light', color: '#F4B643' }
  ]

  const rarities = [
    { value: 1, label: 'R' },
    { value: 2, label: 'SR' },
    { value: 3, label: 'SSR' }
  ]

  const proficiencies = [
    { value: 1, label: 'Sabre' },
    { value: 2, label: 'Dagger' },
    { value: 3, label: 'Spear' },
    { value: 4, label: 'Axe' },
    { value: 5, label: 'Staff' },
    { value: 6, label: 'Gun' },
    { value: 7, label: 'Melee' },
    { value: 8, label: 'Bow' },
    { value: 9, label: 'Harp' },
    { value: 10, label: 'Katana' }
  ]

  // Focus search input and load recent items when opened
  $effect(() => {
    if (open && searchInput) {
      searchInput.focus()
    }
    // Load recent items when opening if we haven't already
    if (open && !hasInitialLoad) {
      hasInitialLoad = true
      performSearch()
    }
  })

  // Search when query or filters change
  $effect(() => {
    // Always search if we have filters or a search query
    // If no query and no filters, still search to show recent items
    if (searchQuery.length >= 2 || elementFilters.length > 0 || rarityFilters.length > 0 || proficiencyFilters.length > 0) {
      performSearch()
    } else if (searchQuery.length === 1) {
      // Don't search with just 1 character
      return
    } else if (searchQuery.length === 0 && elementFilters.length === 0 && rarityFilters.length === 0 && proficiencyFilters.length === 0) {
      // Load recent items when no search criteria
      if (hasInitialLoad) {
        performSearch()
      }
    }
  })

  async function performSearch() {
    isLoading = true

    try {
      const params = {
        query: searchQuery || undefined, // Don't send empty string
        page: currentPage,
        filters: {
          element: elementFilters.length > 0 ? elementFilters : undefined,
          rarity: rarityFilters.length > 0 ? rarityFilters : undefined,
          proficiency1: type === 'weapon' && proficiencyFilters.length > 0 ? proficiencyFilters : undefined
        }
      }

      let response
      switch (type) {
        case 'weapon':
          response = await searchWeapons(params)
          break
        case 'character':
          response = await searchCharacters(params)
          break
        case 'summon':
          response = await searchSummons(params)
          break
      }

      searchResults = response.results
      totalPages = response.total_pages
    } catch (error) {
      console.error('Search failed:', error)
      searchResults = []
    } finally {
      isLoading = false
    }
  }

  function handleItemClick(item: SearchResult) {
    // Only add if we can add more items
    if (canAddMore) {
      onAddItems([item])
    }
  }

  function toggleElementFilter(element: number) {
    if (elementFilters.includes(element)) {
      elementFilters = elementFilters.filter(e => e !== element)
    } else {
      elementFilters = [...elementFilters, element]
    }
  }

  function toggleRarityFilter(rarity: number) {
    if (rarityFilters.includes(rarity)) {
      rarityFilters = rarityFilters.filter(r => r !== rarity)
    } else {
      rarityFilters = [...rarityFilters, rarity]
    }
  }

  function toggleProficiencyFilter(prof: number) {
    if (proficiencyFilters.includes(prof)) {
      proficiencyFilters = proficiencyFilters.filter(p => p !== prof)
    } else {
      proficiencyFilters = [...proficiencyFilters, prof]
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  function getImageUrl(item: SearchResult): string {
    if (!item.granblue_id) return '/images/placeholders/placeholder-' + type + '.png'

    const folder = type === 'weapon' ? 'weapon-grid' : type
    return `/images/${folder}/${item.granblue_id}.jpg`
  }

  function getItemName(item: SearchResult): string {
    const name = item.name
    if (typeof name === 'string') return name
    return name?.en || name?.ja || 'Unknown'
  }
</script>

<aside
  class="sidebar"
  class:open={open}
  aria-hidden={!open}
  aria-label="Search {type}s"
  on:keydown={handleKeyDown}
>
  <header class="sidebar-header">
    <h2>Search {type}s</h2>
    <button class="close-btn" on:click={onClose} aria-label="Close">×</button>
  </header>

  <div class="search-section">
    <input
      bind:this={searchInput}
      bind:value={searchQuery}
      type="text"
      placeholder="Search by name..."
      aria-label="Search"
      class="search-input"
    />
  </div>

  <div class="filters-section">
    <!-- Element filters -->
    <div class="filter-group">
      <label class="filter-label">Element</label>
      <div class="filter-buttons">
        {#each elements as element}
          <button
            class="filter-btn element-btn"
            class:active={elementFilters.includes(element.value)}
            style="--element-color: {element.color}"
            on:click={() => toggleElementFilter(element.value)}
            aria-pressed={elementFilters.includes(element.value)}
          >
            {element.label}
          </button>
        {/each}
      </div>
    </div>

    <!-- Rarity filters -->
    <div class="filter-group">
      <label class="filter-label">Rarity</label>
      <div class="filter-buttons">
        {#each rarities as rarity}
          <button
            class="filter-btn rarity-btn"
            class:active={rarityFilters.includes(rarity.value)}
            on:click={() => toggleRarityFilter(rarity.value)}
            aria-pressed={rarityFilters.includes(rarity.value)}
          >
            {rarity.label}
          </button>
        {/each}
      </div>
    </div>

    <!-- Proficiency filters (weapons only) -->
    {#if type === 'weapon'}
      <div class="filter-group">
        <label class="filter-label">Proficiency</label>
        <div class="filter-buttons proficiency-grid">
          {#each proficiencies as prof}
            <button
              class="filter-btn prof-btn"
              class:active={proficiencyFilters.includes(prof.value)}
              on:click={() => toggleProficiencyFilter(prof.value)}
              aria-pressed={proficiencyFilters.includes(prof.value)}
            >
              {prof.label}
            </button>
          {/each}
        </div>
      </div>
    {/if}
  </div>

  <!-- Results -->
  <div class="results-section" bind:this={resultsContainer}>
    {#if isLoading}
      <div class="loading">Searching...</div>
    {:else if searchResults.length > 0}
      <ul class="results-list">
        {#each searchResults as item (item.id)}
          <li class="result-item">
            <button
              class="result-button"
              class:disabled={!canAddMore}
              on:click={() => handleItemClick(item)}
              aria-label="{canAddMore ? 'Add' : 'Grid full - cannot add'} {getItemName(item)}"
              disabled={!canAddMore}
            >
              <img
                src={getImageUrl(item)}
                alt={getItemName(item)}
                class="result-image"
              />
              <span class="result-name">{getItemName(item)}</span>
              {#if item.element !== undefined}
                <span
                  class="result-element"
                  style="color: {elements.find(e => e.value === item.element)?.color}"
                >
                  {elements.find(e => e.value === item.element)?.label}
                </span>
              {/if}
            </button>
          </li>
        {/each}
      </ul>

      {#if totalPages > 1}
        <div class="pagination">
          <button
            on:click={() => currentPage = Math.max(1, currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button
            on:click={() => currentPage = Math.min(totalPages, currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      {/if}
    {:else if searchQuery.length > 0}
      <div class="no-results">No results found</div>
    {:else if !hasInitialLoad}
      <div class="empty-state">Loading recent items...</div>
    {:else}
      <div class="no-results">No items found</div>
    {/if}
  </div>
</aside>

<style lang="scss">
  .sidebar {
    width: 320px;
    height: 100vh;
    background: var(--app-bg, #fff);
    display: none;
    flex-direction: column;
    box-shadow: -2px 0 8px rgba(0,0,0,0.1);
    border-left: 1px solid #e0e0e0;
    position: sticky;
    top: 0;
    flex-shrink: 0;
  }

  .sidebar.open {
    display: flex;
  }

  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid #e0e0e0;
    background: #fafafa;

    h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }

    .close-btn {
      background: transparent;
      border: none;
      font-size: 24px;
      cursor: pointer;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;

      &:hover {
        background: rgba(0,0,0,0.05);
      }
    }
  }

  .search-section {
    padding: 12px;
    border-bottom: 1px solid #e0e0e0;

    .search-input {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 14px;

      &:focus {
        outline: none;
        border-color: #3366ff;
        box-shadow: 0 0 0 2px rgba(51, 102, 255, 0.1);
      }
    }
  }

  .filters-section {
    padding: 12px;
    border-bottom: 1px solid #e0e0e0;
    max-height: 280px;
    overflow-y: auto;

    .filter-group {
      margin-bottom: 12px;

      &:last-child {
        margin-bottom: 0;
      }
    }

    .filter-label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      color: #666;
      margin-bottom: 6px;
    }

    .filter-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }

    .proficiency-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 4px;
    }

    .filter-btn {
      padding: 4px 8px;
      border: 1px solid #ddd;
      background: white;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: #f5f5f5;
      }

      &.active {
        background: #3366ff;
        color: white;
        border-color: #3366ff;
      }

      &.element-btn.active {
        background: var(--element-color);
        border-color: var(--element-color);
      }
    }
  }


  .results-section {
    flex: 1;
    overflow-y: auto;
    padding: 12px;

    .loading, .no-results, .empty-state {
      text-align: center;
      padding: 24px;
      color: #666;
      font-size: 14px;
    }

    .results-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .result-item {
      margin-bottom: 4px;

      .result-button {
        width: 100%;
        display: flex;
        align-items: center;
        padding: 8px;
        border: 1px solid transparent;
        border-radius: 6px;
        background: white;
        cursor: pointer;
        transition: all 0.2s;
        text-align: left;

        &:hover {
          background: #f5f5f5;
          border-color: #3366ff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        &:active:not(:disabled) {
          transform: scale(0.98);
        }

        &.disabled,
        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background: #f9f9f9;
          border-color: #ddd;

          &:hover {
            background: #f9f9f9;
            border-color: #ddd;
            box-shadow: none;
          }
        }
      }

      .result-image {
        width: 48px;
        height: 48px;
        object-fit: cover;
        border-radius: 4px;
        margin-right: 12px;
        border: 1px solid #e0e0e0;
      }

      .result-name {
        flex: 1;
        font-size: 14px;
        color: #333;
      }

      .result-element {
        font-size: 12px;
        font-weight: 600;
        margin-left: 8px;
      }
    }

    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 12px;
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px solid #e0e0e0;

      button {
        padding: 4px 12px;
        border: 1px solid #ddd;
        background: white;
        border-radius: 4px;
        font-size: 13px;
        cursor: pointer;

        &:hover:not(:disabled) {
          background: #f0f0f0;
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }

      span {
        font-size: 13px;
        color: #666;
      }
    }
  }
</style>