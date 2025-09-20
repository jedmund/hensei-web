<script lang="ts">
  import type { GridWeapon } from '$lib/types/api/party'
  import type { Party } from '$lib/types/api/party'
  import { getContext } from 'svelte'
  import Icon from '$lib/components/Icon.svelte'
  import ContextMenu from '$lib/components/ui/ContextMenu.svelte'
  import { ContextMenu as ContextMenuBase } from 'bits-ui'
  import UncapIndicator from '$lib/components/uncap/UncapIndicator.svelte'
  import { getWeaponImage } from '$lib/features/database/detail/image'

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
  let imageUrl = $derived.by(() => {
    const isMain = position === -1 || item?.mainhand
    const variant = isMain ? 'main' : 'grid'

    // For weapons with null element that have an instance element, use it
    const element = (item?.weapon?.element === 0 && item?.element) ? item.element : undefined

    return getWeaponImage(item?.weapon?.granblueId, variant, element)
  })

  async function remove() {
    if (!item?.id) return
    try {
      const party = ctx.getParty()
      const editKey = ctx.getEditKey()
      const updated = await ctx.services.gridService.removeWeapon(party.id, item.id as any, editKey || undefined)
      if (updated) {
        ctx.updateParty(updated)
      }
    } catch (err) {
      console.error('Error removing weapon:', err)
    }
  }

  function viewDetails() {
    // TODO: Implement view details modal
    console.log('View details for:', item)
  }

  function replace() {
    if (ctx?.openPicker) {
      ctx.openPicker({ type: 'weapon', position, item })
    }
  }


</script>

<div class="unit" class:empty={!item}>
  {#if item}
    <ContextMenu>
      {#snippet children()}
        {#key item?.id ?? position}
          <div
            class="frame weapon"
            class:main={item?.mainhand || position === -1}
            class:cell={!(item?.mainhand || position === -1)}
            class:editable={ctx?.canEdit()}
          >
            <img
              class="image"
              class:placeholder={!item?.weapon?.granblueId}
              alt={displayName(item?.weapon)}
              src={imageUrl}
            />
            {#if ctx?.canEdit() && item?.id}
              <div class="actions">
                <button class="remove" title="Remove" onclick={(e) => { e.stopPropagation(); remove() }}>×</button>
              </div>
            {/if}
            {#if item?.mainhand || position === -1}
              <span class="badge">Main</span>
            {/if}
          </div>
        {/key}
      {/snippet}

      {#snippet menu()}
        <ContextMenuBase.Item class="context-menu-item" onclick={viewDetails}>
          View Details
        </ContextMenuBase.Item>
        {#if ctx?.canEdit()}
          <ContextMenuBase.Item class="context-menu-item" onclick={replace}>
            Replace
          </ContextMenuBase.Item>
          <ContextMenuBase.Separator class="context-menu-separator" />
          <ContextMenuBase.Item class="context-menu-item danger" onclick={remove}>
            Remove
          </ContextMenuBase.Item>
        {/if}
      {/snippet}
    </ContextMenu>
  {:else}
    {#key `empty-${position}`}
      <div
        class="frame weapon"
        class:main={position === -1}
        class:cell={position !== -1}
        class:editable={ctx?.canEdit()}
        onclick={() => ctx?.canEdit() && ctx?.openPicker && ctx.openPicker({ type: 'weapon', position, item })}
      >
        <img
          class="image placeholder"
          alt=""
          src={position === -1 ? '/images/placeholders/placeholder-weapon-main.png' : '/images/placeholders/placeholder-weapon-grid.png'}
        />
        {#if ctx?.canEdit()}
          <span class="icon">
            <Icon name="plus" size={24} />
          </span>
        {/if}
      </div>
    {/key}
  {/if}
  {#if item}
    <UncapIndicator
      type="weapon"
      uncapLevel={item.uncapLevel}
      transcendenceStage={item.transcendenceStep}
      flb={item.weapon?.uncap?.flb}
      ulb={item.weapon?.uncap?.ulb}
      transcendence={item.weapon?.uncap?.transcendence}
      editable={ctx?.canEdit()}
      updateUncap={async (level) => {
        if (!item?.id || !ctx) return
        try {
          const editKey = ctx.getEditKey()
          const updated = await ctx.services.gridService.updateWeaponUncap(item.id, level, undefined, editKey || undefined)
          if (updated) {
            ctx.updateParty(updated)
          }
        } catch (err) {
          console.error('Failed to update weapon uncap:', err)
          // TODO: Show user-friendly error notification
        }
      }}
      updateTranscendence={async (stage) => {
        if (!item?.id || !ctx) return
        try {
          const editKey = ctx.getEditKey()
          // When setting transcendence > 0, also set uncap to max (6)
          const maxUncap = stage > 0 ? 6 : undefined
          const updated = await ctx.services.gridService.updateWeaponUncap(item.id, maxUncap, stage, editKey || undefined)
          if (updated) {
            ctx.updateParty(updated)
          }
        } catch (err) {
          console.error('Failed to update weapon transcendence:', err)
          // TODO: Show user-friendly error notification
        }
      }}
    />
  {/if}
  <div class="name">{item ? displayName(item?.weapon) : ''}</div>
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
