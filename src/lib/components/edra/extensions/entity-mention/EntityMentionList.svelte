<script lang="ts">
	/**
	 * EntityMentionList - Dropdown for entity mention suggestions
	 *
	 * Shows characters, weapons, summons (global search) and the active party's
	 * character skills when typing `@`. Rows are precomputed MentionSuggestions, so
	 * this component only paints; per-type presentation lives in the mentions module.
	 */
	import * as m from '$lib/paraglide/messages'
	import CharacterTags from '$lib/components/tags/CharacterTags.svelte'
	import { descriptorFor, skillMentionSubheader } from './mentions/index.js'
	import type { MentionSuggestion, MentionToken } from './mentions/index.js'

	interface Props {
		items: MentionSuggestion[]
		command: (token: MentionToken) => void
		query: string
	}

	let { items, command, query }: Props = $props()

	let selectedIndex = $state(0)
	let listEl = $state<HTMLDivElement>()

	// Reset selection when items change
	$effect(() => {
		void items
		selectedIndex = 0
	})

	// Scroll selected item into view on arrow key navigation
	$effect(() => {
		const item = listEl?.children[selectedIndex] as HTMLElement | undefined
		item?.scrollIntoView({ block: 'nearest' })
	})

	function selectItem(index: number) {
		const item = items[index]
		if (!item) return
		command(item.token)
	}

	function upHandler() {
		selectedIndex = (selectedIndex + items.length - 1) % items.length
	}

	function downHandler() {
		selectedIndex = (selectedIndex + 1) % items.length
	}

	function enterHandler() {
		selectItem(selectedIndex)
	}

	/** Exposed for keyboard handling from suggestion plugin */
	export function onKeyDown(event: KeyboardEvent): boolean {
		if (event.key === 'ArrowUp') {
			upHandler()
			return true
		}
		if (event.key === 'ArrowDown') {
			downHandler()
			return true
		}
		if (event.key === 'Enter') {
			enterHandler()
			return true
		}
		return false
	}
</script>

<div class="entity-mention-list" bind:this={listEl}>
	{#if items.length > 0}
		{#each items as item, index (item.key)}
			{@const token = item.token}
			{@const secondary = descriptorFor(token.type).secondary}
			<button
				type="button"
				class="mention-item"
				class:selected={index === selectedIndex}
				onclick={() => selectItem(index)}
			>
				<div class="item-image {token.type}">
					{#if item.imageUrl}
						<img src={item.imageUrl} alt={item.primaryLabel} loading="lazy" />
					{:else}
						<span class="item-swatch" style:background={item.swatchColor ?? 'var(--border-color)'}
						></span>
					{/if}
				</div>
				<div class="item-info">
					<span class="item-name">{item.primaryLabel || m.mention_unknown()}</span>
					{#if secondary === 'character-tags'}
						<CharacterTags
							character={{
								element: token.element?.id,
								season: token.season,
								series: token.series
							}}
						/>
					{:else if secondary === 'skill-meta' && token.skill?.character}
						<span class="item-meta">{skillMentionSubheader(token)}</span>
					{/if}
				</div>
			</button>
		{/each}
	{:else}
		<div class="no-results">
			{#if query.length < 2}
				{m.mention_search_hint()}
			{:else}
				{m.mention_no_results()}
			{/if}
		</div>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;

	.entity-mention-list {
		display: flex;
		flex-direction: column;
		gap: $unit-half;
		background: var(--dialog-bg);
		border: 1px solid var(--border-color);
		border-radius: $card-corner;
		box-shadow: var(--shadow-lg);
		overflow: hidden;
		min-width: 240px;
		max-width: 360px;
		max-height: 320px;
		overflow-y: auto;
		padding: $unit-half;
	}

	.mention-item {
		display: flex;
		align-items: center;
		gap: $unit;
		width: 100%;
		padding: $unit;
		border: none;
		border-radius: $item-corner-small;
		background: transparent;
		cursor: pointer;
		text-align: left;
		transition: background 0.1s;

		&:hover,
		&.selected {
			background: var(--typeahead-item-hover);
		}
	}

	.item-image {
		width: 36px;
		height: 36px;
		border-radius: $item-corner-small;
		overflow: hidden;
		flex-shrink: 0;

		img {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}

		// Skill icons are transparent PNGs; don't crop them.
		&.skill img {
			object-fit: contain;
		}
	}

	.item-swatch {
		display: block;
		width: 100%;
		height: 100%;
	}

	.item-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: $unit-half;
		min-width: 0;
	}

	.item-name {
		font-size: $font-small;
		color: var(--text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.item-meta {
		font-size: $font-tiny;
		color: var(--text-secondary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.no-results {
		padding: $unit-2x;
		text-align: center;
		color: var(--text-secondary);
		font-size: $font-small;
	}
</style>
