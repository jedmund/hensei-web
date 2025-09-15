<svelte:options runes={true} />

<script lang="ts">
  import type { GridCharacter } from '$lib/types/api/party'

  interface Props {
    characters?: GridCharacter[]
    mainWeaponElement?: number | null | undefined
    partyElement?: number | null | undefined
  }

  let {
    characters = [],
    mainWeaponElement = undefined,
    partyElement = undefined
  }: Props = $props()

  import CharacterUnit from '$lib/components/units/CharacterUnit.svelte'

  let grid = $derived(Array.from({ length: 5 }, (_, i) => characters.find((c) => c.position === i)))
</script>

<div class="wrapper">
  <ul class="characters" aria-label="Character Grid">
    {#each grid as c, i}
      <li aria-label={`Character slot ${i}`}>
        <CharacterUnit item={c} position={i} {mainWeaponElement} {partyElement} />
      </li>
    {/each}
  </ul>
</div>

<style lang="scss">
  @use '$src/themes/colors' as *;
  @use '$src/themes/typography' as *;
  @use '$src/themes/spacing' as *;

  .characters {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: $unit-3x;

    & > li { list-style: none; }
  }

  .unit {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $unit;
  }

  .image { width: 100%; height: auto; border: 1px solid $grey-75; border-radius: 8px; display: block; }

  .name {
    font-size: $font-small;
    text-align: center;
    color: $grey-50;
  }
</style>
