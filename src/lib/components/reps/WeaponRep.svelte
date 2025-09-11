<script lang="ts">
  import type { PartyView, GridWeaponItemView } from '$lib/api/schemas/party'

  export let party: PartyView

  const weapons = party.weapons || []
  const mainhand: GridWeaponItemView | undefined = weapons.find((w: any) => w?.mainhand || w?.position === -1)
  const grid = Array.from({ length: 9 }, (_, i) => weapons.find((w: any) => w?.position === i))

  function weaponImageUrl(w?: any, isMain = false): string {
    const id = w?.object?.granblueId
    if (!id) return ''
    const folder = isMain ? 'weapon-main' : 'weapon-grid'
    const objElement = w?.object?.element
    const instElement = w?.element
    if (objElement === 0 && instElement) return `/images/${folder}/${id}_${instElement}.jpg`
    return `/images/${folder}/${id}.jpg`
  }
</script>

<div class="rep">
  <div class="mainhand">{#if mainhand}<img alt="Mainhand" src={weaponImageUrl(mainhand, true)} />{/if}</div>
  <ul class="weapons">
    {#each grid as w, i}
      <li class="weapon">{#if w}<img alt="Weapon" src={weaponImageUrl(w)} />{/if}</li>
    {/each}
  </ul>
  
</div>

<style lang="scss">
  @use '$src/themes/spacing' as *;
  @use '$src/themes/colors' as *;

  .rep {
    height: $rep-height;
    display: grid;
    grid-template-columns: calc(#{$rep-height} * (200 / 420)) auto;
    gap: $unit-half;
    box-sizing: border-box;
  }
  .mainhand { background: var(--card-bg); border-radius: 4px; height: 100%; width: 100%; overflow: hidden; }
  .mainhand img { width: 100%; height: 100%; object-fit: contain; }

  .weapons { margin: 0; padding: 0; list-style: none; height: 100%; display: grid; grid-template-rows: repeat(3, calc((#{$rep-height} - (2 * #{$unit-half})) / 3)); grid-template-columns: repeat(3, calc((#{$rep-height} - (2 * #{$unit-half})) / 3 * (280 / 160))); gap: $unit-half; }
  .weapon { background: var(--card-bg); border-radius: 4px; overflow: hidden; display: flex; align-items: center; justify-content: center; }
  .weapon img { width: 100%; height: 100%; }
</style>

