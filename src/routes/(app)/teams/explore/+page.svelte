<script lang="ts">
  import type { PageData } from './$types'
  import { createInfiniteQuery } from '@tanstack/svelte-query'
  import ExploreGrid from '$lib/components/explore/ExploreGrid.svelte'
  import { partyQueries } from '$lib/api/queries/party.queries'
  import { IsInViewport } from 'runed'
  import Icon from '$lib/components/Icon.svelte'
  import Button from '$lib/components/ui/Button.svelte'

  const { data } = $props() as { data: PageData }

  const partiesQuery = createInfiniteQuery(() => ({
    ...partyQueries.list(),
    initialData: data.items
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

  const items = $derived(
    partiesQuery.data?.pages.flatMap((page) => page.results) ?? data.items ?? []
  )

  const isEmpty = $derived(!partiesQuery.isLoading && items.length === 0)
  const showSentinel = $derived(partiesQuery.hasNextPage && !partiesQuery.isFetchingNextPage)

  let sentinelEl = $state<HTMLElement>()

  const inViewport = new IsInViewport(() => sentinelEl, {
    rootMargin: '300px'
  })

  $effect(() => {
    if (
      inViewport.current &&
      partiesQuery.hasNextPage &&
      !partiesQuery.isFetchingNextPage &&
      !partiesQuery.isLoading
    ) {
      partiesQuery.fetchNextPage()
    }
  })
</script>

<section class="explore">
  <header>
    <h1>Explore Teams</h1>
  </header>

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

      {#if showSentinel}
        <div class="load-more-sentinel" bind:this={sentinelEl}></div>
      {/if}

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

  .explore {
    padding: $unit-2x 0;
  }

  h1 {
    margin: 0 0 $unit-2x 0;
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
