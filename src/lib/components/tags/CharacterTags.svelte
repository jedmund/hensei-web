
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

	// Get English name for a single series entry (for dedup comparisons)
	function getSeriesEntryEnglishName(entry: number | CharacterSeriesRef): string | null {
		if (typeof entry === 'object' && entry !== null && 'name' in entry) {
			return entry.name.en
		}
		if (typeof entry === 'number') {
			return CHARACTER_SERIES_NAMES[entry] ?? null
		}
		return null
	}

	// Compute displayable series indices: filter out Standard and season-duplicate names
	const displayableSeriesIndices = $derived.by(() => {
		if (!character.series || !Array.isArray(character.series) || character.series.length === 0) {
			return []
		}
		const indices: number[] = []
		for (let i = 0; i < character.series.length; i++) {
			const name = getSeriesEntryEnglishName(character.series[i] as number | CharacterSeriesRef)
			if (name === null || name === 'Standard' || name === seasonText) continue
			indices.push(i)
		}
		return indices
	})

	// Special case: Yukata is more specific than Summer, so hide Summer season if Yukata is present
	const hasYukataSeries = $derived.by(() => {
		if (!character.series || !Array.isArray(character.series)) return false
		return character.series.some(
			(entry) => getSeriesEntryEnglishName(entry as number | CharacterSeriesRef) === 'Yukata'
		)
	})
	const isYukataWithSummer = $derived(hasYukataSeries && seasonText === 'Summer')

	// Check if character has season (seasonal variant), but hide if Yukata+Summer
	const hasSeason = $derived(seasonText !== null && !isYukataWithSummer)

	// Check if character is a style swap
	const isStyleSwap = $derived(character.styleSwap === true)

	// Whether any tags should be shown
	const hasTags = $derived(hasSeason || displayableSeriesIndices.length > 0 || isStyleSwap)
</script>

{#if hasTags}
	<div class="tags">
		{#if isStyleSwap}
			<CharacterTag {character} type="style" />
		{/if}
		{#if hasSeason}
			<CharacterTag {character} type="season" />
		{/if}
		{#each displayableSeriesIndices as seriesIndex}
			<CharacterTag {character} type="series" {seriesIndex} />
		{/each}
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
