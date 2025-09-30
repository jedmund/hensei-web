<script lang="ts">
  import type { GridWeapon } from '$lib/types/api/party'
  import type { Party } from '$lib/types/api/party'
  import { getContext } from 'svelte'
  import Icon from '$lib/components/Icon.svelte'
  import ContextMenu from '$lib/components/ui/ContextMenu.svelte'
  import { ContextMenu as ContextMenuBase } from 'bits-ui'
  import UncapIndicator from '$lib/components/uncap/UncapIndicator.svelte'
  import { getWeaponImage } from '$lib/features/database/detail/image'
  import { openDetailsSidebar } from '$lib/features/details/openDetailsSidebar.svelte'
  import { getAwakeningImage, getWeaponKeyImages, getAxSkillImages } from '$lib/utils/modifiers'

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

  // Get awakening image URL using utility
  let awakeningImage = $derived(getAwakeningImage(item?.awakening))

  // Get weapon key images using utility
  let weaponKeyImages = $derived(
    getWeaponKeyImages(
      item?.weaponKeys,
      item?.weapon?.element,
      item?.weapon?.proficiency,
      item?.weapon?.series,
      item?.weapon?.name
    )
  )

  // Get AX skill images using utility
  let axSkillImages = $derived(getAxSkillImages(item?.ax))

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
    if (!item) return
    openDetailsSidebar({
      type: 'weapon',
      item
    })
  }

  function replace() {
    if (ctx?.openPicker) {
      ctx.openPicker({ type: 'weapon', position, item })
    }
  }


</script>

<div class="unit" class:empty={!item} class:extra={position >= 9}>
  {#if item}
    <ContextMenu>
      {#snippet children()}
        {#key item?.id ?? position}
          <div
            class="frame weapon"
            class:main={item?.mainhand || position === -1}
            class:cell={!(item?.mainhand || position === -1)}
            class:extra={position >= 9}
            class:editable={ctx?.canEdit()}
            onclick={() => viewDetails()}
          >
            <div class="modifiers">
              {#if awakeningImage}
                <img
                  class="awakening"
                  src={awakeningImage}
                  alt={`${item?.awakening?.type?.name?.en || 'Awakening'} Lv${item?.awakening?.level || 0}`}
                />
              {/if}
              <div class="skills">
                {#each axSkillImages as skill}
                  <img class="skill" src={skill.url} alt={skill.alt} />
                {/each}
                {#each weaponKeyImages as skill}
                  <img class="skill" src={skill.url} alt={skill.alt} />
                {/each}
              </div>
            </div>
            <img
              class="image"
              class:placeholder={!item?.weapon?.granblueId}
              alt={displayName(item?.weapon)}
              src={imageUrl}
            />
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
        class:extra={position >= 9}
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

    &.extra {
      .frame {
        background: var(--extra-purple-card-bg);
      }

      .icon {
        color: var(--extra-purple-secondary);
      }

      &:hover .icon {
        color: var(--extra-purple-primary);
      }

      .name {
        font-weight: $medium;
        color: var(--extra-purple-text);
      }
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
    cursor: pointer;

    &:hover {
      opacity: 0.95;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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

  .modifiers {
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: 3;
    pointer-events: none;

    .awakening {
      position: absolute;
      width: 30%;
      height: auto;
    }

    .skills {
      position: absolute;
      display: flex;
      gap: calc($unit / 4);
      padding: calc($unit / 2);

      .skill {
        width: 20%;
        height: auto;
      }
    }
  }

  // Position modifiers for grid weapons
  .frame.weapon.cell {
    .awakening {
      top: 14%;
      left: -3.5%;
    }

    .skills {
      bottom: 2%;
      right: 2%;
      justify-content: flex-end;
    }
  }

  // Position modifiers for main weapons
  .frame.weapon.main {
    .awakening {
      width: 40%;
      top: 67%;
      left: -3.5%;
    }

    .skills {
      bottom: 12%;
      right: -3.5%;
      justify-content: flex-end;

      .skill {
        width: 25%;
      }
    }
  }
</style>
