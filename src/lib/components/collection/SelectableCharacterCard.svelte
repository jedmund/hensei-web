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
		userElement?: 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'
	}

	let { character, selected = false, onToggle, userElement }: Props = $props()

	const accentColor = $derived(userElement ? `var(--${userElement}-button-bg)` : undefined)

	const imageUrl = $derived(getCharacterImage(character.granblueId, 'grid', '01'))

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
	style:--select-accent={accentColor}
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
		width: 100%;
		aspect-ratio: 96 / 55;
		padding: 0;
		border: 2px solid transparent;
		border-radius: layout.$input-corner;
		background: var(--card-bg, #f5f5f5);
		cursor: pointer;
		overflow: hidden;
		@include smooth-transition(0.15s, all);

		&:hover {
			border-color: var(--select-accent, var(--accent-blue));
			transform: scale(1.02);
		}

		&:focus-visible {
			outline: 2px solid var(--select-accent, var(--accent-blue));
			outline-offset: 2px;
		}

		&.selected {
			border-color: var(--select-accent, var(--accent-blue));
			box-shadow: 0 0 0 2px var(--select-accent, var(--accent-blue));
		}
	}

	.image {
		width: 100%;
		height: auto;
	}

	.check-overlay {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: color-mix(in srgb, var(--select-accent, var(--accent-blue)) 60%, transparent);
		color: white;
	}
</style>
