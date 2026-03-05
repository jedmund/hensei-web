<script lang="ts">
  import SummonUnit from '$lib/components/units/SummonUnit.svelte'
  import type { GridSummon } from '$lib/types/api/party'

  interface Props {
    summons?: GridSummon[]
    offset?: number
  }

  let { summons = [], offset = 4 }: Props = $props()

  // Find summons by position (4 and 5 for subaura)
  let subauraSlots = $derived(() => {
    return [
      summons.find(s => s.position === offset),
      summons.find(s => s.position === offset + 1)
    ]
  })
</script>

<div class="container">
  <h3>Subaura Summons</h3>
  <ul class="grid" id="ExtraSummons">
    {#each subauraSlots() as summon, i}
      <li>
        <SummonUnit item={summon} position={offset + i} />
      </li>
    {/each}
  </ul>

</div>

<style lang="scss">
  @use '$src/themes/colors' as *;
  @use '$src/themes/spacing' as *;
  @use '$src/themes/mixins' as *;
  @use '$src/themes/layout' as layout;
  @use '$src/themes/typography' as typography;

  .container {
    background: var(--subaura-orange-bg);
    border-radius: layout.$input-corner;
    box-sizing: border-box;
    display: grid;
    grid-template-columns: 2.32fr 2fr;
    justify-content: center;
    margin: 20px auto;
    max-width: calc($grid-width + 20px);
    padding: $unit-3x $unit-3x $unit-3x 0;
    position: relative;
    left: 9px;

    @include breakpoint(tablet) {
      left: auto;
      max-width: $grid-width;
      padding: $unit-2x;
      width: 100%;
    }

    @include breakpoint(phone) {
      display: flex;
      gap: $unit-2x;
      padding: $unit-2x;
      flex-direction: column;

      #ExtraSummons {
        max-width: 50vw;
        margin: 0 auto;
      }
    }

    h3 {
      color: var(--subaura-orange-text);
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1.2;
      font-weight: typography.$medium;
      text-align: center;
    }

    .grid {
      display: grid;
      gap: $unit-3x;
      grid-template-columns: repeat(2, minmax(0, 1fr));

      @include breakpoint(tablet) { gap: $unit-2x; }
      @include breakpoint(phone) { gap: $unit; }

      & > li { list-style: none; min-height: 0; }
    }
  }
</style>

