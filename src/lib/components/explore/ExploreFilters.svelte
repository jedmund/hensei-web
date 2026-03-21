
<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'
  import { raidQueries } from '$lib/api/queries/raid.queries'
  import { searchAdapter } from '$lib/api/adapters/search.adapter'
  import type { UnifiedSearchResult } from '$lib/api/adapters/search.adapter'
  import type { RaidFull } from '$lib/types/api/raid'
  import type { FilterItem, FilterOption, PlaceholderSuggestion } from '$lib/types/filter'
  import { matchLocal, rankResults } from '$lib/utils/filterMatching'
  import ExploreFilterPill from './ExploreFilterPill.svelte'
  import FilterDropdown from './FilterDropdown.svelte'
  import Icon from '$lib/components/Icon.svelte'
  import * as m from '$lib/paraglide/messages'
  import { getLocale } from '$lib/paraglide/runtime'
  import { localizedName } from '$lib/utils/locale'
  import { getElementOptions } from '$lib/utils/element'

  interface Props {
    filters: FilterItem[]
    onFiltersChange: (filters: FilterItem[]) => void
    excludedKinds?: FilterItem['kind'][]
    /** Use when placed on a card/white surface — gives the pill a visible background */
    contained?: boolean
  }

  let { filters = $bindable([]), onFiltersChange, excludedKinds = [], contained = false }: Props = $props()

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
  const elementOptions = $derived(getElementOptions())

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
    { value: 'solo', label: m.filter_solo() },
    { value: 'auto_guard', label: m.filter_auto_guard() },
    { value: 'charge_attack', label: m.filter_charge_attack() },
    { value: 'youtube', label: m.filter_youtube() }
  ])

  const boostOptions = $derived([
    { value: 'omega', label: m.boost_omega(), aliases: ['magna'] },
    { value: 'primal', label: m.boost_primal() },
    { value: 'odious', label: m.boost_odious() },
    { value: 'unboosted', label: m.boost_unboosted() }
  ])

  const sideOptions = $derived([
    { value: 'double', label: m.side_double() },
    { value: 'single', label: m.side_single() }
  ])

  const categoryLabels = $derived({
    element: m.filter_cat_element(),
    recency: m.filter_cat_recency(),
    party: m.filter_cat_party(),
    raid: m.filter_cat_raid(),
    boost: m.filter_cat_boost(),
    side: m.filter_cat_side()
  })

  // Suggestion pools per category
  const elementSuggestions = $derived<FilterOption[]>(elementOptions
    .filter((e) => e.value !== 0)
    .map((e) => ({ kind: 'element', value: e.value, label: e.label, category: categoryLabels.element })))

  function pickRandom<T>(arr: T[]): T | undefined {
    if (arr.length === 0) return undefined
    return arr[Math.floor(Math.random() * arr.length)]
  }

  let placeholderSuggestions = $state<PlaceholderSuggestion[]>([])

  async function refreshSuggestions() {
    const picks: PlaceholderSuggestion[] = []

    if (!excludedKinds.includes('element')) {
      const el = pickRandom(elementSuggestions)
      if (el) picks.push({ label: el.label, category: categoryLabels.element, option: el })
    }

    if (!excludedKinds.includes('raid')) {
      const raidPool = allRaids.filter(
        (r) => !filters.some((f) => f.kind === 'raid' && f.value === r.id)
      )
      const raid = pickRandom(raidPool)
      if (raid) {
        const opt: FilterOption = {
          kind: 'raid',
          value: raid.id,
          label: localizedName(raid.name) ?? raid.slug,
          category: categoryLabels.raid
        }
        picks.push({ label: opt.label, category: categoryLabels.raid, option: opt })
      }
    }

    if (!excludedKinds.includes('recency')) {
      picks.push({
        label: m.recency_week(),
        category: categoryLabels.recency,
        option: { kind: 'recency', value: 604800, label: m.recency_week(), category: categoryLabels.recency }
      })
    }

    if (!excludedKinds.includes('entity')) {
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
    }

    if (!excludedKinds.includes('party')) {
      picks.push({
        label: m.filter_full_auto(),
        category: categoryLabels.party,
        option: { kind: 'party', value: 'full_auto', label: m.filter_full_auto(), category: categoryLabels.party }
      })
      picks.push({
        label: m.filter_solo(),
        category: categoryLabels.party,
        option: { kind: 'party', value: 'solo', label: m.filter_solo(), category: categoryLabels.party }
      })
      picks.push({
        label: m.filter_youtube(),
        category: categoryLabels.party,
        option: { kind: 'party', value: 'youtube', label: m.filter_youtube(), category: categoryLabels.party }
      })
    }

    placeholderSuggestions = picks
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
    if (!dropdownOpen || !inputValue.trim()) return []

    const local = matchLocal({
      query: inputValue,
      filters,
      excludedKinds,
      elementOptions,
      recencyOptions,
      partyOptions,
      boostOptions,
      sideOptions,
      allRaids,
      categoryLabels
    })

    const apiResults: FilterOption[] = searchResults
      .filter((r) => !filters.some((f) => f.kind === 'entity' && f.granblueId === r.granblueId))
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

    return rankResults([...local, ...apiResults], inputValue.trim().toLowerCase())
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

  // Single-select kinds replace existing filter of the same kind
  const singleSelectKinds = new Set(['recency', 'boost', 'side'])

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
    } else if (singleSelectKinds.has(option.kind)) {
      const without = filters.filter((f) => f.kind !== option.kind)
      newFilter = { kind: option.kind, value: option.value, label: option.label } as FilterItem
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
    if (filters[index]?.pinned) return
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
        if (suggestion?.option) selectOption(suggestion.option)
      } else {
        const option = displayResults[selectedIndex]
        if (option) selectOption(option)
      }
    } else if (e.key === 'Escape') {
      closeDropdown()
    } else if (e.key === 'Backspace' && inputValue === '' && filters.length > 0) {
      for (let i = filters.length - 1; i >= 0; i--) {
        if (!filters[i]?.pinned) {
          removeFilter(i)
          break
        }
      }
    }
  }

  function handleWindowClick(e: MouseEvent) {
    const target = e.target as Node
    if (!target.isConnected) return
    if (containerEl && !containerEl.contains(target)) {
      closeDropdown()
    }
  }
</script>

<svelte:window onclick={handleWindowClick} />

<div class="explore-filters" class:contained bind:this={containerEl}>
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
        pinned={filter.pinned}
        onRemove={() => removeFilter(i)}
        onToggleMode={() => toggleEntityMode(i)}
      />
    {/each}
  </div>

  {#if dropdownOpen}
    <FilterDropdown
      {inputValue}
      {isSearching}
      {placeholderSuggestions}
      {displayResults}
      {selectedIndex}
      onSelectedIndexChange={(i) => (selectedIndex = i)}
      onSelectOption={selectOption}
      onSuggestionClick={(s) => { if (s.option) selectOption(s.option) }}
    />
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

    .contained & {
      &::after {
        border: 1px solid var(--stroked-button-border);
      }
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

    .contained & {
      &::after {
        border: 1px solid var(--stroked-button-border);
      }
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
</style>
