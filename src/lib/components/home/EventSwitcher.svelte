<script lang="ts">
	/**
	 * A row of thumbnails that switches what a home card shows (an event, a
	 * new item). Nothing advances on its own.
	 */
	import * as m from '$lib/paraglide/messages'
	import Tooltip from '$lib/components/ui/Tooltip.svelte'
	import CharacterTags from '$lib/components/tags/CharacterTags.svelte'
	import type { ComponentProps } from 'svelte'

	export interface EventSwitcherItem {
		id: string
		/** Accessible name, e.g. the event's name */
		label: string
		imageUrl: string | null
		/** Show `label` in a tooltip on hover */
		tooltip?: boolean
		/** Characters: tags shown under the name in the tooltip */
		characterTags?: ComponentProps<typeof CharacterTags>['character']
	}

	interface Props {
		items: EventSwitcherItem[]
		selected: string
		onSelect: (id: string) => void
		/** Wide for event covers, square for item art */
		shape?: 'wide' | 'square'
		/** Accessible name for the row */
		label?: string
	}

	let { items, selected, onSelect, shape = 'wide', label = m.home_events_aria() }: Props = $props()
</script>

<div class="switcher" role="group" aria-label={label}>
	{#each items as item (item.id)}
		{#snippet thumb()}
			<button
				type="button"
				class="thumb"
				class:square={shape === 'square'}
				class:selected={item.id === selected}
				aria-label={item.label}
				aria-pressed={item.id === selected}
				onclick={() => onSelect(item.id)}
			>
				{#if item.imageUrl}
					<img src={item.imageUrl} alt="" loading="lazy" />
				{:else}
					<span class="name">{item.label}</span>
				{/if}
			</button>
		{/snippet}
		{#if item.tooltip}
			<Tooltip content={item.label}>
				{#snippet body()}
					<span class="tip">
						<span>{item.label}</span>
						{#if item.characterTags}
							<CharacterTags character={item.characterTags} />
						{/if}
					</span>
				{/snippet}
				{@render thumb()}
			</Tooltip>
		{:else}
			{@render thumb()}
		{/if}
	{/each}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/typography' as *;

	.switcher {
		display: flex;
		gap: $unit;
		overflow-x: auto;
		scrollbar-width: none;
		// Room for the keyboard focus outline, which the scroll container would clip
		padding: 4px;
		margin: -4px;
	}

	.thumb {
		flex: none;
		width: 112px;
		aspect-ratio: 2 / 1;
		padding: 0;
		border: 0;
		border-radius: $item-corner;
		overflow: hidden;
		background: var(--button-bg);
		cursor: pointer;
		opacity: 0.6;
		outline: 2px solid transparent;
		outline-offset: 2px;
		transition: opacity 0.12s ease;

		&:hover {
			opacity: 0.85;
		}

		&.selected {
			opacity: 1;
		}

		&:focus-visible {
			outline-color: var(--accent-blue);
		}

		img {
			display: block;
			width: 100%;
			height: 100%;
			object-fit: cover;
		}

		@media (max-width: 768px) {
			width: 88px;
		}

		&.square {
			width: 64px;
			aspect-ratio: 1;

			@media (max-width: 768px) {
				width: 56px;
			}
		}
	}

	.tip {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: $unit-half;
	}

	.name {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		padding: $unit-half;
		font-size: $font-small;
		font-weight: $medium;
		color: var(--text-secondary);
		line-height: 1.2;
		text-align: center;
	}
</style>
