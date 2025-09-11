<script lang="ts">
  import type { GridCharacterItemView } from '$lib/api/schemas/party'

  export let characters: GridCharacterItemView[] = []
  export let mainWeaponElement: number | null | undefined = undefined
  export let partyElement: number | null | undefined = undefined

  function displayName(input: any): string {
    if (!input) return '—'
    const maybe = input.name ?? input
    if (typeof maybe === 'string') return maybe
    if (maybe && typeof maybe === 'object') return maybe.en || maybe.ja || '—'
    return '—'
  }
  function characterImageUrl(c?: GridCharacterItemView): string {
    const id = (c as any)?.object?.granblueId
    if (!id) return '/images/placeholders/placeholder-weapon-grid.png'

    const uncap = (c as any)?.uncapLevel ?? 0
    const transStep = (c as any)?.transcendenceStep ?? 0
    let suffix = '01'
    if (transStep > 0) suffix = '04'
    else if (uncap >= 5) suffix = '03'
    else if (uncap > 2) suffix = '02'

    // Lyria special case (3030182000): append element
    if (String(id) === '3030182000') {
      let element = mainWeaponElement || partyElement || 1
      suffix = `${suffix}_0${element}`
    }

    return `/images/character-main/${id}_${suffix}.jpg`
  }

  import CharacterUnit from '$lib/components/units/CharacterUnit.svelte'
  const grid = Array.from({ length: 5 }, (_, i) => characters.find((c) => c.position === i))
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
