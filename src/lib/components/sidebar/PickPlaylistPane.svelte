<script lang="ts">
	import type { Playlist } from '$lib/types/api/playlist'
	import type { UserCookie } from '$lib/types/UserCookie'
	import { createQuery } from '@tanstack/svelte-query'
	import { page } from '$app/stores'
	import { goto } from '$app/navigation'
	import { playlistQueries } from '$lib/api/queries/playlist.queries'
	import { useAddPartyToPlaylist, useRemovePartyFromPlaylist, useCreatePlaylist } from '$lib/api/mutations/playlist.mutations'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import { localizeHref } from '$lib/paraglide/runtime'
	import { toast } from 'svelte-sonner'
	import Input from '$lib/components/ui/Input.svelte'
	import PlaylistRow from '$lib/components/playlist/PlaylistRow.svelte'
	import FavoriteToast from '$lib/components/ui/FavoriteToast.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		partyId: string
		username: string
	}

	let { partyId, username }: Props = $props()

	const playlistsQuery = createQuery(() => ({
		...playlistQueries.userPlaylistSummaries(username),
		enabled: !!username
	}))

	const addMutation = useAddPartyToPlaylist()
	const removeMutation = useRemovePartyFromPlaylist()
	const createMutation = useCreatePlaylist()

	let search = $state('')
	let focusedIndex = $state(-1)
	let searchWrapperEl = $state<HTMLDivElement>()
	let listEl = $state<HTMLDivElement>()

	const currentUser = $derived($page.data?.currentUser as UserCookie | null)
	const badgeColor = $derived(
		currentUser?.element ? `var(--${currentUser.element}-button-bg)` : 'var(--text-tertiary)'
	)

	const playlists = $derived(playlistsQuery.data ?? [])
	const filtered = $derived(
		search.trim()
			? playlists.filter((p) => p.title.toLowerCase().includes(search.trim().toLowerCase()))
			: playlists
	)
	const busy = $derived(addMutation.isPending || removeMutation.isPending || createMutation.isPending)

	function isInPlaylist(playlist: Playlist): boolean {
		return playlist.partyIds?.includes(partyId) ?? false
	}

	function focusSearch() {
		searchWrapperEl?.querySelector('input')?.focus()
	}

	async function togglePlaylist(playlist: Playlist) {
		try {
			if (isInPlaylist(playlist)) {
				await removeMutation.mutateAsync({ playlistId: playlist.id, partyId })
			} else {
				await addMutation.mutateAsync({ playlistId: playlist.id, partyId })
				toast.custom(FavoriteToast, {
					componentProps: {
						partyName: playlist.title,
						message: m.toast_added_to_playlist({ name: playlist.title }),
						icon: 'check',
						actionLabel: m.toast_view_playlist(),
						actionHref: localizeHref(`/${username}/playlists/${playlist.slug}`)
					}
				})
			}
		} catch {
			// Error handled by mutation state
		}
	}

	async function createAndAdd(title: string) {
		if (!title.trim()) return
		try {
			const playlist = await createMutation.mutateAsync({ title: title.trim() })
			await addMutation.mutateAsync({ playlistId: playlist.id, partyId })
			sidebar.close()
			goto(localizeHref(`/${username}/playlists/${playlist.slug}`))
		} catch {
			// Error handled by mutation state
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault()
			if (focusedIndex >= 0 && focusedIndex < filtered.length) {
				togglePlaylist(filtered[focusedIndex])
			} else if (filtered.length > 0 && focusedIndex === -1) {
				focusedIndex = 0
			} else if (search.trim()) {
				createAndAdd(search)
			}
		} else if (e.key === 'ArrowDown') {
			e.preventDefault()
			if (focusedIndex < filtered.length - 1) {
				focusedIndex++
			}
			scrollToFocused()
		} else if (e.key === 'ArrowUp') {
			e.preventDefault()
			if (focusedIndex > 0) {
				focusedIndex--
			} else if (focusedIndex === 0) {
				focusedIndex = -1
				focusSearch()
			}
			scrollToFocused()
		}
	}

	function scrollToFocused() {
		if (!listEl || focusedIndex < 0) return
		const items = listEl.querySelectorAll('[role="option"]')
		items[focusedIndex]?.scrollIntoView({ block: 'nearest' })
	}

	// Focus search on mount
	$effect(() => {
		requestAnimationFrame(() => focusSearch())
	})

	// Reset focused index when search changes
	$effect(() => {
		search
		focusedIndex = -1
	})
</script>

<div class="add-to-playlist-pane">
	<div class="search-wrapper" bind:this={searchWrapperEl} onkeydown={handleKeydown}>
		<Input
			bind:value={search}
			placeholder={m.playlist_field_title_placeholder()}
			leftIcon="search"
			clearable
			onClear={() => (search = '')}
			contained
		/>
	</div>

	<div class="playlist-list" bind:this={listEl} role="listbox" onkeydown={handleKeydown}>
		{#if playlistsQuery.isLoading}
			<div class="status">
				<p>{m.playlist_loading()}</p>
			</div>
		{:else if filtered.length === 0 && search.trim()}
			<div class="status create-hint">
				<p class="hint">
					<kbd>Enter</kbd> to create "{search.trim()}"
				</p>
			</div>
		{:else if playlists.length === 0}
			<div class="status">
				<p>{m.playlist_none_yet()}</p>
			</div>
		{:else}
			{#each filtered as playlist, i (playlist.id)}
				<PlaylistRow
					{playlist}
					focused={focusedIndex === i}
					disabled={busy}
					onClick={() => togglePlaylist(playlist)}
				>
					{#snippet leading()}
						{#if isInPlaylist(playlist)}
							<span class="check-icon" style:color={badgeColor}>
								<Icon name="check" size={14} />
							</span>
						{/if}
					{/snippet}
				</PlaylistRow>
			{/each}
		{/if}
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.add-to-playlist-pane {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.search-wrapper {
		padding: spacing.$unit-2x;
		padding-bottom: spacing.$unit;
	}

	.playlist-list {
		display: flex;
		flex-direction: column;
		flex: 1;
		overflow-y: auto;
		padding: 0 spacing.$unit-2x;
	}

	.status {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: spacing.$unit;
		text-align: center;
		padding: spacing.$unit-2x;
		color: var(--text-secondary);

		p {
			margin: 0;
		}
	}

	.check-icon {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	.create-hint {
		.hint {
			font-size: typography.$font-small;
			color: var(--text-tertiary);
		}

		kbd {
			display: inline-block;
			padding: 1px spacing.$unit-half;
			border-radius: 3px;
			background: var(--button-contained-bg);
			color: var(--text-secondary);
			font-family: inherit;
			font-size: typography.$font-small;
		}
	}
</style>
