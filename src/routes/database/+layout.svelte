<script lang="ts">
  import { localizeHref } from '$lib/paraglide/runtime'

  const baseHref = localizeHref('/database')
  const summonsHref = localizeHref('/database/summons')
  const charactersHref = localizeHref('/database/characters')
  const weaponsHref = localizeHref('/database/weapons')
</script>

<section class="db-nav">
  <nav>
    <a href={summonsHref}>Summons</a>
    <a href={charactersHref}>Characters</a>
    <a href={weaponsHref}>Weapons</a>
  </nav>
</section>

<slot />

<style lang="scss">
  @use '$src/themes/layout' as layout;
  @use '$src/themes/spacing' as spacing;
  @use '$src/themes/typography' as typography;

  .db-nav {
    margin: spacing.$unit 0;
    nav {
      display: flex;
      gap: spacing.$unit-half;
      a {
        text-decoration: none;
        color: var(--menu-text);
        background: var(--menu-bg);
        padding: spacing.$unit (spacing.$unit * 1.5);
        border-radius: layout.$full-corner;
        font-size: typography.$font-small;
        font-weight: typography.$medium;
      }
      a:hover { background: var(--menu-bg-item-hover); }
    }
  }
</style>

