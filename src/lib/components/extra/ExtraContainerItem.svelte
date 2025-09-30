<script lang="ts">
  import type { Snippet } from 'svelte'

  interface Props {
    title: string
    children: Snippet
  }

  let { title, children }: Props = $props()
</script>

<div class="item">
  <div class="content">
    <header class="header">
      <h3>{title}</h3>
    </header>
    {@render children()}
  </div>
</div>

<style lang="scss">
  @use '$src/themes/spacing' as *;
  @use '$src/themes/typography' as *;
  @use '$src/themes/mixins' as *;

  .item {
    position: relative;

    .header {
      align-items: center;
      display: flex;
      flex-direction: row;
      gap: $unit;
      justify-content: center;
      min-height: $unit-4x;
      width: 100%;

      & > h3 {
        color: var(--extra-purple-text);
        font-size: $font-small;
        font-weight: $medium;
        line-height: 1.2;
        font-weight: 500;
        text-align: center;
      }
    }

    .content {
      display: grid;
      grid-template-columns: 1.19fr 3fr;
      gap: $unit-2x;
      padding: $unit-2x $unit-2x $unit-2x;

      @include breakpoint(phone) {
        grid-template-columns: auto;
        grid-template-rows: auto 1fr;
      }

      &:not(:first-child) {
        border-top: 1px solid var(--extra-purple-card-bg);
      }
    }
  }
</style>