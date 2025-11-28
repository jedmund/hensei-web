<script lang="ts">
  import type { Party } from '$lib/types/api/party'
  import GridRep from '$lib/components/reps/GridRep.svelte'

  export let items: Party[] = []
</script>

<ul class="collection" role="list">
  {#each items as p}
    <li><GridRep party={p} /></li>
  {/each}
  
</ul>

<style lang="scss">
  @use '$src/themes/spacing' as *;
  @use '$src/themes/mixins' as *;

  .collection { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: $unit-2x; padding: 0; }
  .collection > li { list-style: none; }
  @include breakpoint(phone) { .collection { grid-template-columns: 1fr; } }
</style>

