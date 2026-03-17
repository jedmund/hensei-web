<script lang="ts">
	import type { Snippet } from 'svelte'
	import type { Playlist } from '$lib/types/api/playlist'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		playlist: Playlist
		focused?: boolean
		disabled?: boolean
		onClick?: () => void
		leading?: Snippet
	}

	let { playlist, focused = false, disabled = false, onClick, leading }: Props = $props()
</script>

<button
	class="playlist-row"
	class:focused
	{disabled}
	onclick={onClick}
	role="option"
	aria-selected={focused}
>
	{#if leading}
		<span class="leading-slot">
			{@render leading()}
		</span>
	{/if}
	<span class="title">{playlist.title}</span>
	{#if playlist.partyCount !== undefined}
		<span class="count">
			{playlist.partyCount === 1
				? m.playlist_party_count_one({ count: playlist.partyCount })
				: m.playlist_party_count({ count: playlist.partyCount })}
		</span>
	{/if}
</button>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.playlist-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: spacing.$unit;
		padding: calc(spacing.$unit * 1.5) spacing.$unit;
		border-radius: layout.$item-corner;
		background: transparent;
		border: none;
		cursor: pointer;
		text-align: left;
		color: var(--text-primary);
		transition: background-color 0.15s;
		width: 100%;

		&:hover:not(:disabled),
		&.focused {
			background: var(--list-cell-bg-hover, rgba(0, 0, 0, 0.03));
		}

		&:focus-visible {
			outline: 2px solid var(--focus-ring-color, #3b82f6);
			outline-offset: 2px;
		}

		&:disabled {
			opacity: 0.6;
			cursor: not-allowed;
		}
	}

	.leading-slot {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 14px;
		flex-shrink: 0;
	}

	.title {
		flex: 1;
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.count {
		flex-shrink: 0;
		font-size: typography.$font-small;
		color: var(--text-secondary);
		font-variant-numeric: tabular-nums;
	}
</style>
