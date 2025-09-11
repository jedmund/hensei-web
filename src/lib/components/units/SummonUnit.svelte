<script lang="ts">
  import type { GridSummonItemView, PartyView } from '$lib/api/schemas/party'
  import { getContext } from 'svelte'

  export let item: GridSummonItemView | undefined
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
  function summonImageUrl(s?: GridSummonItemView): string {
    const id = (s as any)?.object?.granblueId
    const isMain = s?.main || s?.position === -1 || s?.friend || s?.position === 6
    if (!id) return isMain ? '/images/placeholders/placeholder-summon-main.png' : '/images/placeholders/placeholder-summon-grid.png'
    const folder = isMain ? 'summon-main' : 'summon-grid'
    return `/images/${folder}/${id}.jpg`
  }

  async function remove() {
    if (!item?.id) return
    const party = ctx.getParty()
    const editKey = ctx.services.partyService.getEditKey(party.shortcode)
    const updated = await ctx.services.gridService.removeSummon(party.id, item.id as any, editKey || undefined)
    ctx.updateParty(updated)
  }

  async function add() {
    const party = ctx.getParty()
    const editKey = ctx.services.partyService.getEditKey(party.shortcode)
    const id = window.prompt('Enter summon ID to add')
    if (!id) return
    const updated = await ctx.services.gridService.addSummon(party.id, id, position, editKey || undefined)
    ctx.updateParty(updated)
  }

  async function replaceItem() {
    if (!item?.id) return add()
    const party = ctx.getParty()
    const editKey = ctx.services.partyService.getEditKey(party.shortcode)
    const id = window.prompt('Enter new summon ID')
    if (!id) return
    const updated = await ctx.services.gridService.replaceSummon(party.id, item.id as any, id, editKey || undefined)
    ctx.updateParty(updated)
  }
</script>

<div class="unit">
  <img class="image" alt={item ? displayName(item.object) : ''} src={summonImageUrl(item)} />
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
  {#if item?.main || position === -1}
    <span class="badge">Main</span>
  {/if}
  {#if item?.friend || position === 6}
    <span class="badge" style="left:auto; right:6px">Friend</span>
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
  .badge { position: absolute; left: 6px; top: 6px; background: #333; color: #fff; font-size: 11px; padding: 2px 6px; border-radius: 10px; }
</style>
