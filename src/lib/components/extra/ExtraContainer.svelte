<script lang="ts">
  import type { Snippet } from 'svelte'

  interface Props {
    children: Snippet
  }

  let { children }: Props = $props()
</script>

<section class="container">
  {@render children()}
</section>

<style lang="scss">
  @use '$src/themes/spacing' as *;
  @use '$src/themes/layout' as *;

  .container {
    background: var(--extra-purple-bg);
    border-radius: $card-corner;
    display: flex;
    margin: $unit-4x auto 0;
    flex-direction: column;
    max-width: calc($grid-width + $unit-2x);
    width: 100%;

    & > :global(*) {
      border-bottom: 2px solid var(--background);

      &:last-child {
        border-bottom: none;
      }
    }
  }
</style>