<script lang="ts">
  import WeaponUnit from '$lib/components/units/WeaponUnit.svelte'
  import type { GridWeaponItemView } from '$lib/api/schemas/party'

  export let weapons: GridWeaponItemView[] = []
  export let offset = 9
</script>

<ul class="grid">
  {#each [0,1,2] as i}
    <li class:empty={!weapons[offset + i]}>
      <WeaponUnit item={weapons[offset + i]} position={offset + i} />
    </li>
  {/each}
</ul>

<style lang="scss">
  @use '$src/themes/spacing' as *;
  @use '$src/themes/mixins' as *;

  .grid {
    display: grid;
    gap: $unit-3x;
    grid-template-columns: repeat(3, minmax(0, 1fr));

    @include breakpoint(tablet) { gap: $unit-2x; }
    @include breakpoint(phone) { gap: $unit; }

    & > li { list-style: none; }
  }
</style>

