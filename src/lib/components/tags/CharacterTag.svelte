<svelte:options runes={true} />

<script lang="ts">
	import type { Character } from '$lib/types/api/entities'
	import type { CharacterSeriesRef } from '$lib/types/api/characterSeries'
	import { getElementLabel } from '$lib/utils/element'
	import { CHARACTER_SEASON_NAMES, CHARACTER_SERIES_NAMES } from '$lib/types/enums'

	type TagType = 'element' | 'season' | 'series'

	interface Props {
		/** The character to display the tag for */
		character: Character
		/** Which characteristic to display */
		type: TagType
		/** Optional specific series index to display (for multi-series characters) */
		seriesIndex?: number
	}

	let { character, type, seriesIndex = 0 }: Props = $props()

	// Get element class name for styling
	const elementClass = $derived.by(() => {
		const element = character.element
		switch (element) {
			case 1:
				return 'wind'
			case 2:
				return 'fire'
			case 3:
				return 'water'
			case 4:
				return 'earth'
			case 5:
				return 'dark'
			case 6:
				return 'light'
			default:
				return 'neutral'
		}
	})

	// Get the display text based on tag type
	const displayText = $derived.by(() => {
		switch (type) {
			case 'element':
				return getElementLabel(character.element)

			case 'season':
				if (character.season === undefined || character.season === null) return null
				return CHARACTER_SEASON_NAMES[character.season] ?? null

			case 'series':
				// Handle array of CharacterSeriesRef objects
				if (character.series && Array.isArray(character.series)) {
					const seriesArray = character.series as (number | CharacterSeriesRef)[]
					const seriesValue = seriesArray[seriesIndex]

					if (seriesValue === undefined) return null

					// Check if it's an object (CharacterSeriesRef) or number
					if (typeof seriesValue === 'object' && seriesValue !== null && 'name' in seriesValue) {
						return seriesValue.name.en
					}
					// Legacy number format
					if (typeof seriesValue === 'number') {
						return CHARACTER_SERIES_NAMES[seriesValue] ?? null
					}
				}
				// Fallback to seriesNames if available
				if (character.seriesNames && character.seriesNames[seriesIndex]) {
					return character.seriesNames[seriesIndex]
				}
				return null

			default:
				return null
		}
	})

	// Only render if we have text to display
	const shouldRender = $derived(displayText !== null && displayText !== '—')
</script>

{#if shouldRender}
	<span class="character-tag {elementClass}">
		{displayText}
	</span>
{/if}

<style lang="scss">
	@use '$src/themes/colors' as *;
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;

	.character-tag {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: $unit-fourth $unit;
		border-radius: $item-corner-small;
		font-size: $font-tiny;
		font-weight: $medium;
		white-space: nowrap;
		line-height: 1;

		// Element-specific styling
		&.wind {
			background-color: $wind-bg-20;
			color: $wind-text-20;
		}

		&.fire {
			background-color: $fire-bg-20;
			color: $fire-text-20;
		}

		&.water {
			background-color: $water-bg-20;
			color: $water-text-20;
		}

		&.earth {
			background-color: $earth-bg-20;
			color: $earth-text-20;
		}

		&.dark {
			background-color: $dark-bg-20;
			color: $dark-text-20;
		}

		&.light {
			background-color: $light-bg-20;
			color: $light-text-20;
		}

		&.neutral {
			background-color: $grey-80;
			color: $grey-40;
		}
	}

	// Dark mode adjustments
	:global(.dark) .character-tag {
		&.wind {
			background-color: $wind-text-10;
			color: $wind-bg-20;
		}

		&.fire {
			background-color: $fire-text-10;
			color: $fire-bg-20;
		}

		&.water {
			background-color: $water-text-10;
			color: $water-bg-20;
		}

		&.earth {
			background-color: $earth-text-10;
			color: $earth-bg-20;
		}

		&.dark {
			background-color: $dark-text-10;
			color: $dark-bg-20;
		}

		&.light {
			background-color: $light-text-10;
			color: $light-bg-20;
		}

		&.neutral {
			background-color: $grey-30;
			color: $grey-80;
		}
	}
</style>
