
<script lang="ts">
	import type { CharacterSeriesRef } from '$lib/types/api/characterSeries'
	import CharacterTag from './CharacterTag.svelte'
	import { CHARACTER_SEASON_NAMES, CHARACTER_SERIES_NAMES } from '$lib/types/enums'

	/** Minimal character data needed for tag display */
	interface CharacterForTags {
		element?: number | null
		season?: number | null
		series?: (number | CharacterSeriesRef)[] | null
		seriesNames?: string[] | null
		styleSwap?: boolean
	}

	interface Props {
		character: CharacterForTags
	}

	let { character }: Props = $props()

	// Get season text for comparison
	const seasonText = $derived.by(() => {
		if (character.season === undefined || character.season === null || character.season <= 0) {
			return null
		}
		return CHARACTER_SEASON_NAMES[character.season] ?? null
	})

	// Get first series text for comparison
	const seriesText = $derived.by(() => {
		if (!character.series || !Array.isArray(character.series) || character.series.length === 0) {
			return null
		}
		const seriesValue = character.series[0] as number | CharacterSeriesRef
		if (typeof seriesValue === 'object' && seriesValue !== null && 'name' in seriesValue) {
			return seriesValue.name.en
		}
		if (typeof seriesValue === 'number') {
			return CHARACTER_SERIES_NAMES[seriesValue] ?? null
		}
		return null
	})

	// Special case: Yukata is more specific than Summer, so hide Summer if Yukata is present
	const isYukataWithSummer = $derived(seriesText === 'Yukata' && seasonText === 'Summer')

	// Check if character has season (seasonal variant), but hide if Yukata+Summer
	const hasSeason = $derived(seasonText !== null && !isYukataWithSummer)

	// Check if character has series with different text than season (exclude "Standard")
	const hasDistinctSeries = $derived(
		seriesText !== null && seriesText !== seasonText && seriesText !== 'Standard'
	)

	// Check if character is a style swap
	const isStyleSwap = $derived(character.styleSwap === true)

	// Whether any tags should be shown
	const hasTags = $derived(hasSeason || hasDistinctSeries || isStyleSwap)
</script>

{#if hasTags}
	<div class="tags">
		{#if isStyleSwap}
			<CharacterTag {character} type="style" />
		{/if}
		{#if hasSeason}
			<CharacterTag {character} type="season" />
		{/if}
		{#if hasDistinctSeries}
			<CharacterTag {character} type="series" />
		{/if}
	</div>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as *;

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: $unit-half;
	}
</style>
