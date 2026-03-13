
<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'
  import { raidQueries } from '$lib/api/queries/raid.queries'
  import { searchAdapter } from '$lib/api/adapters/search.adapter'
  import type { UnifiedSearchResult } from '$lib/api/adapters/search.adapter'
  import type { RaidFull } from '$lib/types/api/raid'
  import ExploreFilterPill from './ExploreFilterPill.svelte'
  import SearchOptionItem from '$lib/components/search/SearchOptionItem.svelte'
  import type { UnifiedSearchSeriesRef } from '$lib/api/adapters/search.adapter'
  import Icon from '$lib/components/Icon.svelte'
  import * as m from '$lib/paraglide/messages'
  import { getLocale } from '$lib/paraglide/runtime'
  import { localizedName } from '$lib/utils/locale'

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
  let isComposing = $state(false)
  let searchTimeout: ReturnType<typeof setTimeout> | null = null

  // Fetch raid groups for raid search
  const raidGroupsQuery = createQuery(() => raidQueries.groups())

  // Flatten raids for searching
  const allRaids = $derived<RaidFull[]>(
    raidGroupsQuery.data?.flatMap((g) => g.raids) ?? []
  )

  // Static filter options
  const elementOptions = $derived([
    { value: 0, label: m.element_null() },
    { value: 1, label: m.element_wind() },
    { value: 2, label: m.element_fire() },
    { value: 3, label: m.element_water() },
    { value: 4, label: m.element_earth() },
    { value: 5, label: m.element_dark() },
    { value: 6, label: m.element_light() }
  ])

  const recencyOptions = $derived([
    { value: 86400, label: m.recency_day() },
    { value: 604800, label: m.recency_week() },
    { value: 2629746, label: m.recency_month() },
    { value: 7889238, label: m.recency_3months() },
    { value: 15778476, label: m.recency_6months() },
    { value: 31556952, label: m.recency_year() }
  ])

  const partyOptions = $derived([
    { value: 'full_auto', label: m.filter_full_auto() },
    { value: 'auto_guard', label: m.filter_auto_guard() },
    { value: 'charge_attack', label: m.filter_charge_attack() },
    { value: 'youtube', label: m.filter_youtube() }
  ])

  // Suggestion pools per category
  const elementSuggestions = $derived<FilterOption[]>(elementOptions
    .filter((e) => e.value !== 0)
    .map((e) => ({ kind: 'element', value: e.value, label: e.label, category: m.filter_cat_element() })))

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
    if (el) picks.push({ label: el.label, category: m.filter_cat_element(), option: el })

    // Raid (random from loaded data)
    const raidPool = allRaids.filter(
      (r) => !filters.some((f) => f.kind === 'raid' && f.value === r.slug)
    )
    const raid = pickRandom(raidPool)
    if (raid) {
      const opt: FilterOption = {
        kind: 'raid',
        value: raid.slug,
        label: localizedName(raid.name) ?? raid.slug,
        category: m.filter_cat_raid()
      }
      picks.push({ label: opt.label, category: m.filter_cat_raid(), option: opt })
    }

    // Recency (always "Last week")
    picks.push({
      label: m.recency_week(),
      category: m.filter_cat_recency(),
      option: { kind: 'recency', value: 604800, label: m.recency_week(), category: m.filter_cat_recency() }
    })

    // Entity from API (pick one random from a pool of 12)
    try {
      const { suggestions } = await searchAdapter.getRandomSuggestions()
      const entity = pickRandom(suggestions)
      if (entity) {
        const category = entity.type === 'character' ? m.filter_cat_character()
          : entity.type === 'weapon' ? m.filter_cat_weapon() : m.filter_cat_summon()
        const entityLabel = localizedName(entity.name as { en: string; ja: string }) ?? 'Unknown'
        picks.push({
          label: entityLabel,
          category,
          option: {
            kind: 'entity',
            value: entity.id,
            label: entityLabel,
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
      label: m.filter_full_auto(),
      category: m.filter_cat_party(),
      option: { kind: 'party', value: 'full_auto', label: m.filter_full_auto(), category: m.filter_cat_party() }
    })

    // Youtube (always)
    picks.push({
      label: m.filter_youtube(),
      category: m.filter_cat_party(),
      option: { kind: 'party', value: 'youtube', label: m.filter_youtube(), category: m.filter_cat_party() }
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
    season?: number | null
    series?: UnifiedSearchSeriesRef[] | null
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
          results.push({ kind: 'element', value: el.value, label: el.label, category: m.filter_cat_element() })
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
            category: m.filter_cat_recency()
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
            category: m.filter_cat_party()
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
            label: localizedName(raid.name) ?? raid.slug,
            category: m.filter_cat_raid()
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
        const response = await searchAdapter.searchAll({ query, per: 10, locale: getLocale() as 'en' | 'ja' })
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
          type === 'character' ? m.filter_cat_character() : type === 'weapon' ? m.filter_cat_weapon() : m.filter_cat_summon()
        return {
          kind: 'entity' as const,
          value: r.searchableId,
          label: localizedName({ en: r.nameEn ?? '', ja: r.nameJp ?? '' }) ?? 'Unknown',
          category,
          entityType: type,
          granblueId: r.granblueId,
          element: r.element,
          season: r.season,
          series: r.series
        }
      })

    return [...local, ...apiResults]
  })

  // Reset selected index when results change
  $effect(() => {
    void displayResults
    selectedIndex = 0
  })

  // Trigger search on input change (skip during IME composition)
  $effect(() => {
    if (!isComposing) searchEntities(inputValue)
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

  function handleCompositionStart() {
    isComposing = true
    if (searchTimeout) clearTimeout(searchTimeout)
  }

  function handleCompositionEnd(e: CompositionEvent) {
    // Small delay for Safari, which fires compositionend before keydown
    setTimeout(() => {
      isComposing = false
      const value = (e.target as HTMLInputElement)?.value ?? ''
      searchEntities(value)
    }, 50)
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.isComposing || e.keyCode === 229) return

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
          placeholder={m.explore_filter_placeholder()}
          onkeydown={handleKeydown}
          oncompositionstart={handleCompositionStart}
          oncompositionend={handleCompositionEnd}
        />
      </div>
    {:else}
      <button type="button" class="filter-trigger" onclick={openDropdown}>
        <span>{m.explore_filter()}</span>
        <Icon name="plus" size={9} />
      </button>

      {#if filters.length === 0}
        <span class="tagline">{m.explore_filter_tagline()}</span>
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
              class:entity={option.kind === 'entity'}
              class:selected={i === selectedIndex}
              role="option"
              aria-selected={i === selectedIndex}
              onmouseenter={() => (selectedIndex = i)}
              onclick={() => selectOption(option)}
            >
              {#if option.kind === 'entity' && option.granblueId}
                <SearchOptionItem
                  label={option.label}
                  granblueId={option.granblueId}
                  type={option.entityType === 'character' ? 'Character' : option.entityType === 'weapon' ? 'Weapon' : 'Summon'}
                  element={option.element}
                  season={option.season}
                  series={option.series}
                  showType={false}
                  imageSize={32}
                />
              {:else}
                <span class="result-label">{option.label}</span>
                <span class="result-category">{option.category}</span>
              {/if}
            </li>
          {/each}
        {:else if isSearching}
          <li class="result-item loading">
            <span class="result-label">{m.explore_searching()}</span>
          </li>
        {:else}
          <li class="result-item empty">
            <span class="result-label">{m.explore_no_results()}</span>
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

  @property --aura-angle {
    syntax: '<angle>';
    initial-value: 180deg;
    inherits: false;
  }

  .explore-filters {
    position: relative;

    // Aura gradient colors — bright pastels for light, muted for dark
    --aura-1: #f9c4d2;
    --aura-2: #b8e6d0;
    --aura-3: #b3d4f7;
    --aura-4: #e0b3f7;
    --aura-5: #f7d6b3;

    :global(html[data-theme='dark']) & {
      --aura-1: #7a3a4a;
      --aura-2: #2a5a3f;
      --aura-3: #2a4a6a;
      --aura-4: #5a2a6a;
      --aura-5: #6a4a2a;
    }
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
        from var(--aura-angle, 180deg),
        var(--aura-1), var(--aura-2), var(--aura-3), var(--aura-4),
        var(--aura-5), var(--aura-1)
      );
      opacity: 0;
      z-index: $z-base;
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
      z-index: $z-raised;
    }

    &:hover::before {
      opacity: 0.8;
      animation: spin-aura 8s linear infinite, breathe-aura 6s ease-in-out infinite;
    }

    // Ensure text and icon sit above the ::after background
    :global(> *) {
      position: relative;
      z-index: $z-badge;
    }

    :global(.icon) {
      color: var(--text-secondary);
    }
  }

  @keyframes spin-aura {
    to {
      --aura-angle: 540deg;
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
        from var(--aura-angle, 180deg),
        var(--aura-1), var(--aura-2), var(--aura-3), var(--aura-4),
        var(--aura-5), var(--aura-1)
      );
      opacity: 0.8;
      z-index: $z-base;
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
      z-index: $z-raised;
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
    z-index: $z-badge;

    &::placeholder {
      color: var(--text-tertiary);
    }
  }

  .dropdown {
    position: absolute;
    top: calc(100% + $unit);
    left: 0;
    width: 340px;
    background: var(--menu-bg);
    border: $card-border;
    border-radius: $card-corner;
    box-shadow: $dialog-elevation;
    z-index: $z-popover;
    overflow: hidden;
  }

  .results {
    list-style: none;
    margin: 0;
    padding: $unit-half;
    max-height: 280px;
    overflow-y: auto;
  }

  .result-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $unit;
    border-radius: $item-corner;
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
