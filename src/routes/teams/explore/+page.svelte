<script lang="ts">
  import type { PageData } from './$types'
  import { browser } from '$app/environment'
  import InfiniteScroll from '$lib/components/InfiniteScroll.svelte'
  import ExploreGrid from '$lib/components/explore/ExploreGrid.svelte'
  import { createInfiniteScrollResource } from '$lib/api/adapters/resources/infiniteScroll.resource.svelte'
  import { partyAdapter } from '$lib/api/adapters/party.adapter'

  const { data } = $props() as { data: PageData }

  // Create infinite scroll resource
  const exploreResource = createInfiniteScrollResource({
    fetcher: (page) => partyAdapter.list({ page }),
    initialData: data.items,
    initialPage: data.page || 1,
    initialTotalPages: data.totalPages,
    initialTotal: data.total,
    threshold: 300,
    debounceMs: 200,
    maxItems: 500, // Limit for performance
    debug: false // Disable debug logging
  })

  // Initialize with SSR data on client
  $effect(() => {
    if (browser && data.items && !exploreResource.items.length) {
      exploreResource.initFromSSR({
        items: data.items,
        page: data.page || 1,
        totalPages: data.totalPages,
        total: data.total
      })
    }
  })
</script>

<section class="explore">
  <header>
    <h1>Explore Teams</h1>
  </header>

  <InfiniteScroll resource={exploreResource} class="explore-grid">
    <ExploreGrid items={exploreResource.items} />

    {#snippet emptySnippet()}
      <div class="empty">
        <p>No teams found</p>
      </div>
    {/snippet}

    {#snippet endSnippet()}
      <div class="end">
        <p>You've reached the end of all teams!</p>
      </div>
    {/snippet}

    {#snippet errorSnippet(error)}
      <div class="error">
        <p>Failed to load teams: {error.message || 'Unknown error'}</p>
      </div>
    {/snippet}
  </InfiniteScroll>
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
</style>
