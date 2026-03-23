<script lang="ts">
  import type { GridSummon } from '$lib/types/api/party'
  import { usePartyContext } from '$lib/types/party-context'
  import { page } from '$app/stores'
  import { goto } from '$app/navigation'
  import Icon from '$lib/components/Icon.svelte'
  import UnitMenuContainer from '$lib/components/ui/menu/UnitMenuContainer.svelte'
  import MenuItems from '$lib/components/ui/menu/MenuItems.svelte'
  import UncapIndicator from '$lib/components/uncap/UncapIndicator.svelte'
  import { getSummonImage } from '$lib/features/database/detail/image'
  import { getPlaceholderImage, getSummonTransformation } from '$lib/utils/images'
  import { openDetailsSidebar } from '$lib/features/details/openDetailsSidebar.svelte'
  import { sidebar } from '$lib/stores/sidebar.svelte'
  import { getDatabaseUrl, canAccessDatabase } from '$lib/utils/database'
  import { getElementClassName } from '$lib/utils/element'
  import { collectionTeamsPane } from '$lib/stores/collectionTeamsPane.svelte'
  import { GridType } from '$lib/types/enums'
  import * as m from '$lib/paraglide/messages'
  import { localizedName } from '$lib/utils/locale'
  import DuplicateCollectionDialog from '$lib/components/dialogs/DuplicateCollectionDialog.svelte'
  import { findNextEmptySlot, SLOT_NOT_FOUND } from '$lib/utils/gridHelpers'
  import { toast } from 'svelte-sonner'
  import { extractErrorMessage } from '$lib/utils/errors'
  import quickSummonFilled from '$src/assets/icons/quick-summon/filled.svg'
  import quickSummonEmpty from '$src/assets/icons/quick-summon/empty.svg'

  interface Props {
    item?: GridSummon | undefined
    position: number
    notInCollection?: boolean
    inCollection?: boolean
  }

  let { item, position, notInCollection = false, inCollection = false }: Props = $props()

  const ctx = usePartyContext()

  // Use position (not data flags) to determine sizing — position is authoritative
  let isMainSized = $derived(position === -1 || position === 6)

  let imageUrl = $derived.by(() => {
    const variant = isMainSized ? 'main' : 'grid'
    const transformation = getSummonTransformation(item?.summon?.granblueId, item?.uncapLevel, item?.transcendenceStep)
    return getSummonImage(item?.summon?.granblueId, variant, transformation)
  })

  // Check if this item is currently active in the sidebar
  let isActive = $derived(item?.id && sidebar.activeItemId === String(item.id))

  // Check if this slot is currently selected for adding/replacing an item
  let isSelected = $derived(
    ctx?.getSelectedSlot?.() === position &&
      ctx?.getActiveTab?.() === GridType.Summon
  )

  // Determine element class for focus ring
  let elementClass = $derived(getElementClassName(item?.summon?.element))

  async function remove() {
    if (!item?.id) return
    try {
      const party = ctx.getParty()
      const editKey = ctx.getEditKey()
      await ctx.services.gridService.removeSummon(party.id, item.id as any, editKey || undefined)
    } catch (err) {
      console.error('Error removing summon:', err)
      toast.error(extractErrorMessage(err, 'Failed to remove summon'))
    }
  }

  function viewDetails() {
    if (!item) return
    openDetailsSidebar({
      type: 'summon',
      item
    })
  }

  function replace() {
    if (ctx?.openPicker) {
      ctx.openPicker({ type: 'summon', position, item })
    }
  }

  function viewInDatabase() {
    if (!item?.summon?.granblueId) return
    goto(getDatabaseUrl('summon', item.summon.granblueId))
  }

  // Duplicate: find the first empty sub-summon slot (0-3)
  let firstEmptySlot = $derived.by(() => {
    const party = ctx.getParty()
    const occupied = new Set(
      party.summons?.filter((s) => s.position >= 0 && s.position < 4).map((s) => s.position) ?? []
    )
    for (let i = 0; i < 4; i++) {
      if (!occupied.has(i)) return i
    }
    return undefined
  })

  let canDuplicate = $derived(
    !!item && position !== 6 && firstEmptySlot !== undefined
  )

  let duplicateCollectionDialogOpen = $state(false)

  async function duplicate() {
    if (!item?.id || firstEmptySlot === undefined) return
    if (item.collectionSummonId) {
      duplicateCollectionDialogOpen = true
      return
    }
    await executeDuplicate()
  }

  async function executeDuplicate() {
    if (!item?.id || firstEmptySlot === undefined) return
    try {
      await ctx.services.gridService.duplicateSummon(item.id, firstEmptySlot)
      const nextSlot = findNextEmptySlot(ctx.getParty(), GridType.Summon, firstEmptySlot)
      if (nextSlot !== SLOT_NOT_FOUND) {
        ctx.setSelectedSlot?.(nextSlot)
      }
    } catch (err) {
      console.error('Error duplicating summon:', err)
      toast.error(extractErrorMessage(err, 'Failed to duplicate summon'))
    }
  }

  // Quick summon badge — visible on main and grid positions, not friend or subaura
  let showQuickSummon = $derived(item && position !== undefined && position < 4)

  async function toggleQuickSummon(e: MouseEvent) {
    e.stopPropagation()
    if (!item?.id || !ctx?.canEdit()) return
    try {
      await ctx.services.gridService.updateQuickSummon(item.id, !item.quickSummon)
    } catch (err) {
      console.error('Error toggling quick summon:', err)
      toast.error(extractErrorMessage(err, 'Failed to update quick summon'))
    }
  }

  // Check if user can view database (role >= 7)
  let canViewDatabase = $derived(canAccessDatabase($page.data.account?.role))

  // Teams pane state
  let isTeamsPaneOpen = $derived(collectionTeamsPane.isOpen)

  function viewTeamsWithSummon() {
    if (!item?.summon) return
    collectionTeamsPane.openTeamsPaneForEntity(item.summon, 'summon')
  }

  function addSummonToTeamsView() {
    if (!item?.summon) return
    collectionTeamsPane.addEntityToTeamsView(item.summon, 'summon')
  }

