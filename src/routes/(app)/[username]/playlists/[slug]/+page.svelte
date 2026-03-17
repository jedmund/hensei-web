<script lang="ts">
	import type { PageData } from './$types'
	import { createQuery } from '@tanstack/svelte-query'
	import { goto } from '$app/navigation'
	import ExploreGrid from '$lib/components/explore/ExploreGrid.svelte'
	import PlaylistHeader from '$lib/components/playlist/PlaylistHeader.svelte'
	import AddPartiesToPlaylistPane from '$lib/components/sidebar/AddPartiesToPlaylistPane.svelte'
	import { playlistQueries } from '$lib/api/queries/playlist.queries'
	import { useDeletePlaylist, useRemovePartyFromPlaylist } from '$lib/api/mutations/playlist.mutations'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import PageMeta from '$lib/components/PageMeta.svelte'
	import { localizeHref } from '$lib/paraglide/runtime'
	import * as m from '$lib/paraglide/messages'

	const { data }: { data: PageData } = $props()

	const playlistQuery = createQuery(() => ({
		...playlistQueries.detail(data.username, data.playlist.slug),
		initialData: data.playlist,
		initialDataUpdatedAt: Date.now()
	}))

	const deleteMutation = useDeletePlaylist()
	const removeMutation = useRemovePartyFromPlaylist()

	const playlist = $derived(playlistQuery.data ?? data.playlist)
	const parties = $derived(playlist.parties ?? [])

	async function handleDelete() {
		await deleteMutation.mutateAsync(playlist.id)
		goto(localizeHref(`/${data.username}/playlists`))
	}

	async function handleRemoveParty(partyId: string) {
		await removeMutation.mutateAsync({ playlistId: playlist.id, partyId })
	}

	function handleAddTeams() {
		sidebar.openWithComponent(
			m.playlist_add_teams(),
			AddPartiesToPlaylistPane,
			{
				playlistId: playlist.id,
				playlistSlug: playlist.slug,
				username: data.username
			},
			{ scrollable: true }
		)
	}
</script>

<PageMeta
	title={m.playlist_page_title({ title: playlist.title, username: data.username })}
	description={playlist.description || m.page_desc_playlist({ title: playlist.title })}
/>

<section class="playlist-detail">
	<PlaylistHeader
		{playlist}
		username={data.username}
		isOwner={data.isOwner}
		onDelete={handleDelete}
		onAddTeams={handleAddTeams}
		isDeleting={deleteMutation.isPending}
	/>

	{#if parties.length === 0}
		<div class="empty">
			<p>{m.playlist_no_parties()}</p>
		</div>
	{:else}
		<ExploreGrid items={parties} />
	{/if}
</section>

<style lang="scss">
	@use '$src/themes/spacing' as *;

	.playlist-detail {
		display: flex;
		flex-direction: column;
		gap: $unit-2x;
	}

	.empty {
		text-align: center;
		padding: $unit-4x;
		color: var(--text-secondary);

		p { margin: 0; }
	}
</style>
