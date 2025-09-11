<script lang="ts">
  import type { PartyView } from '$lib/api/schemas/party'
  export let party: PartyView

  const characters = party.characters || []
  const grid = Array.from({ length: 3 }, (_, i) => characters.find((c: any) => c?.position === i))

  function protagonistClass(): string {
    const main = (party.weapons || []).find((w: any) => w?.mainhand || w?.position === -1)
    const el = (main as any)?.element || (main as any)?.object?.element
    switch (el) { case 1: return 'wind'; case 2: return 'fire'; case 3: return 'water'; case 4: return 'earth'; case 5: return 'dark'; case 6: return 'light'; default: return '' }
  }

  function characterImageUrl(c?: any): string {
    const id = c?.object?.granblueId
    if (!id) return ''
    const uncap = c?.uncapLevel ?? 0
    const trans = c?.transcendenceStep ?? 0
    let suffix = '01'
    if (trans > 0) suffix = '04'
    else if (uncap >= 5) suffix = '03'
    else if (uncap > 2) suffix = '02'
    if (String(id) === '3030182000') {
      const main = (party.weapons || []).find((w: any) => w?.mainhand || w?.position === -1)
      const el = (main as any)?.element || (main as any)?.object?.element || 1
      suffix = `${suffix}_0${el}`
    }
    return `/images/character-main/${id}_${suffix}.jpg`
  }
</script>

<div class="rep">
  <ul class="characters">
    <li class={`protagonist ${protagonistClass()}`}></li>
    {#each grid as c, i}
      <li class="character">{#if c}<img alt="Character" src={characterImageUrl(c)} />{/if}</li>
    {/each}
  </ul>
</div>

<style lang="scss">
  @use '$src/themes/spacing' as *;

  .rep { aspect-ratio: 2/0.99; border-radius: 10px; grid-gap: $unit-half; height: $rep-height; opacity: .5; }
  .character, .protagonist { aspect-ratio: 16/33; background: var(--card-bg); border-radius: 4px; box-sizing: border-box; display: grid; overflow: hidden; }
  .character img { border-radius: 4px; width: 100%; }
  .characters { display: grid; grid-template-columns: repeat(4, 1fr); gap: $unit-half; }
  .protagonist { border-color: transparent; border-width: 1px; border-style: solid; aspect-ratio: 32/66; }
  .protagonist img { position: relative; width: 100%; height: 100%; }
  .protagonist.wind { background: var(--wind-portrait-bg); border-color: var(--wind-bg); }
  .protagonist.fire { background: var(--fire-portrait-bg); border-color: var(--fire-bg); }
  .protagonist.water { background: var(--water-portrait-bg); border-color: var(--water-bg); }
  .protagonist.earth { background: var(--earth-portrait-bg); border-color: var(--earth-bg); }
  .protagonist.light { background: var(--light-portrait-bg); border-color: var(--light-bg); }
  .protagonist.dark { background: var(--dark-portrait-bg); border-color: var(--dark-bg); }
  .protagonist.empty { background: var(--card-bg); }
</style>

