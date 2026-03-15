<script lang="ts">
  import type { Party } from '$lib/types/api/party'
  import GridRep from '$lib/components/reps/GridRep.svelte'
  import * as m from '$lib/paraglide/messages'

  interface Props {
    items?: Party[]
  }

  let { items = [] }: Props = $props()
</script>

{#if items.length === 0}
  <p class="empty">{m.explore_empty()}</p>
{:else}
  <ul class="grid" role="list">
    {#each items as p, i (i)}
      <li><GridRep party={p} /></li>
    {/each}
  </ul>
{/if}

<style lang="scss">
  @use '$src/themes/spacing' as *;
  @use '$src/themes/mixins' as *;

  .grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: $unit-3x;
    padding: 0;

    @include breakpoint(tablet) { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: $unit-2x; }
    @include breakpoint(phone) { grid-template-columns: 1fr; gap: $unit; }

    & > li { list-style: none; }
  }

  .empty { padding: $unit-2x 0; }
</style>
