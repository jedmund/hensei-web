<script lang="ts">
	import { getCharacterImage } from '$lib/utils/images'
	import Icon from '$lib/components/Icon.svelte'
	import ElementLabel from '$lib/components/labels/ElementLabel.svelte'
	import type { SearchPageResult } from '$lib/api/queries/search.queries'

	type SearchResultItem = SearchPageResult['results'][number]

	interface Props {
		character: SearchResultItem
		selected?: boolean
		onToggle?: (character: SearchResultItem) => void
	}

	let { character, selected = false, onToggle }: Props = $props()

	const imageUrl = $derived(getCharacterImage(character.granblueId, 'grid', '01'))

	const name = $derived(
		typeof character.name === 'string'
			? character.name
			: character.name?.en || character.name?.ja || 'Unknown'
	)

	const element = $derived(character.element)

	function handleClick() {
		onToggle?.(character)
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault()
			handleClick()
		}
	}
</script>

<button
	type="button"
	class="row"
	class:selected
	onclick={handleClick}
	onkeydown={handleKeyDown}
	aria-pressed={selected}
	aria-label="{selected ? 'Deselect' : 'Select'} {name}"
>
	<div class="checkbox">
		{#if selected}
			<Icon name="check" size={14} />
		{/if}
	</div>

	<div class="thumbnail">
		<img src={imageUrl} alt={name} loading="lazy" />
	</div>

	<span class="name">{name}</span>

	<div class="element-cell">
		<ElementLabel {element} size="medium" />
	</div>
</button>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;

	.row {
		display: flex;
		align-items: center;
		gap: $unit;
		padding: $unit $unit-2x $unit $unit;
		border: none;
		background: var(--list-cell-bg);
		cursor: pointer;
		width: 100%;
		text-align: left;
		border-radius: 12px;
		transition:
			background 0.15s,
			box-shadow 0.15s;

		&:hover {
			background: var(--list-cell-bg-hover);
			box-shadow: var(--shadow-md);
		}

		&:focus-visible {
			outline: 2px solid var(--accent-color, #3366ff);
			outline-offset: -2px;
		}

		&.selected {
			background: rgba(51, 102, 255, 0.1);

			&:hover {
				background: rgba(51, 102, 255, 0.15);
			}
		}
	}

	.checkbox {
		width: 18px;
		height: 18px;
		border: 2px solid var(--border-color, #ccc);
		border-radius: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition:
			background 0.15s,
			border-color 0.15s;

		.selected & {
			background: var(--accent-color, #3366ff);
			border-color: var(--accent-color, #3366ff);
			color: white;
		}
	}

	.thumbnail {
		width: 100px;
		aspect-ratio: 280 / 160;
		border-radius: 6px;
		overflow: hidden;
		background: var(--card-bg, #f5f5f5);
		flex-shrink: 0;

		img {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}
	}

	.name {
		flex: 1;
		font-size: $font-regular;
		color: var(--text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>
