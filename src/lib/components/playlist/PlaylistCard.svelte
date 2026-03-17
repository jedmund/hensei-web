<script lang="ts">
	import type { Playlist } from '$lib/types/api/playlist'
	import { localizeHref } from '$lib/paraglide/runtime'
	import { getRaidImage } from '$lib/utils/images'
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

	const raidSlugs = $derived(playlist.raidSlugs?.slice(0, 4) ?? [])
	const isGrid = $derived(raidSlugs.length > 1)
</script>

<a class="card" href={localizeHref(`/${username}/playlists/${playlist.slug}`)}>
	<div class="card-body">
		<h3 class="title">{playlist.title}</h3>
		{#if raidSlugs.length > 0}
			<div class="raid-images" class:grid={isGrid}>
				{#each raidSlugs as slug}
					<img src={getRaidImage(slug, 'thumbnail')} alt="" class="raid-thumbnail" />
				{/each}
			</div>
		{:else}
			<div class="raid-placeholder"></div>
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
	@use '$src/themes/effects' as effects;
	@use '$src/themes/layout' as layout;

	.card {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		background: var(--card-bg);
		border: 1px solid transparent;
		border-radius: layout.$card-corner;
		padding: $unit-2x;
		text-decoration: none;
		color: inherit;
		height: 238px;
		transition: background-color 0.15s ease;

		&:hover {
			background: var(--grid-rep-hover);
			box-shadow:
				0 0 0 1px rgba(0, 0, 0, 0.1),
				effects.$card-elevation;
		}
	}

	.card-body {
		display: flex;
		flex-direction: column;
		gap: $unit;
	}

	.title {
		margin: 0;
		font-size: $font-body;
		font-weight: $medium;
		color: var(--text-primary);
	}

	.raid-images {
		border-radius: layout.$item-corner;
		overflow: hidden;

		&.grid {
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: $unit;
		}
	}

	.raid-thumbnail {
		width: 100%;
		display: block;
	}

	.raid-placeholder {
		width: 100%;
		aspect-ratio: 180 / 126;
		border-radius: layout.$item-corner;
		background: var(--button-contained-bg);
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
