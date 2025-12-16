<svelte:options runes={true} />

<script lang="ts">
	import type { Cell } from 'wx-svelte-grid'
	import type { Character } from '$lib/types/api/entities'
	import type { CharacterSeriesRef } from '$lib/types/api/characterSeries'
	import CharacterTag from '$lib/components/tags/CharacterTag.svelte'
	import { CHARACTER_SEASON_NAMES, CHARACTER_SERIES_NAMES } from '$lib/types/enums'

	const { row }: Cell = $props()

	// Cast row to Character type for type safety
	const character = row as Character

	// Get display name
	const displayName = $derived.by(() => {
		const nameObj = character.name
		if (!nameObj) return '—'
		if (typeof nameObj === 'string') return nameObj
		return nameObj.en || nameObj.ja || '—'
	})

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

	// Check if character has season (seasonal variant)
	const hasSeason = $derived(seasonText !== null)

	// Check if character has series with different text than season
	const hasDistinctSeries = $derived(seriesText !== null && seriesText !== seasonText)
</script>

<div class="name-cell">
	<span class="name">{displayName}</span>
	{#if hasSeason || hasDistinctSeries}
		<div class="tags">
			{#if hasSeason}
				<CharacterTag {character} type="season" />
			{/if}
			{#if hasDistinctSeries}
				<CharacterTag {character} type="series" />
			{/if}
		</div>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;

	.name-cell {
		display: flex;
		flex-direction: column;
		gap: $unit-half;
		padding: $unit-half 0;
	}

	.name {
		font-weight: $medium;
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: $unit-half;
	}
</style>
