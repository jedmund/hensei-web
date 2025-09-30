<script lang="ts">
  import WeaponUnit from '$lib/components/units/WeaponUnit.svelte'
  import ExtraContainerItem from './ExtraContainerItem.svelte'
  import type { GridWeapon } from '$lib/types/api/party'
  import * as m from '$lib/paraglide/messages'

  interface Props {
    weapons?: GridWeapon[]
    offset?: number
  }

  let { weapons = [], offset = 9 }: Props = $props()
</script>

<ExtraContainerItem title={m.extra_weapons()}>
  <ul class="grid">
    {#each [0, 1, 2] as i}
      <li class:empty={!weapons[offset + i]}>
        <WeaponUnit item={weapons[offset + i]} position={offset + i} />
      </li>
    {/each}
  </ul>
</ExtraContainerItem>

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

