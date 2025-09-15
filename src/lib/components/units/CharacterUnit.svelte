<script lang="ts">
  import type { GridCharacter } from '$lib/types/api/party'
  import type { Party } from '$lib/types/api/party'
  import { getContext } from 'svelte'
  import Icon from '$lib/components/Icon.svelte'

  interface Props {
    item?: GridCharacter
    position: number
    mainWeaponElement?: number | null
    partyElement?: number | null
  }

  let { item, position, mainWeaponElement, partyElement }: Props = $props()

  type PartyCtx = {
    getParty: () => Party
    updateParty: (p: Party) => void
    canEdit: () => boolean
    getEditKey: () => string | null
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
  // Use $derived to ensure consistent computation between server and client
  let imageUrl = $derived(() => {
    // Handle both new structure (item.character) and old structure (item.object) for compatibility
    const characterData = item?.character || (item as any)?.object

    // If no item or no granblueId, return placeholder
    if (!item || !characterData?.granblueId) {
      return '/images/placeholders/placeholder-weapon-grid.png'
    }

    const id = characterData.granblueId
    const uncap = item?.uncapLevel ?? 0
    const transStep = item?.transcendenceStep ?? 0
    let suffix = '01'
    if (transStep > 0) suffix = '04'
    else if (uncap >= 5) suffix = '03'
    else if (uncap > 2) suffix = '02'
    if (String(id) === '3030182000') {
      let element = mainWeaponElement || partyElement || 1
      suffix = `${suffix}_0${element}`
    }
    return `/images/character-main/${id}_${suffix}.jpg`
  })

  async function remove() {
    if (!item?.id) return
    const party = ctx.getParty()
    const editKey = ctx.getEditKey()
    const updated = await ctx.services.gridService.removeCharacter(party.id, item.id as any, editKey || undefined)
    ctx.updateParty(updated)
  }


</script>

<div class="unit" class:empty={!item}>
  {#key (item ? (item as any).id ?? position : `empty-${position}`)}
    <div
      class="frame character cell"
      class:editable={ctx?.canEdit()}
      on:click={() => ctx?.openPicker && ctx.openPicker({ type: 'character', position, item })}
    >
      <img class="image" class:placeholder={!item || !(item?.character?.granblueId || (item as any)?.object?.granblueId)} alt={item ? displayName(item?.character || (item as any)?.object) : ''} src={imageUrl()} />
      {#if !item && ctx?.canEdit()}
        <span class="icon">
          <Icon name="plus" size={24} />
        </span>
      {/if}
      {#if ctx.canEdit() && item?.id}
        <div class="actions">
          <button class="remove" title="Remove" on:click|stopPropagation={remove}>×</button>
        </div>
      {/if}
    </div>
  {/key}
  <div class="name">{item ? displayName(item?.character || (item as any)?.object) : ''}</div>
</div>

<style lang="scss">
  @use '$src/themes/colors' as *;
  @use '$src/themes/typography' as *;
  @use '$src/themes/spacing' as *;
  @use '$src/themes/rep' as rep;

  .unit {
    position: relative;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $unit;

    &.empty .name {
      display: none;
    }
  }

  .frame {
    position: relative;
    width: 100%;
    overflow: hidden;
    border-radius: 8px;
    background: var(--card-bg, #f5f5f5);
    border: 1px solid transparent;
    transition: all 0.2s ease-in-out;
    display: flex;
    align-items: center;
    justify-content: center;

    &.editable {
      cursor: pointer;

      &:hover {
        border-color: var(--primary-color, #0066cc);
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        transform: scale(1.01);
      }
    }
  }

  .frame.character.cell {
    @include rep.aspect(rep.$char-cell-w, rep.$char-cell-h);
  }

  .image {
    position: relative;
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    z-index: 2;

    &.placeholder {
      opacity: 0;
    }
  }

  .icon {
    position: absolute;
    z-index: 1;
    color: var(--icon-secondary, #999);
    transition: color 0.2s ease-in-out;
  }

  .frame.editable:hover .icon {
    color: var(--icon-secondary-hover, #666);
  }

  .name {
    font-size: $font-small;
    text-align: center;
    color: $grey-50;
  }

  .actions {
    position: absolute;
    top: 6px;
    right: 6px;
    display: flex;
    gap: 6px;
    z-index: 3;
  }

  .remove {
    background: rgba(0,0,0,.6);
    color: white;
    border: none;
    border-radius: 12px;
    width: 24px;
    height: 24px;
    line-height: 24px;
    cursor: pointer;
  }
</style>
