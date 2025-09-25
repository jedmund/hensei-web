<script lang="ts">
  import UncapIndicator from '$lib/components/uncap/UncapIndicator.svelte'
  import { formatUncapLevel, formatTranscendenceStep } from '$lib/utils/modificationFormatters'
  import StatModifierItem from './StatModifierItem.svelte'

  interface Props {
    type: 'character' | 'weapon' | 'summon'
    uncapLevel?: number | null
    transcendenceStep?: number | null
    maxUncap?: number
    special?: boolean
    flb?: boolean
    ulb?: boolean
    transcendence?: boolean
    showIndicator?: boolean
  }

  let {
    type,
    uncapLevel = 0,
    transcendenceStep = 0,
    maxUncap = 3,
    special = false,
    flb = false,
    ulb = false,
    transcendence = false,
    showIndicator = true
  }: Props = $props()

  function getMaxPossibleUncap(): number {
    if (transcendence) return 6
    if (ulb) return 5
    if (flb) return 4
    return maxUncap || 3
  }

  function getUncapStatus(): string {
    const current = uncapLevel || 0
    const max = getMaxPossibleUncap()

    if (current >= max) return 'Max'
    return `${current} / ${max}`
  }

  function isMaxUncap(): boolean {
    return (uncapLevel || 0) >= getMaxPossibleUncap()
  }

  function isMaxTranscendence(): boolean {
    return transcendenceStep === 5
  }
</script>

<div class="uncap-status-display">
  {#if showIndicator}
    <div class="uncap-indicator-wrapper">
      <UncapIndicator
        {type}
        {uncapLevel}
        transcendenceStage={transcendenceStep}
        {special}
        {flb}
        {ulb}
        {transcendence}
        editable={false}
      />
    </div>
  {/if}

  <div class="uncap-details">
    <StatModifierItem
      label="Uncap Level"
      value={formatUncapLevel(uncapLevel)}
      variant={isMaxUncap() ? 'max' : 'default'}
    />

    {#if transcendence && transcendenceStep && transcendenceStep > 0}
      <StatModifierItem
        label="Transcendence"
        value={formatTranscendenceStep(transcendenceStep)}
        variant={isMaxTranscendence() ? 'max' : 'enhanced'}
      />
    {/if}

    <div class="available-uncaps">
      <span class="label">Available Upgrades</span>
      <div class="uncap-badges">
        {#if flb}
          <span class="badge" class:active={uncapLevel >= 4}>FLB</span>
        {/if}
        {#if ulb}
          <span class="badge" class:active={uncapLevel >= 5}>ULB</span>
        {/if}
        {#if transcendence}
          <span class="badge" class:active={transcendenceStep > 0}>Trans</span>
        {/if}
        {#if !flb && !ulb && !transcendence}
          <span class="badge standard">Standard</span>
        {/if}
      </div>
    </div>
  </div>
</div>

<style lang="scss">
  @use '$src/themes/colors' as colors;
  @use '$src/themes/spacing' as spacing;
  @use '$src/themes/typography' as typography;
  @use '$src/themes/layout' as layout;

  .uncap-status-display {
    display: flex;
    flex-direction: column;
    gap: spacing.$unit-2x;

    .uncap-indicator-wrapper {
      display: flex;
      justify-content: center;
      padding: spacing.$unit-2x;
      background: colors.$grey-90;
      border-radius: layout.$item-corner;
    }

    .uncap-details {
      display: flex;
      flex-direction: column;
      gap: spacing.$unit;
    }

    .available-uncaps {
      padding: spacing.$unit;
      background: colors.$grey-90;
      border-radius: layout.$item-corner-small;

      .label {
        display: block;
        font-size: typography.$font-small;
        color: var(--text-secondary, colors.$grey-50);
        margin-bottom: spacing.$unit;
      }

      .uncap-badges {
        display: flex;
        gap: spacing.$unit;
        flex-wrap: wrap;

        .badge {
          padding: spacing.$unit-half spacing.$unit;
          background: colors.$grey-85;
          border-radius: layout.$item-corner-small;
          font-size: typography.$font-tiny;
          color: var(--text-tertiary, colors.$grey-60);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: typography.$medium;
          transition: all 0.2s ease;

          &.active {
            background: var(--color-success-bg, rgba(76, 175, 80, 0.2));
            color: var(--color-success, #4caf50);
            border: 1px solid var(--color-success, #4caf50);
          }

          &.standard {
            background: colors.$grey-85;
            color: var(--text-secondary, colors.$grey-50);
          }
        }
      }
    }
  }
</style>