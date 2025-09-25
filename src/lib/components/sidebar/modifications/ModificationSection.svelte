<script lang="ts">
  import type { Snippet } from 'svelte'

  interface Props {
    title: string
    visible?: boolean
    children: Snippet
  }

  let { title, visible = true, children }: Props = $props()
</script>

{#if visible}
  <div class="modification-section">
    <h3>{title}</h3>
    <div class="modification-content">
      {@render children()}
    </div>
  </div>
{/if}

<style lang="scss">
  @use '$src/themes/colors' as colors;
  @use '$src/themes/spacing' as spacing;
  @use '$src/themes/typography' as typography;
  @use '$src/themes/layout' as layout;

  .modification-section {
    margin-bottom: spacing.$unit-3x;
    padding: spacing.$unit-2x;
    background: colors.$grey-90;
    border-radius: layout.$item-corner;

    h3 {
      font-size: typography.$font-regular;
      font-weight: typography.$medium;
      color: var(--text-secondary, colors.$grey-40);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0 0 spacing.$unit-2x 0;
    }

    .modification-content {
      display: flex;
      flex-direction: column;
      gap: spacing.$unit;
    }
  }
</style>