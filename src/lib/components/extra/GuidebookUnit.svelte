<script lang="ts">
  import Icon from '$lib/components/Icon.svelte'
  import UnitMenuContainer from '$lib/components/ui/menu/UnitMenuContainer.svelte'
  import MenuItems from '$lib/components/ui/menu/MenuItems.svelte'
  import { getGuidebookImage } from '$lib/utils/images'
  import { localizedName } from '$lib/utils/locale'
  import type { Guidebook } from '$lib/types/api/entities'
  import * as m from '$lib/paraglide/messages'

  interface Props {
    item: Guidebook | undefined
    position: number // 1..3
    canEdit?: boolean
    onclick?: () => void
    onRemove?: () => void
  }

  let { item, position, canEdit = false, onclick, onRemove }: Props = $props()

  const name = $derived(item ? localizedName(item.name) || '—' : '—')
  const imageUrl = $derived(getGuidebookImage(item?.granblueId))

  function replace() {
    onclick?.()
  }

  function remove() {
    onRemove?.()
  }
</script>

<div class="unit" class:empty={!item}>
  {#if item}
    <UnitMenuContainer showGearButton={canEdit}>
      {#snippet trigger()}
        <div class="frame" class:editable={canEdit}>
          <img class="image" alt={name} src={imageUrl} />
        </div>
      {/snippet}

      {#snippet contextMenu()}
        <MenuItems
          onReplace={canEdit ? replace : undefined}
          onRemove={canEdit ? remove : undefined}
          canEdit={canEdit}
          variant="context"
          replaceLabel={m.context_replace({ type: m.type_guidebook() })}
          removeLabel={m.context_remove()}
        />
      {/snippet}

      {#snippet dropdownMenu()}
        <MenuItems
          onReplace={canEdit ? replace : undefined}
          onRemove={canEdit ? remove : undefined}
          canEdit={canEdit}
          variant="dropdown"
          replaceLabel={m.context_replace({ type: m.type_guidebook() })}
          removeLabel={m.context_remove()}
        />
      {/snippet}
    </UnitMenuContainer>
  {:else}
    <div
      class="frame"
      class:editable={canEdit}
      role={canEdit ? 'button' : undefined}
      tabindex={canEdit ? 0 : undefined}
      onclick={() => canEdit && onclick?.()}
      onkeydown={(e) => { if (canEdit && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onclick?.() }}}
    >
      {#if canEdit}
        <span class="icon">
          <Icon name="plus" size={24} />
        </span>
      {/if}
    </div>
  {/if}
  <div class="name">{item ? name : ''}</div>
</div>

<style lang="scss">
  @use '$src/themes/colors' as colors;
  @use '$src/themes/typography' as typography;
  @use '$src/themes/spacing' as spacing;
  @use '$src/themes/layout' as layout;
  @use '$src/themes/rep' as rep;
  @use '$src/themes/effects' as effects;

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

  .frame {
    position: relative;
    width: 100%;
    overflow: hidden;
    border-radius: layout.$input-corner;
    background: var(--extra-purple-card-bg);
    transition: opacity 0.2s ease-in-out;
    display: flex;
    align-items: center;
    justify-content: center;
    @include rep.aspect(rep.$weapon-cell-w, rep.$weapon-cell-h);

    &.editable {
      cursor: pointer;

      &:hover {
        opacity: 0.95;
        box-shadow: var(--shadow-sm);
      }
    }
  }

  .image {
    position: relative;
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    z-index: effects.$z-badge;
  }

  .icon {
    position: absolute;
    z-index: effects.$z-raised;
    color: var(--extra-purple-secondary);
    transition: color 0.2s ease-in-out;
  }

  .frame.editable:hover .icon {
    color: var(--extra-purple-primary);
  }

  .name {
    font-size: typography.$font-small;
    font-weight: typography.$medium;
    text-align: center;
    color: var(--extra-purple-text);
  }
</style>
