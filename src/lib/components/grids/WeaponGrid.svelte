<svelte:options runes={true} />

<script lang="ts">
  import type { GridWeapon } from '$lib/types/api/party'

  interface Props {
    weapons?: GridWeapon[]
    raidExtra?: boolean
    showGuidebooks?: boolean
    guidebooks?: Record<string, any>
  }

  let {
    weapons = [],
    raidExtra = undefined,
    showGuidebooks = undefined,
    guidebooks = undefined
  }: Props = $props()

  import WeaponUnit from '$lib/components/units/WeaponUnit.svelte'
  import ExtraWeapons from '$lib/components/extra/ExtraWeaponsGrid.svelte'
  import Guidebooks from '$lib/components/extra/GuidebooksGrid.svelte'

  let mainhand = $derived(weapons.find((w) => (w as any).mainhand || w.position === -1))
  let grid = $derived(Array.from({ length: 9 }, (_, i) => weapons.find((w) => w.position === i)))
</script>

<div class="wrapper">
  <div class="grid">
    <div aria-label="Mainhand Weapon">
      <WeaponUnit item={mainhand} position={-1} />
    </div>

    <ul class="weapons" aria-label="Weapon Grid">
      {#each grid as w, i}
        <li class:Empty={!w} aria-label={`Weapon slot ${i}`}>
          <WeaponUnit item={w} {i} position={i} />
        </li>
      {/each}
    </ul>
  </div>
  {#if raidExtra}
    <ExtraWeapons weapons={weapons} offset={9} />
  {/if}
  {#if showGuidebooks}
    <Guidebooks {guidebooks} />
  {/if}
</div>

<style lang="scss">
  @use '$src/themes/colors' as *;
  @use '$src/themes/typography' as *;
  @use '$src/themes/spacing' as *;
  @use '$src/themes/mixins' as *;

  .wrapper {
    align-items: center;
    display: flex;
    flex-direction: column;
    justify-content: center;

    @include breakpoint(phone) {
      margin: 0 2px;
    }

    .grid {
      display: grid;
      gap: $unit-3x;
      grid-template-columns: 1.278fr 3fr;
      justify-items: center;
      grid-template-areas: 'mainhand grid';
      max-width: $grid-width;

      @include breakpoint(tablet) {
        gap: $unit-2x;
      }

      @include breakpoint(phone) {
        gap: $unit;
      }

      .weapons {
        display: grid; /* make the right-images container a grid */
        grid-template-columns: repeat(
          3,
          minmax(0, 1fr)
        ); /* create 3 columns, each taking up 1 fraction */
        grid-template-rows: repeat(
          3,
          1fr
        ); /* create 3 rows, each taking up 1 fraction */
        gap: $unit-3x;

        @include breakpoint(tablet) {
          gap: $unit-2x;
        }

        @include breakpoint(phone) {
          gap: $unit;
        }

        & > li {
          list-style: none;
        }
      }
    }
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
