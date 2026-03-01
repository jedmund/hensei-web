<svelte:options runes={true} />

<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'
  import { raidQueries } from '$lib/api/queries/raid.queries'
  import { searchAdapter } from '$lib/api/adapters/search.adapter'
  import type { UnifiedSearchResult } from '$lib/api/adapters/search.adapter'
  import type { RaidFull } from '$lib/types/api/raid'
  import ExploreFilterPill from './ExploreFilterPill.svelte'
  import Icon from '$lib/components/Icon.svelte'

  export type FilterItem =
    | { kind: 'element'; value: number; label: string }
    | { kind: 'raid'; value: string; label: string }
    | { kind: 'recency'; value: number; label: string }
    | { kind: 'class'; value: string; label: string }
    | {
        kind: 'entity'
        value: string
        label: string
        entityType: string
        granblueId: string
        mode: 'include' | 'exclude'
        element?: number
      }
    | { kind: 'party'; value: string; label: string }

  interface Props {
    filters: FilterItem[]
    onFiltersChange: (filters: FilterItem[]) => void
  }

  let { filters = $bindable([]), onFiltersChange }: Props = $props()

  let inputValue = $state('')
  let dropdownOpen = $state(false)
  let inputEl = $state<HTMLInputElement>()
  let containerEl = $state<HTMLDivElement>()
  let selectedIndex = $state(0)
  let searchResults = $state<UnifiedSearchResult[]>([])
  let isSearching = $state(false)
  let searchTimeout: ReturnType<typeof setTimeout> | null = null

  // Fetch raid groups for raid search
  const raidGroupsQuery = createQuery(() => raidQueries.groups())

  // Flatten raids for searching
  const allRaids = $derived<RaidFull[]>(
    raidGroupsQuery.data?.flatMap((g) => g.raids) ?? []
  )

  // Static filter options
  const elementOptions = [
    { value: 0, label: 'Null' },
    { value: 1, label: 'Wind' },
    { value: 2, label: 'Fire' },
    { value: 3, label: 'Water' },
    { value: 4, label: 'Earth' },
    { value: 5, label: 'Dark' },
    { value: 6, label: 'Light' }
  ]

  const recencyOptions = [
    { value: 86400, label: 'Last day' },
    { value: 604800, label: 'Last week' },
    { value: 2629746, label: 'Last month' },
    { value: 7889238, label: 'Last 3 months' },
    { value: 15778476, label: 'Last 6 months' },
    { value: 31556952, label: 'Last year' }
  ]

  const partyOptions = [
    { value: 'full_auto', label: 'Full Auto' },
    { value: 'auto_guard', label: 'Auto Guard' },
    { value: 'charge_attack', label: 'Charge Attack' },
    { value: 'youtube', label: 'Youtube' }
  ]

  // Suggestion pools per category
  const elementSuggestions: FilterOption[] = elementOptions
    .filter((e) => e.value !== 0)
    .map((e) => ({ kind: 'element', value: e.value, label: e.label, category: 'Element' }))

  // Pick one random item from an array
  function pickRandom<T>(arr: T[]): T | undefined {
    if (arr.length === 0) return undefined
    return arr[Math.floor(Math.random() * arr.length)]
  }

  interface PlaceholderSuggestion {
    label: string
    category: string
    option?: FilterOption // if set, clicking adds the filter directly
  }

  // Randomized suggestions, refreshed each time dropdown opens
  let placeholderSuggestions = $state<PlaceholderSuggestion[]>([])

  async function refreshSuggestions() {
    const picks: PlaceholderSuggestion[] = []

    // Element (random)
    const el = pickRandom(elementSuggestions)
    if (el) picks.push({ label: el.label, category: 'Element', option: el })

    // Raid (random from loaded data)
    const raidPool = allRaids.filter(
      (r) => !filters.some((f) => f.kind === 'raid' && f.value === r.slug)
    )
    const raid = pickRandom(raidPool)
    if (raid) {
      const opt: FilterOption = {
        kind: 'raid',
        value: raid.slug,
        label: raid.name?.en ?? raid.slug,
        category: 'Raid'
      }
      picks.push({ label: opt.label, category: 'Raid', option: opt })
    }

    // Recency (always "Last week")
    picks.push({
      label: 'Last week',
      category: 'Recency',
      option: { kind: 'recency', value: 604800, label: 'Last week', category: 'Recency' }
    })

    // Entity from API (pick one random from a pool of 12)
    try {
      const { suggestions } = await searchAdapter.getRandomSuggestions()
      const entity = pickRandom(suggestions)
      if (entity) {
        const category = entity.type === 'character' ? 'Character'
          : entity.type === 'weapon' ? 'Weapon' : 'Summon'
        picks.push({
          label: entity.name?.en ?? 'Unknown',
          category,
          option: {
            kind: 'entity',
            value: entity.id,
            label: entity.name?.en ?? 'Unknown',
            category,
            entityType: entity.type,
            granblueId: entity.granblueId,
            element: entity.element
          }
        })
      }
    } catch {
      // Non-critical — other suggestions still show
    }

    // Full Auto (always)
    picks.push({
      label: 'Full Auto',
      category: 'Party',
      option: { kind: 'party', value: 'full_auto', label: 'Full Auto', category: 'Party' }
    })

    // Youtube (always)
    picks.push({
      label: 'Youtube',
      category: 'Party',
      option: { kind: 'party', value: 'youtube', label: 'Youtube', category: 'Party' }
    })

    placeholderSuggestions = picks
  }

  function handleSuggestionClick(suggestion: PlaceholderSuggestion) {
    if (suggestion.option) {
      selectOption(suggestion.option)
    }
  }

  // Search result type for display
  interface FilterOption {
    kind: FilterItem['kind']
    value: string | number
    label: string
    category: string
    entityType?: string
    granblueId?: string
    element?: number
  }

  // Filter local static options based on input
  function matchLocal(query: string): FilterOption[] {
    const q = query.toLowerCase()
    const results: FilterOption[] = []

    // Elements
    for (const el of elementOptions) {
      if (el.label.toLowerCase().includes(q)) {
        const alreadySelected = filters.some((f) => f.kind === 'element' && f.value === el.value)
        if (!alreadySelected) {
          results.push({ kind: 'element', value: el.value, label: el.label, category: 'Element' })
        }
      }
    }

    // Recency
    for (const rec of recencyOptions) {
      if (rec.label.toLowerCase().includes(q)) {
        const alreadySelected = filters.some((f) => f.kind === 'recency')
        if (!alreadySelected) {
          results.push({
            kind: 'recency',
            value: rec.value,
            label: rec.label,
            category: 'Recency'
          })
        }
      }
    }

    // Party settings
    for (const party of partyOptions) {
      if (party.label.toLowerCase().includes(q)) {
        const alreadySelected = filters.some(
          (f) => f.kind === 'party' && f.value === party.value
        )
        if (!alreadySelected) {
          results.push({
            kind: 'party',
            value: party.value,
            label: party.label,
            category: 'Party'
          })
        }
      }
    }

    // Raids
    for (const raid of allRaids) {
      const nameEn = raid.name?.en?.toLowerCase() ?? ''
      const nameJa = raid.name?.ja ?? ''
      if (nameEn.includes(q) || nameJa.includes(q)) {
        const alreadySelected = filters.some((f) => f.kind === 'raid' && f.value === raid.slug)
        if (!alreadySelected) {
          results.push({
            kind: 'raid',
            value: raid.slug,
            label: raid.name?.en ?? raid.slug,
            category: 'Raid'
          })
        }
      }
    }

    return results
  }

  // Debounced API search
  function searchEntities(query: string) {
    if (searchTimeout) clearTimeout(searchTimeout)

    if (query.length < 2) {
      searchResults = []
      isSearching = false
      return
    }

    isSearching = true
    searchTimeout = setTimeout(async () => {
      try {
        const response = await searchAdapter.searchAll({ query, per: 10 })
        searchResults = response.results ?? []
      } catch {
        searchResults = []
      } finally {
        isSearching = false
      }
    }, 300)
  }

  // Combined results: local + API
  const displayResults = $derived.by((): FilterOption[] => {
    if (!dropdownOpen) return []

    if (!inputValue.trim()) {
      return []
    }

    const local = matchLocal(inputValue)

    // Map API search results to FilterOption
    const apiResults: FilterOption[] = searchResults
      .filter((r) => {
        return !filters.some(
          (f) => f.kind === 'entity' && f.granblueId === r.granblueId
        )
      })
      .map((r) => {
        const type = r.searchableType.toLowerCase()
        const category =
          type === 'character' ? 'Character' : type === 'weapon' ? 'Weapon' : 'Summon'
        return {
          kind: 'entity' as const,
          value: r.searchableId,
          label: r.nameEn ?? 'Unknown',
          category,
          entityType: type,
          granblueId: r.granblueId,
          element: r.element
        }
      })

    return [...local, ...apiResults]
  })

  // Reset selected index when results change
  $effect(() => {
    void displayResults
    selectedIndex = 0
  })

  // Trigger search on input change
  $effect(() => {
    searchEntities(inputValue)
  })

  function openDropdown() {
    refreshSuggestions()
    dropdownOpen = true
    // Focus input after open
    requestAnimationFrame(() => inputEl?.focus())
  }

  function closeDropdown() {
    dropdownOpen = false
    inputValue = ''
    searchResults = []
  }

  function isAlreadySelected(option: FilterOption): boolean {
    return filters.some((f) => {
      if (f.kind !== option.kind) return false
      if (f.kind === 'entity') return f.granblueId === option.granblueId
      return f.value === option.value
    })
  }

  function selectOption(option: FilterOption) {
    if (isAlreadySelected(option)) return

    let newFilter: FilterItem

    if (option.kind === 'entity') {
      newFilter = {
        kind: 'entity',
        value: option.value as string,
        label: option.label,
        entityType: option.entityType!,
        granblueId: option.granblueId!,
        mode: 'include',
        element: option.element
      }
    } else if (option.kind === 'element') {
      newFilter = { kind: 'element', value: option.value as number, label: option.label }
    } else if (option.kind === 'recency') {
      // Replace existing recency filter
      const without = filters.filter((f) => f.kind !== 'recency')
      newFilter = { kind: 'recency', value: option.value as number, label: option.label }
      filters = [...without, newFilter]
      onFiltersChange(filters)
      inputValue = ''
      searchResults = []
      return
    } else if (option.kind === 'raid') {
      newFilter = { kind: 'raid', value: option.value as string, label: option.label }
    } else if (option.kind === 'class') {
      newFilter = { kind: 'class', value: option.value as string, label: option.label }
    } else {
      newFilter = { kind: 'party', value: option.value as string, label: option.label }
    }

    filters = [...filters, newFilter]
    onFiltersChange(filters)
    inputValue = ''
    searchResults = []
  }

  function removeFilter(index: number) {
    filters = filters.filter((_, i) => i !== index)
    onFiltersChange(filters)
  }

  function toggleEntityMode(index: number) {
    const filter = filters[index]
    if (!filter || filter.kind !== 'entity') return
    const updated: FilterItem[] = [...filters]
    updated[index] = { ...filter, mode: filter.mode === 'include' ? 'exclude' : 'include' }
    filters = updated
    onFiltersChange(filters)
  }

  function handleKeydown(e: KeyboardEvent) {
    const isPlaceholder = !inputValue.trim()
    const listLength = isPlaceholder ? placeholderSuggestions.length : displayResults.length

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      selectedIndex = Math.min(selectedIndex + 1, listLength - 1)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      selectedIndex = Math.max(selectedIndex - 1, 0)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (isPlaceholder) {
        const suggestion = placeholderSuggestions[selectedIndex]
        if (suggestion) handleSuggestionClick(suggestion)
      } else {
        const option = displayResults[selectedIndex]
        if (option) selectOption(option)
      }
    } else if (e.key === 'Escape') {
      closeDropdown()
    } else if (e.key === 'Backspace' && inputValue === '' && filters.length > 0) {
      removeFilter(filters.length - 1)
    }
  }

  // Close dropdown on outside click
  function handleWindowClick(e: MouseEvent) {
    const target = e.target as Node
    // If the target was removed from the DOM (e.g. the button swapped out by {#if}),
    // don't treat it as an outside click
    if (!target.isConnected) return
    if (containerEl && !containerEl.contains(target)) {
      closeDropdown()
    }
  }
