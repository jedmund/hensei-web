<script lang="ts">
	import type { Playlist } from '$lib/types/api/playlist'
	import { localizeHref } from '$lib/paraglide/runtime'
	import Icon from '$lib/components/Icon.svelte'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		playlist: Playlist
		username: string
	}

	let { playlist, username }: Props = $props()

	const visibilityIcon = $derived(
		playlist.visibility === 1 ? 'globe' : playlist.visibility === 2 ? 'link' : 'lock'
	)
</script>

<a class="card" href={localizeHref(`/${username}/playlists/${playlist.slug}`)}>
	<div class="card-body">
		<h3 class="title">{playlist.title}</h3>
		{#if playlist.description}
			<p class="description">{playlist.description}</p>
		{/if}
	</div>
	<div class="card-footer">
		<span class="party-count">
			{(playlist.partyCount ?? 0) === 1
				? m.playlist_party_count_one({ count: playlist.partyCount ?? 0 })
				: m.playlist_party_count({ count: playlist.partyCount ?? 0 })}
		</span>
		{#if playlist.visibility !== 1}
			<Icon name={visibilityIcon} size={14} />
		{/if}
	</div>
</a>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/colors' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as layout;

	.card {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		background: var(--card-bg);
		border-radius: layout.$card-corner;
		padding: $unit-2x;
		text-decoration: none;
		color: inherit;
		min-height: 120px;
		transition: background-color 0.15s ease;

		&:hover {
			background: var(--card-bg-hover, var(--button-contained-bg-hover));
		}
	}

	.card-body {
		display: flex;
		flex-direction: column;
		gap: $unit-half;
	}

	.title {
		margin: 0;
		font-size: $font-body;
		font-weight: $medium;
		color: var(--text-primary);
	}

	.description {
		margin: 0;
		font-size: $font-small;
		color: var(--text-secondary);
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.card-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: $unit;
	}

	.party-count {
		font-size: $font-small;
		color: var(--text-secondary);
	}
</style>
