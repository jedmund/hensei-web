<script lang="ts">
	/**
	 * A row of thumbnails that switches what a home card shows (an event, a
	 * new item). Nothing advances on its own.
	 */
	import * as m from '$lib/paraglide/messages'
	import Tooltip from '$lib/components/ui/Tooltip.svelte'
	import CharacterTags from '$lib/components/tags/CharacterTags.svelte'
	import type { ComponentProps } from 'svelte'
	import { SvelteSet } from 'svelte/reactivity'

	export interface EventSwitcherItem {
		id: string
		/** Accessible name, e.g. the event's name */
		label: string
		imageUrl: string | null
		/** Show `label` in a tooltip on hover */
		tooltip?: boolean
		/** Characters: tags shown under the name in the tooltip */
		characterTags?: ComponentProps<typeof CharacterTags>['character']
		/** Shown dimmer, e.g. a new item nobody has used yet */
		muted?: boolean
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

	// Images that failed to load show the name instead
	const failed = new SvelteSet<string>()

	// Fade the edges that have more thumbnails past them, so the row reads as
	// scrollable
	let row = $state<HTMLElement>()
	let moreBefore = $state(false)
	let moreAfter = $state(false)
	function updateEdges() {
		if (!row) return
		moreBefore = row.scrollLeft > 1
		moreAfter = row.scrollLeft + row.clientWidth < row.scrollWidth - 1
	}
	$effect(() => {
		if (!row) return
		updateEdges()
		const observer = new ResizeObserver(updateEdges)
		observer.observe(row)
		return () => observer.disconnect()
	})
</script>

<div
	class="switcher"
	class:more-before={moreBefore}
	class:more-after={moreAfter}
	role="group"
	aria-label={label}
	bind:this={row}
	onscroll={updateEdges}
>
	{#each items as item (item.id)}
		{#snippet thumb()}
			<button
				type="button"
				class="thumb"
				class:square={shape === 'square'}
				class:selected={item.id === selected}
				class:muted={item.muted}
				aria-label={item.label}
				aria-pressed={item.id === selected}
				onclick={() => onSelect(item.id)}
			>
				{#if item.imageUrl && !failed.has(item.id)}
					<img src={item.imageUrl} alt="" loading="lazy" onerror={() => failed.add(item.id)} />
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
		--fade-before: black;
		--fade-after: black;
		mask-image: linear-gradient(
			to right,
			var(--fade-before),
			black $unit-4x,
			black calc(100% - #{$unit-4x}),
			var(--fade-after)
		);

		&.more-before {
			--fade-before: transparent;
		}

		&.more-after {
			--fade-after: transparent;
		}
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

		&.muted:not(.selected) {
			opacity: 0.3;

			&:hover {
				opacity: 0.6;
			}
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
			width: 110px;
		}

		&.square {
			width: 64px;
			aspect-ratio: 1;

			@media (max-width: 768px) {
				width: 64px;
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
