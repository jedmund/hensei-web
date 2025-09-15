<script lang="ts">
  import type { GridWeapon } from '$lib/types/api/party'
  import type { Party } from '$lib/types/api/party'
  import { getContext } from 'svelte'
  import Icon from '$lib/components/Icon.svelte'

  interface Props {
    item?: GridWeapon
    position: number
  }

  let { item, position }: Props = $props()

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
    // Check position first for main weapon determination
    const isMain = position === -1 || item?.mainhand

    // Handle both new structure (item.weapon) and old structure (item.object) for compatibility
    const weaponData = item?.weapon || (item as any)?.object

    // If no item or no granblueId, return placeholder
    if (!item || !weaponData?.granblueId) {
      return isMain
        ? '/images/placeholders/placeholder-weapon-main.png'
        : '/images/placeholders/placeholder-weapon-grid.png'
    }

    const id = weaponData.granblueId
    const folder = isMain ? 'weapon-main' : 'weapon-grid'
    const objElement = weaponData?.element
    const instElement = item?.element

    if (objElement === 0 && instElement) {
      return `/images/${folder}/${id}_${instElement}.jpg`
    }
    return `/images/${folder}/${id}.jpg`
  })

  async function remove() {
    if (!item?.id) return
    const party = ctx.getParty()
    const editKey = ctx.getEditKey()
    const updated = await ctx.services.gridService.removeWeapon(party.id, item.id as any, editKey || undefined)
    ctx.updateParty(updated)
  }


</script>

<div class="unit" class:empty={!item}>
  {#key (item ? (item as any).id ?? position : `empty-${position}`)}
    <div
      class="frame weapon"
      class:main={item?.mainhand || position === -1}
      class:cell={!(item?.mainhand || position === -1)}
      class:editable={ctx?.canEdit()}
      on:click={() => ctx?.openPicker && ctx.openPicker({ type: 'weapon', position, item })}
    >
      <img class="image" class:placeholder={!item || !(item?.weapon?.granblueId || (item as any)?.object?.granblueId)} alt={item ? displayName(item?.weapon || (item as any)?.object) : ''} src={imageUrl()} />
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
      {#if item?.mainhand || position === -1}
        <span class="badge">Main</span>
      {/if}
    </div>
  {/key}
  <div class="name">{item ? displayName(item?.weapon || (item as any)?.object) : ''}</div>
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
        transform: scale(1.02);
      }
    }

    &.weapon.main.editable:hover {
      transform: scale(1.01);
    }
  }

  .frame.weapon.main { @include rep.aspect(rep.$weapon-main-w, rep.$weapon-main-h); }
  .frame.weapon.cell { @include rep.aspect(rep.$weapon-cell-w, rep.$weapon-cell-h); }

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

  .badge {
    position: absolute;
    left: 6px;
    top: 6px;
    background: #333;
    color: #fff;
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 10px;
    z-index: 3;
  }
</style>
