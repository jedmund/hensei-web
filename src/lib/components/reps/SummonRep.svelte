<script lang="ts">
  import type { PartyView, GridSummonItemView } from '$lib/api/schemas/party'

  export let party: PartyView

  const summons = party.summons || []
  const main = summons.find((s: any) => s?.main || s?.position === -1)
  const grid = Array.from({ length: 4 }, (_, i) => summons.find((s: any) => s?.position === i))

  function summonImageUrl(s?: any, isMain = false): string {
    const id = s?.object?.granblueId
    if (!id) return ''
    const folder = isMain ? 'summon-main' : 'summon-grid'
    return `/images/${folder}/${id}.jpg`
  }
</script>

<div class="rep">
  <div class="mainSummon">{#if main}<img alt="Main Summon" src={summonImageUrl(main, true)} />{/if}</div>
  <ul class="summons">
    {#each grid as s, i}
      <li class="summon">{#if s}<img alt="Summon" src={summonImageUrl(s)} />{/if}</li>
    {/each}
  </ul>
</div>

<style lang="scss">
  @use '$src/themes/spacing' as *;

  .rep {
    aspect-ratio: 2/1.045;
    border-radius: 10px;
    display: grid;
    grid-template-columns: 1fr 2.25fr;
    grid-gap: $unit-half;
    height: $rep-height;
    opacity: .5;
  }
  .summon, .mainSummon { background: var(--card-bg); border-radius: 4px; }
  .mainSummon { aspect-ratio: 56/97; display: grid; }
  .summons { display: grid; grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(2, 1fr); gap: $unit-half; }
  .summon { aspect-ratio: 184/138; display: grid; }
  .summon img, .mainSummon img { border-radius: 4px; width: 100%; height: 100%; }
</style>

