<script lang="ts">
  import type { GridCharacterItemView, PartyView } from '$lib/api/schemas/party'
  import { getContext } from 'svelte'

  export let item: GridCharacterItemView | undefined
  export let position: number
  export let mainWeaponElement: number | null | undefined
  export let partyElement: number | null | undefined

  type PartyCtx = {
    getParty: () => PartyView
    updateParty: (p: PartyView) => void
    canEdit: () => boolean
    services: { gridService: any; partyService: any }
  }
  const ctx = getContext<PartyCtx>('party')

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
    if (String(id) === '3030182000') {
      let element = mainWeaponElement || partyElement || 1
      suffix = `${suffix}_0${element}`
    }
    return `/images/character-main/${id}_${suffix}.jpg`
  }

  async function remove() {
    if (!item?.id) return
    const party = ctx.getParty()
    const editKey = ctx.services.partyService.getEditKey(party.shortcode)
    const updated = await ctx.services.gridService.removeCharacter(party.id, item.id as any, editKey || undefined)
    ctx.updateParty(updated)
  }

  async function add() {
    const party = ctx.getParty()
    const editKey = ctx.services.partyService.getEditKey(party.shortcode)
    const id = window.prompt('Enter character ID to add')
    if (!id) return
    const res = await ctx.services.gridService.addCharacter(party.id, id, position, editKey || undefined)
    if (res.conflicts) {
      window.alert('Conflict detected. Please resolve via UI in a later step.')
      return
    }
    ctx.updateParty(res.party)
  }

  async function replaceItem() {
    if (!item?.id) return add()
    const party = ctx.getParty()
    const editKey = ctx.services.partyService.getEditKey(party.shortcode)
    const id = window.prompt('Enter new character ID')
    if (!id) return
    const res = await ctx.services.gridService.replaceCharacter(party.id, item.id as any, id, editKey || undefined)
    if (res.conflicts) {
      window.alert('Conflict detected. Please resolve via UI in a later step.')
      return
    }
    ctx.updateParty(res.party)
  }
</script>

<div class="unit">
  <img class="image" alt={item ? displayName(item.object) : ''} src={characterImageUrl(item)} />
  <div class="name">{item ? displayName(item.object) : '—'}</div>
  {#if ctx.canEdit() && !item}
    <button class="add" title="Add" on:click={add}>＋</button>
  {/if}
  {#if ctx.canEdit() && item?.id}
    <div class="actions">
      <button class="replace" title="Replace" on:click={replaceItem}>↺</button>
      <button class="remove" title="Remove" on:click={remove}>×</button>
    </div>
  {/if}
  {#if ctx.canEdit() && item?.id}
    <button class="remove" title="Remove" on:click={remove}>×</button>
  {/if}
</div>

<style lang="scss">
  @use '$src/themes/colors' as *;
  @use '$src/themes/typography' as *;
  @use '$src/themes/spacing' as *;

  .unit { position: relative; width: 100%; display: flex; flex-direction: column; align-items: center; gap: $unit; }
  .image { width: 100%; height: auto; border: 1px solid $grey-75; border-radius: 8px; display: block; }
  .name { font-size: $font-small; text-align: center; color: $grey-50; }
  .actions { position: absolute; top: 6px; right: 6px; display: flex; gap: 6px; }
  .remove, .replace, .add { background: rgba(0,0,0,.6); color: white; border: none; border-radius: 12px; width: 24px; height: 24px; line-height: 24px; cursor: pointer; }
  .add { position: absolute; top: 6px; right: 6px; }
</style>
