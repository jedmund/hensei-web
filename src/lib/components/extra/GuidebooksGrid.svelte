<script lang="ts">
  import GuidebookUnit from '$lib/components/extra/GuidebookUnit.svelte'

  // In API, guidebooks comes as a record with keys '1','2','3'
  export let guidebooks: Record<string, any> | undefined
</script>

<div class="guidebooks">
  <ul class="grid">
    {#each [1,2,3] as pos}
      <li>
        <GuidebookUnit item={guidebooks?.[String(pos)]} position={pos} />
      </li>
    {/each}
  </ul>
</div>

<style lang="scss">
  @use '$src/themes/spacing' as *;
  @use '$src/themes/mixins' as *;

  .guidebooks {
    .grid {
      display: grid;
      gap: $unit-3x;
      grid-template-columns: repeat(3, minmax(0, 1fr));

      @include breakpoint(tablet) { gap: $unit-2x; }
      @include breakpoint(phone) { gap: $unit; }

      & > li { list-style: none; }
    }
  }
</style>

