<script lang="ts">
  import SummonUnit from '$lib/components/units/SummonUnit.svelte'
  import type { GridSummonItemView } from '$lib/api/schemas/party'

  export let summons: GridSummonItemView[] = []
  export let offset = 4
</script>

<div class="container">
  <h3>Subaura</h3>
  <ul class="grid" id="ExtraSummons">
    {#each [0,1] as i}
      <li>
        <SummonUnit item={summons[offset + i]} position={offset + i} />
      </li>
    {/each}
  </ul>
  
</div>

<style lang="scss">
  @use '$src/themes/colors' as *;
  @use '$src/themes/spacing' as *;
  @use '$src/themes/mixins' as *;

  .container {
    background: var(--subaura-orange-bg);
    border-radius: 8px;
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
      font-weight: 500;
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

