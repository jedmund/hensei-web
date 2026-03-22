<script lang="ts">
	import type { Playlist } from '$lib/types/api/playlist'
	import { DropdownMenu } from 'bits-ui'
	import Icon from '$lib/components/Icon.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import DropdownItem from '$lib/components/ui/dropdown/DropdownItem.svelte'
	import PlaylistDescriptionTile from './PlaylistDescriptionTile.svelte'
	import EditPlaylistDialog from './EditPlaylistDialog.svelte'
	import VideoTile from '$lib/components/party/info/VideoTile.svelte'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		playlist: Playlist
		username: string
		isOwner?: boolean
		onDelete?: () => void
		onAddTeams?: () => void
		isDeleting?: boolean
	}

	let { playlist, username, isOwner = false, onDelete, onAddTeams, isDeleting = false }: Props = $props()

	let confirmingDelete = $state(false)
	let editDialogOpen = $state(false)

	function handleDeleteClick() {
		if (confirmingDelete) {
			onDelete?.()
		} else {
			confirmingDelete = true
		}
	}
</script>

<div class="playlist-header">
	<PlaylistDescriptionTile
		title={playlist.title}
		description={playlist.description}
		user={playlist.user}
		updatedAt={playlist.lastUpdated ?? playlist.updatedAt}
	>
		{#snippet menu()}
			{#if isOwner}
				<Button size="small" contained onclick={onAddTeams}>
					{(playlist.parties?.length ?? 0) > 0 ? m.playlist_manage_teams() : m.playlist_add_teams()}
				</Button>
				<DropdownMenu.Root>
					<DropdownMenu.Trigger class="menu-trigger">
						<Icon name="ellipsis" size={16} />
					</DropdownMenu.Trigger>

					<DropdownMenu.Portal>
						<DropdownMenu.Content class="dropdown-content" sideOffset={5} align="end">
							<DropdownItem>
								<button onclick={() => (editDialogOpen = true)}>
									{m.playlist_edit()}
								</button>
							</DropdownItem>
							<DropdownItem>
								<button onclick={handleDeleteClick} disabled={isDeleting}>
									{confirmingDelete ? m.playlist_confirm_delete() : m.playlist_delete()}
								</button>
							</DropdownItem>
						</DropdownMenu.Content>
					</DropdownMenu.Portal>
				</DropdownMenu.Root>
			{/if}
		{/snippet}
	</PlaylistDescriptionTile>

	{#if playlist.videoUrl}
		<VideoTile videoUrl={playlist.videoUrl} />
	{/if}
</div>

{#if isOwner}
	<EditPlaylistDialog bind:open={editDialogOpen} {playlist} />
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/effects' as effects;

	.playlist-header {
		display: flex;
		flex-direction: column;
		gap: $unit-2x;
	}

	:global(.menu-trigger) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 30px;
		height: 30px;
		padding: $unit;
		border-radius: layout.$input-corner;
		background: transparent;
		border: none;
		cursor: pointer;
		color: var(--text-secondary);
		transition: background-color 0.2s ease, color 0.2s ease;
		outline: none;

		&:hover {
			background-color: var(--button-bg);
			color: var(--text-primary);
		}

		&:focus-visible {
			box-shadow: 0 0 0 2px var(--accent-blue-focus);
		}
	}

	:global(.dropdown-content) {
		background-color: var(--menu-bg);
		border-radius: layout.$input-corner;
		padding: $unit-half;
		min-width: 160px;
		box-shadow: var(--shadow-xl);
		z-index: effects.$z-popover;
	}
</style>
