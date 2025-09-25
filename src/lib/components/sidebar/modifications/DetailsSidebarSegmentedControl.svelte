<script lang="ts">
  import { SegmentedControl, Segment } from '$lib/components/ui/segmented-control'

  interface Props {
    hasModifications: boolean
    selectedView: 'canonical' | 'user'
    onViewChange?: (view: 'canonical' | 'user') => void
  }

  let {
    hasModifications,
    selectedView = $bindable('canonical'),
    onViewChange
  }: Props = $props()

  function handleViewChange(value: string) {
    selectedView = value as 'canonical' | 'user'
    onViewChange?.(selectedView)
  }
</script>

<div class="details-sidebar-segmented-control">
  <SegmentedControl
    bind:value={selectedView}
    onValueChange={handleViewChange}
    variant="background"
    grow
  >
    <Segment value="canonical">
      <span class="segment-label">Canonical</span>
    </Segment>
    {#if hasModifications}
      <Segment value="user">
        <span class="segment-label">
          User Version
        </span>
      </Segment>
    {:else}
      <div class="disabled-segment">
        <span class="segment-label disabled">
          User Version
        </span>
      </div>
    {/if}
  </SegmentedControl>
</div>

<style lang="scss">
  @use '$src/themes/colors' as colors;
  @use '$src/themes/spacing' as spacing;
  @use '$src/themes/typography' as typography;

  .details-sidebar-segmented-control {
    margin-bottom: spacing.$unit-2x;
    padding: 0 spacing.$unit-2x;
  }

  .segment-label {
    font-size: typography.$font-regular;
    font-weight: typography.$medium;

    &.disabled {
      color: var(--text-tertiary, colors.$grey-60);
      opacity: 0.5;
    }
  }

  .disabled-segment {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: spacing.$unit;
    background: colors.$grey-90;
    border-radius: spacing.$unit-half;
    cursor: not-allowed;
    user-select: none;
  }
</style>