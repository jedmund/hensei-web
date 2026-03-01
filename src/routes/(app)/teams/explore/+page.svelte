<script lang="ts">
  import type { PageData } from './$types'
  import { onMount, onDestroy } from 'svelte'
  import { createInfiniteQuery } from '@tanstack/svelte-query'
  import ExploreGrid from '$lib/components/explore/ExploreGrid.svelte'
  import ExploreFilters, { type FilterItem } from '$lib/components/explore/ExploreFilters.svelte'
  import ExploreSettingsModal from '$lib/components/explore/ExploreSettingsModal.svelte'
  import { partyQueries } from '$lib/api/queries/party.queries'
  import type { ExploreFilterParams } from '$lib/api/adapters/party.adapter'
  import { useInfiniteLoader } from '$lib/stores/loaderState.svelte'
  import { defaultFilterSet } from '$lib/utils/defaultFilters'
  import type { FilterSet } from '$lib/types/FilterSet'
  import Icon from '$lib/components/Icon.svelte'
  import Button from '$lib/components/ui/Button.svelte'
  import PageMeta from '$lib/components/PageMeta.svelte'
  import * as m from '$lib/paraglide/messages'

  const { data } = $props() as { data: PageData }

  let sentinelEl = $state<HTMLElement>()

  // Filter state
  let filterItems = $state<FilterItem[]>([])
  let advancedFilters = $state<FilterSet>({ ...defaultFilterSet })
  let settingsOpen = $state(false)

  // Read advanced filters from cookie on mount
  onMount(() => {
    try {
      const cookie = document.cookie
        .split('; ')
        .find((c) => c.startsWith('filters='))
      if (cookie) {
        const cookieValue = cookie.split('=').slice(1).join('=')
        const parsed = JSON.parse(decodeURIComponent(cookieValue))
        advancedFilters = { ...defaultFilterSet, ...parsed }
      }
    } catch {
      // Cookie parse failed, use defaults
    }
  })

  // Derive combined filter params from pill filters + advanced settings
  const filterParams = $derived.by((): ExploreFilterParams => {
    const params: ExploreFilterParams = {}

    // Elements (multiple allowed)
    const elements = filterItems
      .filter((f): f is FilterItem & { kind: 'element' } => f.kind === 'element')
      .map((f) => f.value)
    if (elements.length > 0) params.element = elements

    // Raid (single)
    const raid = filterItems.find((f) => f.kind === 'raid')
    if (raid) params.raid = raid.value as string

    // Recency (single)
    const recency = filterItems.find((f) => f.kind === 'recency')
    if (recency) params.recency = recency.value as number

    // Job/Class
    const job = filterItems.find((f) => f.kind === 'class')
    if (job) params.job = job.value as string

    // Party settings
    for (const f of filterItems.filter((f) => f.kind === 'party')) {
      const val = f.value as string
      if (val === 'full_auto') params.fullAuto = 1
      else if (val === 'auto_guard') params.autoGuard = 1
      else if (val === 'charge_attack') params.chargeAttack = 1
      else if (val === 'youtube') params.hasVideo = true
    }

    // Entity includes/excludes — API expects comma-separated granblue_id values
    const entities = filterItems.filter(
      (f): f is FilterItem & { kind: 'entity' } => f.kind === 'entity'
    )
    const includeIds = entities
      .filter((f) => f.mode === 'include')
      .map((f) => f.granblueId)
    const excludeIds = entities
      .filter((f) => f.mode === 'exclude')
      .map((f) => f.granblueId)
    if (includeIds.length > 0) params.includes = includeIds.join(',')
    if (excludeIds.length > 0) params.excludes = excludeIds.join(',')

    // Advanced settings from cookie
    if (advancedFilters.characters_count !== undefined && advancedFilters.characters_count > 0)
      params.charactersCount = advancedFilters.characters_count
    if (advancedFilters.weapons_count !== undefined && advancedFilters.weapons_count > 0)
      params.weaponsCount = advancedFilters.weapons_count
    if (advancedFilters.summons_count !== undefined && advancedFilters.summons_count > 0)
      params.summonsCount = advancedFilters.summons_count
    if (advancedFilters.name_quality) params.nameQuality = true
    if (advancedFilters.user_quality) params.userQuality = true
    if (advancedFilters.original) params.original = true

    return params
  })

  const hasActiveFilters = $derived(filterItems.length > 0)

  // Query with filters
  const partiesQuery = createInfiniteQuery(() => ({
    ...partyQueries.list({ filters: filterParams }),
    initialData:
      !hasActiveFilters && data.items
        ? {
            pages: [
              {
                results: data.items,
                page: data.page || 1,
                totalPages: data.totalPages,
                total: data.total,
                perPage: data.perPage || 20
              }
            ],
            pageParams: [1]
          }
        : undefined,
    initialDataUpdatedAt: 0
  }))

  // Infinite scroll
  const loader = useInfiniteLoader(
    () => partiesQuery,
    () => sentinelEl,
    { rootMargin: '300px' }
  )

  // Reset loader when filters change
  $effect(() => {
    void filterParams
    loader.reset()
  })

  onDestroy(() => loader.destroy())

  const items = $derived(
    partiesQuery.data?.pages.flatMap((page) => page.results) ?? data.items ?? []
  )

  const isEmpty = $derived(!partiesQuery.isLoading && items.length === 0)

  function handleFiltersChange(newFilters: FilterItem[]) {
    filterItems = newFilters
  }

  function handleSettingsSave(filters: FilterSet) {
    advancedFilters = filters
    document.cookie = `filters=${encodeURIComponent(JSON.stringify(filters))}; path=/; max-age=31536000`
  }
