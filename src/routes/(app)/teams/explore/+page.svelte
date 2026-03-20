<script lang="ts">
  import type { PageData } from './$types'
  import { onMount, onDestroy } from 'svelte'
  import { createInfiniteQuery, createQuery } from '@tanstack/svelte-query'
  import ExploreGrid from '$lib/components/explore/ExploreGrid.svelte'
  import ExploreFilters, { type FilterItem } from '$lib/components/explore/ExploreFilters.svelte'
  import ExploreSettingsModal from '$lib/components/explore/ExploreSettingsModal.svelte'
  import { partyQueries } from '$lib/api/queries/party.queries'
  import { collectionQueries } from '$lib/api/queries/collection.queries'
  import type { ExploreFilterParams } from '$lib/api/adapters/party.adapter'
  import { filterItemsToParams } from '$lib/utils/filterConversion'
  import { useInfiniteLoader } from '$lib/stores/loaderState.svelte'
  import { defaultFilterSet } from '$lib/utils/defaultFilters'
  import type { FilterSet } from '$lib/types/FilterSet'
  import Icon from '$lib/components/Icon.svelte'
  import Button from '$lib/components/ui/Button.svelte'
  import Tooltip from '$lib/components/ui/Tooltip.svelte'
  import PageMeta from '$lib/components/PageMeta.svelte'
  import * as m from '$lib/paraglide/messages'
  import { localizeHref } from '$lib/paraglide/runtime'

  const { data } = $props() as { data: PageData }

  let sentinelEl = $state<HTMLElement>()

  // Auth state from root layout
  const isAuthenticated = $derived(data.isAuthenticated)
  const currentUser = $derived(data.currentUser)

  // Filter state
  let filterItems = $state<FilterItem[]>([])
  let advancedFilters = $state<FilterSet>({ ...defaultFilterSet })
  let settingsOpen = $state(false)
  let collectionFilterActive = $state(false)

  // Collection counts query — only fetches when authenticated
  const collectionCountsQuery = createQuery(() => ({
    ...collectionQueries.counts(data.account?.userId ?? ''),
    enabled: !!data.account?.userId
  }))

  const hasCollection = $derived.by(() => {
    const counts = collectionCountsQuery.data
    if (!counts) return false
    return counts.characters + counts.weapons + counts.summons > 0
  })

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
    const params = filterItemsToParams(filterItems)

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

    // Collection filter
    if (collectionFilterActive) params.collectionFilter = true

    return params
  })

  const hasActiveFilters = $derived(
    filterItems.length > 0 ||
      !!advancedFilters.name_quality ||
      !!advancedFilters.user_quality ||
      !!advancedFilters.original ||
      (advancedFilters.characters_count !== undefined &&
        advancedFilters.characters_count !== defaultFilterSet.characters_count) ||
      (advancedFilters.weapons_count !== undefined &&
        advancedFilters.weapons_count !== defaultFilterSet.weapons_count) ||
      (advancedFilters.summons_count !== undefined &&
        advancedFilters.summons_count !== defaultFilterSet.summons_count)
  )

  // Count of active advanced settings and tooltip summary
  const advancedFilterCount = $derived.by(() => {
    let count = 0
    if (advancedFilters.name_quality) count++
    if (advancedFilters.user_quality) count++
    if (advancedFilters.original) count++
    if (
      advancedFilters.characters_count !== undefined &&
      advancedFilters.characters_count !== defaultFilterSet.characters_count
    )
      count++
    if (
      advancedFilters.weapons_count !== undefined &&
      advancedFilters.weapons_count !== defaultFilterSet.weapons_count
    )
      count++
    if (
      advancedFilters.summons_count !== undefined &&
      advancedFilters.summons_count !== defaultFilterSet.summons_count
    )
      count++
    return count
  })

  const advancedFilterTooltip = $derived.by(() => {
    const parts: string[] = []
    if (advancedFilters.name_quality) parts.push(m.explore_settings_name_quality())
    if (advancedFilters.user_quality) parts.push(m.explore_settings_user_quality())
    if (advancedFilters.original) parts.push(m.explore_settings_original())
    if (advancedFilters.characters_count !== undefined && advancedFilters.characters_count > 0)
      parts.push(`${m.explore_settings_min_characters()}: ${advancedFilters.characters_count}`)
    if (advancedFilters.weapons_count !== undefined && advancedFilters.weapons_count > 0)
      parts.push(`${m.explore_settings_min_weapons()}: ${advancedFilters.weapons_count}`)
    if (advancedFilters.summons_count !== undefined && advancedFilters.summons_count > 0)
      parts.push(`${m.explore_settings_min_summons()}: ${advancedFilters.summons_count}`)
    return parts.join(', ')
  })

  // Query with filters
  const partiesQuery = createInfiniteQuery(() => ({
    ...partyQueries.list({ filters: filterParams }),
    initialData:
      !hasActiveFilters && !collectionFilterActive && data.items
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
    initialDataUpdatedAt: Date.now()
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

  // Show empty collection prompt instead of normal empty state
  const showCollectionPrompt = $derived(
    collectionFilterActive && isAuthenticated && !hasCollection
  )

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
    <div class="filters-actions">
      {#if isAuthenticated}
        <Button
          variant="ghost"
          size="small"
          shape="pill"
          active={collectionFilterActive}
          onclick={() => (collectionFilterActive = !collectionFilterActive)}
          aria-label={m.explore_collection_aria()}
          aria-pressed={collectionFilterActive}
        >
          {m.explore_collection_only()}
        </Button>
      {/if}
      <Tooltip content={advancedFilterTooltip} disabled={advancedFilterCount === 0}>
        <Button
          variant="ghost"
          size="small"
          shape="pill"
          onclick={() => (settingsOpen = true)}
          aria-label={m.explore_settings_aria()}
        >
          {#snippet leftAccessory()}
            <Icon name="gear" size={14} />
          {/snippet}
          {#if advancedFilterCount > 0}
            {advancedFilterCount}
          {/if}
        </Button>
      </Tooltip>
    </div>
  </div>

  <ExploreSettingsModal
    bind:open={settingsOpen}
    filters={advancedFilters}
    onSave={handleSettingsSave}
    element={currentUser?.element as 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light' | undefined}
  />

  {#if showCollectionPrompt}
    <div class="empty-collection">
      <p>{m.explore_collection_prompt()}</p>
      <Button href={localizeHref(`/${data.account?.username}/collection`)} size="small">{m.explore_go_to_collection()}</Button>
    </div>
  {:else if partiesQuery.isLoading}
    <div class="loading">
      <Icon name="loader-2" size={32} />
      <p>{m.explore_loading()}</p>
    </div>
  {:else if partiesQuery.isError}
    <div class="error">
      <Icon name="alert-circle" size={32} />
      <p>{m.explore_load_error({ error: partiesQuery.error?.message || m.explore_unknown_error() })}</p>
      <Button size="small" onclick={() => partiesQuery.refetch()}>{m.retry()}</Button>
    </div>
  {:else if isEmpty}
    <div class="empty">
      {#if collectionFilterActive}
        <p>{m.explore_no_collection_match()}</p>
      {:else}
        <p>{m.explore_no_teams()}</p>
      {/if}
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
          <span>{m.explore_loading_more()}</span>
        </div>
      {/if}

      {#if !partiesQuery.hasNextPage && items.length > 0}
        <div class="end">
          <p>{m.explore_end()}</p>
        </div>
      {/if}
    </div>
  {/if}
</section>

<style lang="scss">
  @use '$src/themes/spacing' as *;
  @use '$src/themes/colors' as *;
  @use '$src/themes/effects' as *;
  @use '$src/themes/layout' as *;
  @use '$src/themes/typography' as *;

  .explore {
    padding: $unit-2x 0;
  }

  .filters-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: $unit;
    margin-bottom: $unit-2x;
  }

  .filters-actions {
    display: flex;
    align-items: center;
    gap: $unit;
    flex-shrink: 0;
  }

  .empty-collection {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: $unit;
    padding: $unit-4x;
    color: var(--text-secondary);

    p {
      margin: 0;
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
