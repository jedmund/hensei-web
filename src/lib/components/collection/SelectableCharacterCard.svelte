<script lang="ts">
	import { localizedName } from '$lib/utils/locale'
	import { getCharacterImage } from '$lib/utils/images'
	import Icon from '$lib/components/Icon.svelte'
	import type { SearchPageResult } from '$lib/api/queries/search.queries'

	type SearchResultItem = SearchPageResult['results'][number]

	interface Props {
		character: SearchResultItem
		selected?: boolean
		onToggle?: (character: SearchResultItem) => void
	}

	let { character, selected = false, onToggle }: Props = $props()

	const imageUrl = $derived(
		getCharacterImage(character.granblueId, 'grid', '01')
	)

	const name = $derived(localizedName(character.name))

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
	class="card"
	class:selected
	onclick={handleClick}
	onkeydown={handleKeyDown}
	aria-pressed={selected}
	aria-label="{selected ? 'Deselect' : 'Select'} {name}"
>
	<img src={imageUrl} alt={name} class="image" loading="lazy" />
	{#if selected}
		<div class="check-overlay">
			<Icon name="check" size={24} />
		</div>
	{/if}
</button>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/effects' as *;
	@use '$src/themes/layout' as layout;

	.card {
		position: relative;
		width: 100px;
		// Character grid images are 280x160 (7:4 ratio)
		aspect-ratio: 280 / 160;
		padding: 0;
		border: 2px solid transparent;
		border-radius: layout.$input-corner;
		background: var(--card-bg, #f5f5f5);
		cursor: pointer;
		overflow: hidden;
		flex-shrink: 0;
		@include smooth-transition(0.15s, all);

		&:hover {
			border-color: var(--accent-color, #3366ff);
			transform: scale(1.02);
		}

		&:focus-visible {
			outline: 2px solid var(--focus-ring, #3366ff);
			outline-offset: 2px;
		}

		&.selected {
			border-color: var(--accent-color, #3366ff);
			box-shadow: 0 0 0 2px var(--accent-color, #3366ff);
		}
	}

	.image {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	.check-overlay {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(51, 102, 255, 0.6);
		color: white;
	}
</style>
