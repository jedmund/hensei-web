<script lang="ts">
	import type { PageData } from './$types'
	import { onDestroy } from 'svelte'
	import { createInfiniteQuery } from '@tanstack/svelte-query'
	import ProfileHeader from '$lib/components/profile/ProfileHeader.svelte'
	import PlaylistCard from '$lib/components/playlist/PlaylistCard.svelte'
	import CreatePlaylistDialog from '$lib/components/playlist/CreatePlaylistDialog.svelte'
	import { playlistQueries } from '$lib/api/queries/playlist.queries'
	import { page } from '$app/stores'
	import { crewStore } from '$lib/stores/crew.store.svelte'
	import { useInfiniteLoader } from '$lib/stores/loaderState.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import PageMeta from '$lib/components/PageMeta.svelte'
	import * as m from '$lib/paraglide/messages'

	const { data }: { data: PageData } = $props()
	const isOwner = $derived(data.isOwner || false)

	const viewerCrewRole = $derived(crewStore.membership?.role ?? null)
	const viewerCrewId = $derived(crewStore.crew?.id ?? null)

	let sentinelEl = $state<HTMLElement>()
	let createDialogOpen = $state(false)

	const playlistsQuery = createInfiniteQuery(() => ({
		...playlistQueries.userPlaylists(data.user?.username ?? ''),
		enabled: !!data.user?.username
	}))

	const loader = useInfiniteLoader(() => playlistsQuery, () => sentinelEl, { rootMargin: '300px' })

	onDestroy(() => loader.destroy())

	const items = $derived(() => {
		if (!playlistsQuery.data?.pages) return []
		return playlistsQuery.data.pages.flatMap((page) => page.results ?? [])
	})

	const isEmpty = $derived(!playlistsQuery.isLoading && items().length === 0)
</script>

<PageMeta
	title={m.page_title_playlists({ username: data.user?.username ?? '' })}
	description={m.page_desc_playlists({ username: data.user?.username ?? '' })}
/>

<section class="profile">
	<ProfileHeader
		username={data.user.username}
		userId={data.user?.id}
		avatarPicture={data.user?.avatar?.picture}
		element={data.user?.avatar?.element}
		granblueId={data.user?.granblueId}
		showGranblueId={data.user?.showGranblueId}
		showCrewGamertag={data.user?.showCrewGamertag}
		crewGamertag={data.user?.crewGamertag}
		activeTab="playlists"
		{isOwner}
		{viewerCrewRole}
		{viewerCrewId}
		collectionPrivacy={data.user?.collectionPrivacy}
		isAuthenticated={$page.data?.isAuthenticated}
	/>

	{#if playlistsQuery.isLoading}
		<div class="loading">
			<Icon name="loader-2" size={32} />
			<p>{m.playlist_loading()}</p>
		</div>
	{:else if playlistsQuery.isError}
		<div class="error">
			<Icon name="alert-circle" size={32} />
			<p>{m.playlist_load_error({ error: playlistsQuery.error?.message || '' })}</p>
			<Button size="small" onclick={() => playlistsQuery.refetch()}>{m.retry()}</Button>
		</div>
	{:else if isEmpty}
		<div class="empty">
			<p>{m.playlist_empty()}</p>
			{#if isOwner}
				<Button size="small" onclick={() => (createDialogOpen = true)}>
					{m.playlist_create()}
				</Button>
			{/if}
		</div>
	{:else}
		<div class="playlist-grid">
			<ul class="grid" role="list">
				{#if isOwner}
					<li>
						<button class="new-playlist-card" onclick={() => (createDialogOpen = true)}>
							<Icon name="plus" size={20} />
							<span>{m.playlist_create()}</span>
						</button>
					</li>
				{/if}
				{#each items() as playlist (playlist.id)}
					<li>
						<PlaylistCard {playlist} username={data.user.username} />
					</li>
				{/each}
			</ul>

			<div
				class="load-more-sentinel"
				bind:this={sentinelEl}
				class:hidden={!playlistsQuery.hasNextPage}
			></div>

			{#if playlistsQuery.isFetchingNextPage}
				<div class="loading-more">
					<Icon name="loader-2" size={20} />
					<span>{m.loading_more()}</span>
				</div>
			{/if}

			{#if !playlistsQuery.hasNextPage && items().length > 0}
				<div class="end">
					<p>{m.playlist_seen_all()}</p>
				</div>
			{/if}
		</div>
	{/if}
</section>

<CreatePlaylistDialog bind:open={createDialogOpen} />

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/colors' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/mixins' as *;

	.profile {
		display: flex;
		flex-direction: column;
		gap: $unit-2x;
	}

	.new-playlist-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: $unit;
		width: 100%;
		min-height: 120px;
		background: var(--card-bg);
		border: 1px dashed var(--border-subtle, var(--button-bg));
		border-radius: $card-corner;
		padding: $unit-2x;
		cursor: pointer;
		color: var(--text-secondary);
		font-size: $font-small;
		font-weight: $medium;
		transition: background-color 0.15s ease, color 0.15s ease;

		&:hover {
			background: var(--card-bg-hover, var(--button-contained-bg-hover));
			color: var(--text-primary);
		}
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: $unit-3x;
		padding: 0;

		@include breakpoint(tablet) { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: $unit-2x; }
		@include breakpoint(phone) { grid-template-columns: 1fr; gap: $unit; }

		& > li { list-style: none; }
	}

	.empty,
	.end,
	.error {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: $unit-2x;
		text-align: center;
		padding: $unit-4x;
		color: var(--text-secondary);

		p { margin: 0; }
	}

	.error {
		color: var(--text-error, #dc2626);
	}

	.loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: $unit;
		padding: $unit-4x;
		color: var(--text-secondary);

		:global(svg) { animation: spin 1s linear infinite; }
		p { margin: 0; }
	}

	.load-more-sentinel {
		height: 1px;
		margin-top: $unit;

		&.hidden { display: none; }
	}

	.loading-more {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: $unit;
		padding: $unit-2x;
		color: var(--text-secondary);

		:global(svg) { animation: spin 1s linear infinite; }
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
</style>
