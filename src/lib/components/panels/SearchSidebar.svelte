
<script lang="ts">
  import { onMount } from 'svelte'
  import { searchAdapter, type SearchResult } from '$lib/api/adapters'
  import { getCharacterImage, getWeaponImage, getSummonImage, getPlaceholderImage, getWeaponFallbackImage, handleImageFallback } from '$lib/utils/images'
  import { toast } from 'svelte-sonner'
  import { extractErrorMessage } from '$lib/utils/errors'
  import { getElementColor, getElementOptions } from '$lib/utils/element'
  import { localizedName } from '$lib/utils/locale'
  import * as m from '$lib/paraglide/messages'

  interface Props {
    open?: boolean
    type: 'weapon' | 'character' | 'summon'
    onClose?: () => void
    onAddItems?: (items: SearchResult[]) => void
    canAddMore?: boolean
    requiredProficiencies?: number[]  // For mainhand: restricts to job's proficiencies
  }

  let {
    open = false,
    type = 'weapon',
    onClose = () => {},
    onAddItems = () => {},
    canAddMore = true,
    requiredProficiencies
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
  const elements = getElementOptions().map((opt) => ({
    ...opt,
    color: getElementColor(opt.value)
  }))

  const rarities = [
    { value: 1, label: 'R' },
    { value: 2, label: 'SR' },
    { value: 3, label: 'SSR' }
  ]

  const proficiencies = [
    { value: 1, label: m.proficiency_sabre() },
    { value: 2, label: m.proficiency_dagger() },
    { value: 3, label: m.proficiency_spear() },
    { value: 4, label: m.proficiency_axe() },
    { value: 5, label: m.proficiency_staff() },
    { value: 6, label: m.proficiency_gun() },
    { value: 7, label: m.proficiency_melee() },
    { value: 8, label: m.proficiency_bow() },
    { value: 9, label: m.proficiency_harp() },
    { value: 10, label: m.proficiency_katana() }
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
      const params: any = {
        page: currentPage,
        filters: {}
      }
      
      // Only add query if not empty
      if (searchQuery) {
        params.query = searchQuery
      }
      
      // Only add filters if they have values
      if (elementFilters.length > 0) {
        params.filters.element = elementFilters
      }
      if (rarityFilters.length > 0) {
        params.filters.rarity = rarityFilters
      }
      if (type === 'weapon') {
        // Use required proficiencies (for mainhand) if set, otherwise use user-selected filters
        const profs = requiredProficiencies ?? (proficiencyFilters.length > 0 ? proficiencyFilters : undefined)
        if (profs && profs.length > 0) {
          params.filters.proficiency1 = profs
        }
      }

      let response
      switch (type) {
        case 'weapon':
          response = await searchAdapter.searchWeapons(params)
          break
        case 'character':
          response = await searchAdapter.searchCharacters(params)
          break
        case 'summon':
          response = await searchAdapter.searchSummons(params)
          break
      }

      searchResults = response?.results ?? []
      totalPages = response?.totalPages ?? 1
    } catch (error) {
      console.error('Search failed:', error)
      toast.error(extractErrorMessage(error, 'Search failed'))
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
    const id = item.granblueId
    if (!id) return getPlaceholderImage(type, 'grid')

    switch (type) {
      case 'character':
        return getCharacterImage(id, 'grid', '01')
      case 'weapon':
        return getWeaponImage(id, 'grid', item.element === 0 ? 0 : undefined)
      case 'summon':
        return getSummonImage(id, 'grid')
      default:
        return getPlaceholderImage(type, 'grid')
    }
  }

  function getFallbackUrl(item: SearchResult): string | undefined {
    if (type === 'weapon' && item.element === 0) {
      return getWeaponFallbackImage(item.granblueId, 'grid')
    }
    return undefined
  }

  function getItemName(item: SearchResult): string {
    return localizedName(item.name)
  }
</script>

<aside
  class="sidebar"
  class:open={open}
  aria-hidden={!open}
  aria-label={m.search_sidebar_title({ type })}
  onkeydown={handleKeyDown}
>
  <header class="sidebar-header">
    <h2>{m.search_sidebar_title({ type })}</h2>
    <button class="close-btn" onclick={onClose} aria-label="Close">×</button>
  </header>

  <div class="search-section">
    <input
      bind:this={searchInput}
      bind:value={searchQuery}
      type="text"
      placeholder={m.placeholder_search_by_name()}
      aria-label="Search"
      class="search-input"
    />
  </div>

  <div class="filters-section">
    <!-- Element filters -->
    <div class="filter-group">
      <label class="filter-label">{m.search_sidebar_element()}</label>
      <div class="filter-buttons">
        {#each elements as element}
          <button
            class="filter-btn element-btn"
            class:active={elementFilters.includes(element.value)}
            style="--element-color: {element.color}"
            onclick={() => toggleElementFilter(element.value)}
            aria-pressed={elementFilters.includes(element.value)}
          >
            {element.label}
          </button>
        {/each}
      </div>
    </div>

    <!-- Rarity filters -->
    <div class="filter-group">
      <label class="filter-label">{m.search_sidebar_rarity()}</label>
      <div class="filter-buttons">
        {#each rarities as rarity}
          <button
            class="filter-btn rarity-btn"
            class:active={rarityFilters.includes(rarity.value)}
            onclick={() => toggleRarityFilter(rarity.value)}
            aria-pressed={rarityFilters.includes(rarity.value)}
          >
            {rarity.label}
          </button>
        {/each}
      </div>
    </div>

    <!-- Proficiency filters (weapons only, hidden when required proficiencies set) -->
    {#if type === 'weapon' && !requiredProficiencies}
      <div class="filter-group">
        <label class="filter-label">{m.search_sidebar_proficiency()}</label>
        <div class="filter-buttons proficiency-grid">
          {#each proficiencies as prof}
            <button
              class="filter-btn prof-btn"
              class:active={proficiencyFilters.includes(prof.value)}
              onclick={() => toggleProficiencyFilter(prof.value)}
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
      <div class="loading">{m.search_sidebar_searching()}</div>
    {:else if searchResults.length > 0}
      <ul class="results-list">
        {#each searchResults as item (item.id)}
          <li class="result-item">
            <button
              class="result-button"
              class:disabled={!canAddMore}
              onclick={() => handleItemClick(item)}
              aria-label="{canAddMore ? 'Add' : 'Grid full - cannot add'} {getItemName(item)}"
              disabled={!canAddMore}
            >
              <img
                src={getImageUrl(item)}
                alt={getItemName(item)}
                class="result-image"
                onerror={(e) => handleImageFallback(e, getFallbackUrl(item))}
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
            onclick={() => currentPage = Math.max(1, currentPage - 1)}
            disabled={currentPage === 1}
          >
            {m.search_sidebar_previous()}
          </button>
          <span>{m.search_sidebar_page({ current: currentPage, total: totalPages })}</span>
          <button
            onclick={() => currentPage = Math.min(totalPages, currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            {m.search_sidebar_next()}
          </button>
        </div>
      {/if}
    {:else if searchQuery.length > 0}
      <div class="no-results">{m.search_sidebar_no_results()}</div>
    {:else if !hasInitialLoad}
      <div class="empty-state">{m.search_sidebar_loading()}</div>
    {:else}
      <div class="no-results">{m.search_sidebar_empty()}</div>
    {/if}
  </div>
</aside>

<style lang="scss">
	@use '$src/themes/layout' as layout;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/spacing' as spacing;

  .sidebar {
    width: 320px;
    height: 100vh;
    background: var(--card-bg);
    display: none;
    flex-direction: column;
    box-shadow: var(--shadow-md);
    border-left: 1px solid var(--border-subtle);
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
    border-bottom: 1px solid var(--border-subtle);
    background: var(--bar-bg);

    h2 {
      margin: 0;
      font-size: 18px;
      font-weight: typography.$bold;
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
      border-radius: layout.$item-corner-small;
      color: var(--text-primary);

      &:hover {
        background: var(--button-bg-hover);
      }
    }
  }

  .search-section {
    padding: 12px;
    border-bottom: 1px solid var(--border-subtle);

    .search-input {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid var(--border-subtle);
      border-radius: layout.$bubble-menu-item-corner;
      font-size: typography.$font-body;
      background: var(--input-bg);
      color: var(--text-primary);

      &:focus {
        outline: none;
        border-color: var(--accent-blue);
        box-shadow: 0 0 0 2px var(--accent-blue-focus);
      }
    }
  }

  .filters-section {
    padding: 12px;
    border-bottom: 1px solid var(--border-subtle);
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
      font-weight: typography.$bold;
      text-transform: uppercase;
      color: var(--text-tertiary);
      margin-bottom: 6px;
    }

    .filter-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: spacing.$unit-half;
    }

    .proficiency-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: spacing.$unit-half;
    }

    .filter-btn {
      padding: 4px 8px;
      border: 1px solid var(--border-subtle);
      background: var(--card-bg);
      border-radius: layout.$item-corner-small;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s;
      color: var(--text-primary);

      &:hover {
        background: var(--button-bg-hover);
      }

      &.active {
        background: var(--accent-blue);
        color: white;
        border-color: var(--accent-blue);
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
      padding: spacing.$unit-3x;
      color: var(--text-tertiary);
      font-size: typography.$font-body;
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
        padding: spacing.$unit;
        border: 1px solid transparent;
        border-radius: layout.$bubble-menu-item-corner;
        background: var(--card-bg);
        cursor: pointer;
        transition: all 0.2s;
        text-align: left;

        &:hover {
          background: var(--button-bg-hover);
          border-color: var(--accent-blue);
          box-shadow: var(--shadow-xs);
        }

        &:active:not(:disabled) {
          transform: scale(0.98);
        }

        &.disabled,
        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background: var(--button-bg-disabled);
          border-color: var(--border-subtle);

          &:hover {
            background: var(--button-bg-disabled);
            border-color: var(--border-subtle);
            box-shadow: none;
          }
        }
      }

      .result-image {
        width: 48px;
        height: 48px;
        object-fit: cover;
        border-radius: layout.$item-corner-small;
        margin-right: 12px;
        border: 1px solid var(--border-subtle);
      }

      .result-name {
        flex: 1;
        font-size: typography.$font-body;
        color: var(--text-primary);
      }

      .result-element {
        font-size: 12px;
        font-weight: typography.$bold;
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
      border-top: 1px solid var(--border-subtle);

      button {
        padding: 4px 12px;
        border: 1px solid var(--border-subtle);
        background: var(--card-bg);
        border-radius: layout.$item-corner-small;
        font-size: 13px;
        cursor: pointer;
        color: var(--text-primary);

        &:hover:not(:disabled) {
          background: var(--button-bg-hover);
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }

      span {
        font-size: 13px;
        color: var(--text-tertiary);
      }
    }
  }
</style>
