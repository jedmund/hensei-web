<script lang="ts">
  import { getAwakeningImage } from '$lib/utils/modifiers'
  import type { Awakening } from '$lib/types/api/entities'
  import { localizedName } from '$lib/utils/locale'
  import * as m from '$lib/paraglide/messages'

  interface Props {
    awakening?: {
      type?: Awakening
      level?: number
    } | Awakening
    size?: 'small' | 'medium' | 'large'
    showLevel?: boolean
  }

  let {
    awakening,
    size = 'medium',
    showLevel = true
  }: Props = $props()

  function getAwakeningData() {
    if (!awakening) return null

    // Check if it's the awakening object with type and level
    if (typeof awakening === 'object' && 'type' in awakening) {
      return {
        type: awakening.type,
        level: awakening.level ?? 0
      }
    }

    // Otherwise it's just the Awakening type itself
    return {
      type: awakening as Awakening,
      level: 0
    }
  }

  let awakeningData = $derived(getAwakeningData())
  let imageUrl = $derived(getAwakeningImage(awakeningData ?? undefined))
  let displayName = $derived(awakeningData?.type?.name ? localizedName(awakeningData.type.name) : m.details_awakening())
</script>

{#if awakeningData}
  <div class="awakening-display {size}">
    {#if imageUrl}
      <img
        src={imageUrl}
        alt={displayName}
        class="awakening-icon"
      />
    {:else}
      <div class="awakening-icon placeholder"></div>
    {/if}
    <div class="awakening-info">
      <span class="awakening-name">{displayName}</span>
      {#if showLevel && awakeningData.level !== undefined}
        <span class="awakening-level">Lv{awakeningData.level}</span>
      {/if}
    </div>
  </div>
{/if}

<style lang="scss">
  @use '$src/themes/spacing' as spacing;
  @use '$src/themes/typography' as typography;
  @use '$src/themes/layout' as layout;

  .awakening-display {
    display: flex;
    gap: spacing.$unit-2x;
    align-items: center;
    padding: spacing.$unit;
    background: var(--unit-bg);
    border-radius: layout.$item-corner-small;

    &.small .awakening-icon {
      width: spacing.$unit-4x;
      height: spacing.$unit-4x;
    }

    &.medium .awakening-icon {
      width: spacing.$unit-6x;
      height: spacing.$unit-6x;
    }

    &.large .awakening-icon {
      width: spacing.$unit-8x;
      height: spacing.$unit-8x;
    }

    .awakening-icon {
      border-radius: layout.$item-corner-small;
      flex-shrink: 0;

      &.placeholder {
        background: var(--separator-bg);
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }

    .awakening-info {
      display: flex;
      flex-direction: column;
      gap: spacing.$unit-half;

      .awakening-name {
        font-size: typography.$font-regular;
        color: var(--text-primary);
        font-weight: typography.$medium;
      }

      .awakening-level {
        font-size: typography.$font-small;
        color: var(--text-secondary);
      }
    }
  }
</style>