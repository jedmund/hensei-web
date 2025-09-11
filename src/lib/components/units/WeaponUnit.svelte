<script lang="ts">
  import type { GridWeaponItemView, PartyView } from '$lib/api/schemas/party'
  import { getContext } from 'svelte'

  export let item: GridWeaponItemView | undefined
  export let position: number

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

  function weaponImageUrl(w?: GridWeaponItemView): string {
    const id = (w as any)?.object?.granblueId
    const isMain = !!(w && ((w as any).mainhand || (w as any).position === -1))
    if (!id) return isMain
      ? '/images/placeholders/placeholder-weapon-main.png'
      : '/images/placeholders/placeholder-weapon-grid.png'

    const folder = isMain ? 'weapon-main' : 'weapon-grid'
    const objElement = (w as any)?.object?.element
    const instElement = (w as any)?.element
    if (objElement === 0 && instElement) {
      return `/images/${folder}/${id}_${instElement}.jpg`
    }
    return `/images/${folder}/${id}.jpg`
  }

  async function remove() {
    if (!item?.id) return
    const party = ctx.getParty()
    const editKey = ctx.services.partyService.getEditKey(party.shortcode)
    const updated = await ctx.services.gridService.removeWeapon(party.id, item.id as any, editKey || undefined)
    ctx.updateParty(updated)
  }

  async function add() {
    const party = ctx.getParty()
    const editKey = ctx.services.partyService.getEditKey(party.shortcode)
    const id = window.prompt('Enter weapon ID to add')
    if (!id) return
    const res = await ctx.services.gridService.addWeapon(party.id, id, position, editKey || undefined)
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
    const id = window.prompt('Enter new weapon ID')
    if (!id) return
    const res = await ctx.services.gridService.replaceWeapon(party.id, item.id as any, id, editKey || undefined)
    if (res.conflicts) {
      window.alert('Conflict detected. Please resolve via UI in a later step.')
      return
    }
    ctx.updateParty(res.party)
  }
</script>

<div class="unit">
  <img class="image" alt={item ? displayName(item.object) : ''} src={weaponImageUrl(item)} />
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
  {#if (item as any)?.mainhand || position === -1}
    <span class="badge">Main</span>
  {/if}
</div>

<style lang="scss">
  @use '$src/themes/colors' as *;
  @use '$src/themes/typography' as *;
  @use '$src/themes/spacing' as *;

  .unit {
    position: relative;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $unit;
  }
  .image { width: 100%; height: auto; border: 1px solid $grey-75; border-radius: 8px; display: block; }
  .name { font-size: $font-small; text-align: center; color: $grey-50; }
  .actions { position: absolute; top: 6px; right: 6px; display: flex; gap: 6px; }
  .remove, .replace, .add {
    background: rgba(0,0,0,.6);
    color: white;
    border: none;
    border-radius: 12px;
    width: 24px; height: 24px; line-height: 24px;
    cursor: pointer;
  }
  .add { position: absolute; top: 6px; right: 6px; }
  .badge {
    position: absolute;
    left: 6px; top: 6px;
    background: #333; color: #fff;
    font-size: 11px; padding: 2px 6px; border-radius: 10px;
  }
</style>