</script>

<svelte:window onclick={handleWindowClick} />

<div class="explore-filters" bind:this={containerEl}>
  <div class="filter-row">
    {#if dropdownOpen}
      <div class="filter-input-wrapper">
        <input
          bind:this={inputEl}
          bind:value={inputValue}
          type="text"
          class="filter-input"
          placeholder="Start typing..."
          onkeydown={handleKeydown}
        />
      </div>
    {:else}
      <button type="button" class="filter-trigger" onclick={openDropdown}>
        <span>Filter</span>
        <Icon name="plus" size={9} />
      </button>

      {#if filters.length === 0}
        <span class="tagline">to find the perfect team</span>
      {/if}
    {/if}

    {#each filters as filter, i (i)}
      {@const pillElement = filter.kind === 'entity' ? filter.element : filter.kind === 'element' ? filter.value : undefined}
      <ExploreFilterPill
        label={filter.label}
        kind={filter.kind}
        mode={filter.kind === 'entity' ? filter.mode : undefined}
        element={pillElement}
        onRemove={() => removeFilter(i)}
        onToggleMode={() => toggleEntityMode(i)}
      />
    {/each}
  </div>

  {#if dropdownOpen}
    <div class="dropdown">
      <ul class="results" role="listbox">
        {#if !inputValue.trim()}
          {#each placeholderSuggestions as suggestion, i (suggestion.label)}
            <li
              class="result-item"
              class:selected={i === selectedIndex}
              role="option"
              aria-selected={i === selectedIndex}
              onmouseenter={() => (selectedIndex = i)}
              onclick={() => handleSuggestionClick(suggestion)}
            >
              <span class="result-label">{suggestion.label}</span>
              <span class="result-category">{suggestion.category}</span>
            </li>
          {/each}
        {:else if displayResults.length > 0}
          {#each displayResults as option, i (option.kind + '-' + option.value)}
            <li
              class="result-item"
              class:selected={i === selectedIndex}
              role="option"
              aria-selected={i === selectedIndex}
              onmouseenter={() => (selectedIndex = i)}
              onclick={() => selectOption(option)}
            >
              <span class="result-label">{option.label}</span>
              <span class="result-category">{option.category}</span>
            </li>
          {/each}
        {:else if isSearching}
          <li class="result-item loading">
            <span class="result-label">Searching...</span>
          </li>
        {:else}
          <li class="result-item empty">
            <span class="result-label">No results found</span>
          </li>
        {/if}
      </ul>
    </div>
  {/if}
</div>

<style lang="scss">
  @use '$src/themes/spacing' as *;
  @use '$src/themes/typography' as *;
  @use '$src/themes/layout' as *;
  @use '$src/themes/effects' as *;

  .explore-filters {
    position: relative;
  }

  .filter-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: $unit;
  }

  .tagline {
    font-size: $font-small;
    color: var(--text-secondary);
  }

  .filter-trigger {
    all: unset;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: $unit-half;
    padding: calc($unit-half + 1px) $unit;
    border-radius: $full-corner;
    font-size: $font-small;
    color: var(--text-primary);
    position: relative;

    // Gradient aura (behind everything)
    &::before {
      content: '';
      position: absolute;
      inset: -6px;
      border-radius: $full-corner;
      background: conic-gradient(
        from 180deg,
        #f9c4d2, #b8e6d0, #b3d4f7, #e0b3f7,
        #f7d6b3, #f9c4d2
      );
      opacity: 0;
      z-index: 0;
      filter: blur(12px);
      @include smooth-transition($duration-quick, opacity);
    }

    // White pill background (above gradient, below text)
    &::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: var(--card-bg);
      z-index: 1;
    }

    &:hover::before {
      opacity: 0.8;
      animation: spin-aura 8s linear infinite, breathe-aura 6s ease-in-out infinite;
    }

    // Ensure text and icon sit above the ::after background
    :global(> *) {
      position: relative;
      z-index: 2;
    }

    :global(.icon) {
      color: var(--text-secondary);
    }
  }

  @keyframes spin-aura {
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes breathe-aura {
    0%, 100% {
      inset: -6px;
      filter: blur(12px);
    }
    50% {
      inset: -14px;
      filter: blur(20px);
    }
  }

  .filter-input-wrapper {
    position: relative;
    display: inline-flex;
    border-radius: $full-corner;

    // Gradient aura (same as filter-trigger)
    &::before {
      content: '';
      position: absolute;
      inset: -6px;
      border-radius: $full-corner;
      background: conic-gradient(
        from 180deg,
        #f9c4d2, #b8e6d0, #b3d4f7, #e0b3f7,
        #f7d6b3, #f9c4d2
      );
      opacity: 0.8;
      z-index: 0;
      filter: blur(12px);
      animation: spin-aura 8s linear infinite, breathe-aura 6s ease-in-out infinite;
    }

    // White pill background with stroke
    &::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: var(--card-bg);
      box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.01);
      z-index: 1;
    }
  }

  .filter-input {
    all: unset;
    padding: calc($unit-half + 1px) $unit;
    border-radius: $full-corner;
    font-size: $font-small;
    color: var(--text-primary);
    min-width: 120px;
    box-sizing: border-box;
    position: relative;
    z-index: 2;

    &::placeholder {
      color: var(--text-tertiary);
    }
  }

  .dropdown {
    position: absolute;
    top: calc(100% + $unit);
    left: 0;
    width: 280px;
    background: var(--menu-bg);
    border: $card-border;
    border-radius: $card-corner;
    box-shadow: $dialog-elevation;
    z-index: 50;
    overflow: hidden;
  }

  .results {
    list-style: none;
    margin: 0;
    padding: $unit-half 0;
    max-height: 280px;
    overflow-y: auto;
  }

  .result-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $unit $unit-2x;
    cursor: pointer;
    @include smooth-transition($duration-quick, background);

    &:hover,
    &.selected {
      background: var(--menu-bg-item-hover);
    }

    &.loading,
    &.empty {
      cursor: default;
      color: var(--text-tertiary);
    }
  }

  .result-label {
    font-size: $font-small;
    color: var(--text-primary);

    .loading &,
    .empty & {
      color: var(--text-tertiary);
    }
  }

  .result-category {
    font-size: $font-tiny;
    color: var(--text-tertiary);
  }
</style>
