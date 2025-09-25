<script lang="ts">
  import { getAwakeningImage } from '$lib/utils/modifiers'
  import type { Awakening } from '$lib/types/api/entities'

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

    if ('type' in awakening && awakening.type) {
      return {
        type: awakening.type,
        level: awakening.level || 0
      }
    }

    return {
      type: awakening as Awakening,
      level: 0
    }
  }

  let awakeningData = $derived(getAwakeningData())
  let imageUrl = $derived(getAwakeningImage(awakeningData))
  let displayName = $derived(awakeningData?.type?.name?.en || awakeningData?.type?.name?.ja || 'Awakening')
</script>

{#if awakeningData && imageUrl}
  <div class="awakening-display {size}">
    <img
      src={imageUrl}
      alt={displayName}
      class="awakening-icon"
    />
    <div class="awakening-info">
      <span class="awakening-name">{displayName}</span>
      {#if showLevel && awakeningData.level !== undefined}
        <span class="awakening-level">Lv{awakeningData.level}</span>
      {/if}
    </div>
  </div>
{/if}

<style lang="scss">
  @use '$src/themes/colors' as colors;
  @use '$src/themes/spacing' as spacing;
  @use '$src/themes/typography' as typography;
  @use '$src/themes/layout' as layout;

  .awakening-display {
    display: flex;
    gap: spacing.$unit-2x;
    align-items: center;
    padding: spacing.$unit;
    background: colors.$grey-85;
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
    }

    .awakening-info {
      display: flex;
      flex-direction: column;
      gap: spacing.$unit-half;

      .awakening-name {
        font-size: typography.$font-regular;
        color: var(--text-primary, colors.$grey-10);
        font-weight: typography.$medium;
      }

      .awakening-level {
        font-size: typography.$font-small;
        color: var(--text-secondary, colors.$grey-50);
      }
    }
  }
</style>