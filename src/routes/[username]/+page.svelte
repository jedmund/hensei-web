<script lang="ts">
  import type { PageData } from './$types'
  import ExploreGrid from '$lib/components/explore/ExploreGrid.svelte'

  const { data } = $props() as { data: PageData }
  const page = data.page || 1
  const totalPages = data.totalPages || undefined
  const tab = data.tab || 'teams'
  const isOwner = data.isOwner || false

  const avatarFile = data.user?.avatar?.picture || ''
  function ensurePng(name: string) {
    return /\.png$/i.test(name) ? name : `${name}.png`
  }
  function to2x(name: string) {
    return /\.png$/i.test(name) ? name.replace(/\.png$/i, '@2x.png') : `${name}@2x.png`
  }
  const avatarSrc = avatarFile ? `/profile/${ensurePng(avatarFile)}` : ''
  const avatarSrcSet = avatarFile ? `${avatarSrc} 1x, /profile/${to2x(avatarFile)} 2x` : ''
</script>

<section class="profile">
  <header class="header">
    {#if data.user?.avatar?.picture}
      <img class="avatar" alt={`Avatar of ${data.user.username}`} src={avatarSrc} srcset={avatarSrcSet} width="64" height="64" />
    {:else}
      <div class="avatar" aria-hidden="true"></div>
    {/if}
    <div>
      <h1>@{data.user.username}</h1>
      <nav class="tabs" aria-label="Profile sections">
        <a class:active={tab==='teams'} href="?tab=teams" data-sveltekit-preload-data="hover">Teams</a>
        {#if isOwner}
          <a class:active={tab==='favorites'} href="?tab=favorites" data-sveltekit-preload-data="hover">Favorites</a>
        {/if}
      </nav>
    </div>
  </header>

  <ExploreGrid items={data.items} />

  <nav class="pagination" aria-label="Pagination">
    {#if page > 1}
      <a rel="prev" href={`?page=${page - 1}`} data-sveltekit-preload-data="hover">Previous</a>
    {/if}
    {#if totalPages && page < totalPages}
      <a rel="next" href={`?page=${page + 1}`} data-sveltekit-preload-data="hover">Next</a>
    {/if}
  </nav>
</section>

<style lang="scss">
  @use '$src/themes/spacing' as *;
  @use '$src/themes/colors' as *;

  .profile { padding: $unit-2x 0; }
  .header { display: flex; align-items: center; gap: $unit-2x; margin-bottom: $unit-2x; }
  .avatar { width: 64px; height: 64px; border-radius: 50%; background: $grey-80; border: 1px solid $grey-75; object-fit: cover; }
  .sub { color: $grey-55; margin: 0; }
  .tabs { display: flex; gap: $unit-2x; margin-top: $unit-half; }
  .tabs a { text-decoration: none; color: inherit; padding-bottom: 2px; border-bottom: 2px solid transparent; }
  .tabs a.active { border-color: #3366ff; color: #3366ff; }
  .pagination { display: flex; gap: $unit-2x; padding: $unit-2x 0; }
  .pagination a { text-decoration: none; }
</style>
