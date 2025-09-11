<script lang="ts">
  import type { PageData } from './$types'
  import ExploreGrid from '$lib/components/explore/ExploreGrid.svelte'

  const { data } = $props() as { data: PageData }

  const page = data.page || 1
  const totalPages = data.totalPages || undefined
</script>

<section class="explore">
  <header>
    <h1>Explore Teams</h1>
  </header>

  <ExploreGrid items={data.items} />

  <nav class="pagination" aria-label="Pagination">
    {#if page > 1}
      <a rel="prev" href={`?page=${page - 1}`} data-sveltekit-preload-data="hover">Previous</a>
    {/if}
    {#if totalPages && page < totalPages}
      <a rel="next" href={`?page=${page + 1}`} data-sveltekit-preload-data="hover">Next</a>
    {/if}
  </nav>
</section>

<style lang="scss">
  @use '$src/themes/spacing' as *;

  .explore { padding: $unit-2x 0; }
  h1 { margin: 0 0 $unit-2x 0; }
  .pagination { display: flex; gap: $unit-2x; padding: $unit-2x 0; }
  .pagination a { text-decoration: none; }
</style>
