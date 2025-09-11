<script lang="ts">
  import { getContext } from 'svelte'
  import type { PartyView } from '$lib/api/schemas/party'

  export let item: any | undefined
  export let position: number // 1..3

  type PartyCtx = {
    getParty: () => PartyView
    updateParty: (p: PartyView) => void
    canEdit: () => boolean
    services: { partyService: any }
  }
  const ctx = getContext<PartyCtx>('party')

  function displayName(input: any): string {
    if (!input) return '—'
    const maybe = input.name ?? input
    if (typeof maybe === 'string') return maybe
    if (maybe && typeof maybe === 'object') return maybe.en || maybe.ja || '—'
    return '—'
  }

  function guidebookImageUrl(g?: any): string {
    const id = g?.granblueId
    if (!id) return '/images/placeholders/placeholder-weapon-grid.png'
    return `/images/guidebooks/book_${id}.png`
  }

  async function remove() {
    const party = ctx.getParty()
    const editKey = ctx.services.partyService.getEditKey(party.shortcode)
    const updated = await ctx.services.partyService.updateGuidebooks(party.id, position - 1, null, editKey || undefined)
    ctx.updateParty(updated)
  }

  async function add() {
    const party = ctx.getParty()
    const editKey = ctx.services.partyService.getEditKey(party.shortcode)
    const id = window.prompt('Enter guidebook ID to add')
    if (!id) return
    const updated = await ctx.services.partyService.updateGuidebooks(party.id, position - 1, id, editKey || undefined)
    ctx.updateParty(updated)
  }
</script>

<div class="unit">
  <img class="image" alt={item ? displayName(item) : ''} src={guidebookImageUrl(item)} />
  <div class="name">{item ? displayName(item) : '—'}</div>
  {#if ctx.canEdit() && !item}
    <button class="add" title="Add" on:click={add}>＋</button>
  {/if}
  {#if ctx.canEdit() && item}
    <button class="remove" title="Remove" on:click={remove}>×</button>
  {/if}
</div>

<style lang="scss">
  @use '$src/themes/colors' as *;
  @use '$src/themes/typography' as *;
  @use '$src/themes/spacing' as *;

  .unit { position: relative; width: 100%; display: flex; flex-direction: column; align-items: center; gap: $unit; }
  .image { width: 100%; height: auto; border: 1px solid $grey-75; border-radius: 8px; display: block; background: var(--extra-purple-card-bg); }
  .name { font-size: $font-small; text-align: center; color: $grey-50; }
  .remove, .add { position: absolute; top: 6px; right: 6px; background: rgba(0,0,0,.6); color: white; border: none; border-radius: 12px; width: 24px; height: 24px; line-height: 24px; cursor: pointer; }
  .add { right: 6px; }
</style>

