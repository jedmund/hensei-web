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

  // Create array for extra weapon slots by finding weapons at positions offset+0, offset+1, offset+2
  let extraWeaponSlots = $derived.by(() => {
    return [0, 1, 2].map(i => weapons.find(w => w.position === offset + i))
  })
</script>

<ExtraContainerItem title={m.extra_weapons()}>
  <ul class="grid">
    {#each extraWeaponSlots as weapon, i}
      <li class:empty={!weapon}>
        <WeaponUnit item={weapon} position={offset + i} />
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