</script>

<div class="unit {elementClass}" class:empty={!item} class:is-active={isActive} class:orphaned={item?.orphaned}>
  {#if item}
    <UnitMenuContainer showGearButton={true}>
      {#snippet trigger()}
        <div class="focus-ring-wrapper {elementClass}" class:is-active={isActive} class:editable={ctx?.canEdit()}>
          {#key item?.id ?? position}
            <div
              class="frame summon {elementClass}"
              class:main={position === -1}
              class:friend={position === 6}
              class:cell={!isMainSized}
              class:editable={ctx?.canEdit()}
              class:is-active={isActive}
              class:is-selected={isSelected}
              class:not-in-collection={notInCollection}
              onclick={() => viewDetails()}
            >
            {#if item?.orphaned}
              <div class="orphaned-badge" title={m.tooltip_not_in_collection()}>
                <Icon name="alertTriangle" size={16} />
              </div>
            {/if}
            <img
              class="image {elementClass}"
              class:placeholder={!item?.summon?.granblueId}
              class:not-in-collection={notInCollection}
              alt={localizedName(item?.summon?.name)}
              src={imageUrl}
            />
          </div>
          {/key}
          {#if showQuickSummon && ctx?.canEdit()}
            <button
              class="quick-summon"
              class:active={item?.quickSummon}
              class:main={position === -1}
              onclick={toggleQuickSummon}
            >
              <img class="quick-summon-icon filled" src={quickSummonFilled} alt={m.details_quick_summon()} />
              <img class="quick-summon-icon empty" src={quickSummonEmpty} alt={m.details_quick_summon()} />
            </button>
          {:else if item?.quickSummon}
            <img
              class="quick-summon static"
              class:main={position === -1}
              src={quickSummonFilled}
              alt={m.details_quick_summon()}
            />
          {/if}
        </div>
      {/snippet}

      {#snippet menu(variant: 'context' | 'dropdown')}
        <MenuItems
          {variant}
          onViewDetails={viewDetails}
          onViewInDatabase={canViewDatabase ? viewInDatabase : undefined}
          onViewTeams={viewTeamsWithSummon}
          onAddToTeamsView={isTeamsPaneOpen ? addSummonToTeamsView : undefined}
          onReplace={ctx?.canEdit() ? replace : undefined}
          onDuplicate={ctx?.canEdit() ? duplicate : undefined}
          duplicateDisabled={!canDuplicate}
          onRemove={ctx?.canEdit() ? remove : undefined}
          canEdit={ctx?.canEdit()}
          viewDetailsLabel={m.context_view_details()}
          viewInDatabaseLabel={m.context_view_in_database()}
          viewTeamsLabel={m.context_view_teams_summon()}
          addToTeamsViewLabel={m.context_add_to_teams_view()}
          replaceLabel={m.context_replace({ type: m.type_summon() })}
          duplicateLabel={m.context_duplicate({ type: m.type_summon() })}
          removeLabel={m.context_remove()}
        />
      {/snippet}
    </UnitMenuContainer>
  {:else}
    {#key `empty-${position}`}
      <div
        class="frame summon"
        class:main={position === -1}
        class:friend={position === 6}
        class:cell={!(position === -1 || position === 6)}
        class:editable={ctx?.canEdit()}
        class:is-selected={isSelected}
        onclick={() => ctx?.canEdit() && ctx?.openPicker && ctx.openPicker({ type: 'summon', position, item })}
      >
        <img
          class="image placeholder"
          alt=""
          src={getPlaceholderImage('summon', position === -1 || position === 6 ? 'main' : 'grid')}
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
      type="summon"
      uncapLevel={item.uncapLevel}
      transcendenceStage={item.transcendenceStep}
      flb={item.summon?.uncap?.flb}
      ulb={item.summon?.uncap?.ulb}
      transcendence={item.summon?.uncap?.transcendence}
      editable={ctx?.canEdit()}
      updateUncap={async (level) => {
        if (!item?.id || !ctx) return
        try {
          const editKey = ctx.getEditKey()
          await ctx.services.gridService.updateSummonUncap(item.id, level, undefined, editKey || undefined)
        } catch (err) {
          console.error('Failed to update summon uncap:', err)
          toast.error(extractErrorMessage(err, 'Failed to update uncap level'))
        }
      }}
      updateTranscendence={async (stage) => {
        if (!item?.id || !ctx) return
        try {
          const editKey = ctx.getEditKey()
          // When setting transcendence > 0, also set uncap to max (6)
          const maxUncap = stage > 0 ? 6 : undefined
          await ctx.services.gridService.updateSummonUncap(item.id, maxUncap, stage, editKey || undefined)
        } catch (err) {
          console.error('Failed to update summon transcendence:', err)
          toast.error(extractErrorMessage(err, 'Failed to update transcendence'))
        }
      }}
    />
  {/if}
  <div class="name" class:not-in-collection={notInCollection}>
    {#if item && inCollection}<Icon name="bookmark" width={12} height={16} />{/if}
    {item ? localizedName(item?.summon?.name) : ''}
  </div>
</div>

<DuplicateCollectionDialog
  bind:open={duplicateCollectionDialogOpen}
  onConfirm={async () => {
    duplicateCollectionDialogOpen = false
    await executeDuplicate()
  }}
  onCancel={() => {
    duplicateCollectionDialogOpen = false
  }}
/>

<style lang="scss">
  @use '$src/themes/colors' as colors;
  @use '$src/themes/typography' as typography;
  @use '$src/themes/spacing' as spacing;
  @use '$src/themes/rep' as rep;
  @use '$src/themes/layout' as layout;
  @use '$src/themes/effects' as effects;
  @use '$src/themes/unit' as unit;

  .unit {
    position: relative;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: spacing.$unit;

    &.empty .name {
      display: none;
    }
  }

  .focus-ring-wrapper {
    position: relative;
    display: block;
    transition: transform 0.2s ease-in-out;

    &::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: layout.$input-corner;
      pointer-events: none;
      z-index: effects.$z-sticky;
    }

    &.editable:hover {
      transform: scale(1.05);
    }
  }

  .frame {
    position: relative;
    width: 100%;
    overflow: hidden;
    border-radius: layout.$input-corner;
    background: var(--card-bg, #f5f5f5);
    transition: opacity 0.2s ease-in-out;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    &.editable:hover {
      opacity: 0.95;
      box-shadow: var(--shadow-sm);
    }

    // Slot selection - subtle dark pulsing glow (works for both empty and filled)
    &.is-selected,
    &.is-active {
      animation: pulse-slot-shadow 2s ease-in-out infinite;
    }
  }

  @keyframes pulse-slot-shadow {
    0%, 100% {
      box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.12), 0 0 4px 2px rgba(0, 0, 0, 0.06);
    }
    50% {
      box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.24), 0 0 8px 4px rgba(0, 0, 0, 0.12);
    }
  }

  .frame.summon.main,
  .frame.summon.friend {
    @include rep.aspect(rep.$summon-main-w, rep.$summon-main-h);
  }

  .frame.summon.cell {
    @include rep.aspect(rep.$summon-cell-w, rep.$summon-cell-h);
  }

  .image {
    position: relative;
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    z-index: effects.$z-badge;

    &.placeholder {
      opacity: 0;
    }

    &.not-in-collection {
      opacity: 0.7;
    }
  }

  .frame.not-in-collection::before {
    content: '';
    position: absolute;
    inset: 0;
    border: 2px solid colors.$error;
    box-shadow: inset 0px 0px 4px colors.$error;
    border-radius: inherit;
    z-index: effects.$z-badge;
    pointer-events: none;
  }

  .icon {
    position: absolute;
    z-index: effects.$z-raised;
    color: var(--icon-secondary, #999);
    transition: color 0.2s ease-in-out;
  }

  .frame.editable:hover .icon {
    color: var(--icon-secondary-hover, #666);
  }

  .name {
    font-size: typography.$font-small;
    text-align: center;
    color: var(--text-secondary);

    :global(span) {
      display: inline;
      vertical-align: -4px;
    }

  }

  .orphaned-badge {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 24px;
    height: 24px;
    background: colors.$error;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    z-index: effects.$z-sticky;
    pointer-events: auto;
    cursor: help;
    box-shadow: var(--shadow-sm);
  }

  .quick-summon {
    position: absolute;
    z-index: effects.$z-tooltip;
    top: -2%;
    right: 22%;
    width: spacing.$unit-5x;
    height: spacing.$unit-5x;
    padding: 0;
    border: none;
    background: transparent;
    cursor: pointer;
    transition: transform 0.2s ease;

    &:not(.active):not(.static) {
      display: none;
    }

    &:hover {
      transform: scale(1.1);
    }

    &.main {
      right: 28%;
      width: spacing.$unit-6x;
      height: spacing.$unit-6x;
    }

    &.static {
      cursor: default;
      &:hover {
        transform: none;
      }
    }
  }

  .focus-ring-wrapper:hover .quick-summon:not(.active) {
    display: block;
  }

  .quick-summon-icon {
    width: 100%;
    height: 100%;
    display: block;

    &.filled {
      display: none;
    }

    &.empty {
      display: block;
    }
  }

  .quick-summon.active {
    .quick-summon-icon.filled {
      display: block;
    }

    .quick-summon-icon.empty {
      display: none;
    }

    &:hover {
      .quick-summon-icon.filled {
        display: none;
      }

      .quick-summon-icon.empty {
        display: block;
      }
    }
  }

  .quick-summon:not(.active):hover {
    .quick-summon-icon.filled {
      display: block;
    }

    .quick-summon-icon.empty {
      display: none;
    }
  }

  @include unit.unit-shared-styles;
</style>
