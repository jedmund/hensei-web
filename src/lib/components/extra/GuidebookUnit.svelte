<script lang="ts">
  import Icon from '$lib/components/Icon.svelte'
  import { getGuidebookImage } from '$lib/utils/images'
  import { localizedName } from '$lib/utils/locale'
  import type { Guidebook } from '$lib/types/api/entities'

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

  function handleContextMenu(e: MouseEvent) {
    if (!canEdit || !item) return
    e.preventDefault()
    onRemove?.()
  }
</script>

<div class="unit" class:empty={!item}>
  {#if item}
    <div
      class="frame"
      class:editable={canEdit}
      role={canEdit ? 'button' : undefined}
      tabindex={canEdit ? 0 : undefined}
      onclick={() => canEdit && onclick?.()}
      oncontextmenu={handleContextMenu}
      onkeydown={(e) => { if (canEdit && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onclick?.() }}}
    >
      <img class="image" alt={name} src={imageUrl} />
    </div>
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
