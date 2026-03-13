<script lang="ts">
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

{#if canEdit}
  <button
    class="unit"
    class:empty={!item}
    onclick={() => onclick?.()}
    oncontextmenu={handleContextMenu}
    type="button"
  >
    <img class="image" alt={name} src={imageUrl} />
    <div class="name">{name}</div>
  </button>
{:else}
  <div class="unit" class:empty={!item}>
    <img class="image" alt={name} src={imageUrl} />
    <div class="name">{name}</div>
  </div>
{/if}

<style lang="scss">
  @use '$src/themes/colors' as *;
  @use '$src/themes/typography' as *;
  @use '$src/themes/spacing' as *;
  @use '$src/themes/layout' as layout;

  .unit {
    position: relative;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $unit;
    background: none;
    border: none;
    padding: 0;
    cursor: default;
  }

  button.unit {
    cursor: pointer;

    &:hover .image {
      border-color: var(--accent-primary);
    }

    &.empty {
      .image {
        opacity: 0.5;
      }

      &:hover .image {
        opacity: 0.75;
        border-color: var(--accent-primary);
      }
    }
  }

  .image {
    width: 100%;
    height: auto;
    border: 1px solid $grey-75;
    border-radius: layout.$input-corner;
    display: block;
    background: var(--extra-purple-card-bg);
    transition: border-color 0.15s ease-out, opacity 0.15s ease-out;
  }

  .name {
    font-size: $font-small;
    text-align: center;
    color: var(--text-secondary);
  }
</style>