</script>

<PageMeta title={m.page_title_teams()} description={m.page_desc_teams()} />

<section class="explore">
  <div class="filters-row">
    <ExploreFilters bind:filters={filterItems} onFiltersChange={handleFiltersChange} />
    <button
      type="button"
      class="settings-btn"
      onclick={() => (settingsOpen = true)}
      aria-label="Filter settings"
    >
      <Icon name="settings" size={16} />
    </button>
  </div>

  <ExploreSettingsModal
    bind:open={settingsOpen}
    filters={advancedFilters}
    onSave={handleSettingsSave}
  />

  {#if partiesQuery.isLoading}
    <div class="loading">
      <Icon name="loader-2" size={32} />
      <p>Loading teams...</p>
    </div>
  {:else if partiesQuery.isError}
    <div class="error">
      <Icon name="alert-circle" size={32} />
      <p>Failed to load teams: {partiesQuery.error?.message || 'Unknown error'}</p>
      <Button size="small" onclick={() => partiesQuery.refetch()}>Retry</Button>
    </div>
  {:else if isEmpty}
    <div class="empty">
      <p>No teams found</p>
    </div>
  {:else}
    <div class="explore-grid">
      <ExploreGrid items={items} />

      <div
        class="load-more-sentinel"
        bind:this={sentinelEl}
        class:hidden={!partiesQuery.hasNextPage}
      ></div>

      {#if partiesQuery.isFetchingNextPage}
        <div class="loading-more">
          <Icon name="loader-2" size={20} />
          <span>Loading more...</span>
        </div>
      {/if}

      {#if !partiesQuery.hasNextPage && items.length > 0}
        <div class="end">
          <p>You've reached the end of all teams!</p>
        </div>
      {/if}
    </div>
  {/if}
</section>

<style lang="scss">
  @use '$src/themes/spacing' as *;
  @use '$src/themes/colors' as *;
  @use '$src/themes/effects' as *;

  .explore {
    padding: $unit-2x 0;
  }

  .filters-row {
    display: flex;
    align-items: flex-start;
    gap: $unit;
    margin-bottom: $unit-2x;
  }

  .settings-btn {
    all: unset;
    cursor: pointer;
    display: flex;
    align-items: center;
    padding: $unit-half;
    color: var(--text-tertiary);
    border-radius: $unit-half;
    @include smooth-transition($duration-quick, color);

    &:hover {
      color: var(--text-primary);
    }
  }

  .empty,
  .end,
  .error {
    text-align: center;
    padding: $unit-4x;
    color: var(--text-secondary);

    p {
      margin: 0;
    }
  }

  .error {
    color: var(--text-error, #dc2626);
  }

  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: $unit;
    padding: $unit-4x;
    color: var(--text-secondary);

    :global(svg) {
      animation: spin 1s linear infinite;
    }

    p {
      margin: 0;
    }
  }

  .load-more-sentinel {
    height: 1px;
    margin-top: $unit;

    &.hidden {
      display: none;
    }
  }

  .loading-more {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $unit;
    padding: $unit-2x;
    color: var(--text-secondary);

    :global(svg) {
      animation: spin 1s linear infinite;
    }
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
</style>
