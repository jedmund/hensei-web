<script lang="ts">
	import { localizedName } from '$lib/utils/locale'
	import { getCharacterImage } from '$lib/utils/images'
	import Checkbox from '$lib/components/ui/checkbox/Checkbox.svelte'
	import ElementLabel from '$lib/components/labels/ElementLabel.svelte'
	import CharacterTags from '$lib/components/tags/CharacterTags.svelte'
	import type { SearchPageResult } from '$lib/api/queries/search.queries'

	type SearchResultItem = SearchPageResult['results'][number]

	interface Props {
		character: SearchResultItem
		selected?: boolean
		onToggle?: (character: SearchResultItem) => void
		/** User's element for checkbox styling */
		userElement?: 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'
	}

	let { character, selected = false, onToggle, userElement }: Props = $props()

	const imageUrl = $derived(getCharacterImage(character.granblueId, 'square', '01'))

	const name = $derived(localizedName(character.name))

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
	<Checkbox checked={selected} element={userElement} size="small" contained />

	<div class="thumbnail">
		<img src={imageUrl} alt={name} loading="lazy" />
	</div>

	<div class="info">
		<span class="name">{name}</span>
		<CharacterTags character={{
			element: character.element,
			season: character.season,
			series: character.series
		}} />
	</div>

	<div class="element-cell">
		<ElementLabel {element} size="medium" />
	</div>
</button>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/colors' as colors;

	.row {
		display: flex;
		align-items: center;
		gap: $unit;
		padding: $unit $unit-2x $unit $unit;
		border: none;
		background: transparent;
		cursor: pointer;
		width: 100%;
		text-align: left;
		border-radius: layout.$card-corner;
		transition:
			background 0.15s,
			box-shadow 0.15s;

		&:hover {
			background: var(--list-cell-bg-hover);

			:global(.checkbox.bound:not([data-state='checked'])) {
				background-color: var(--checkbox-bound-bg-hover);
			}
		}

		&:focus-visible {
			outline: 2px solid var(--accent-blue);
			outline-offset: -2px;
		}
	}

	.thumbnail {
		width: 64px;
		height: 64px;
		border-radius: layout.$bubble-menu-item-corner;
		overflow: hidden;
		background: var(--card-bg);
		flex-shrink: 0;

		img {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}
	}

	.info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: $unit-fourth;
		min-width: 0;
	}

	.name {
		font-size: $font-regular;
		color: var(--text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>
