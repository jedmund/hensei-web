<svelte:options runes={true} />

<script lang="ts">
	import type { Cell } from 'wx-svelte-grid'
	import type { Character } from '$lib/types/api/entities'
	import CharacterTag from '$lib/components/tags/CharacterTag.svelte'

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

	// Check if character has season (seasonal variant)
	const hasSeason = $derived(
		character.season !== undefined && character.season !== null && character.season > 0
	)

	// Check if character has series (need to check for non-empty array)
	const hasSeries = $derived.by(() => {
		if (!character.series || !Array.isArray(character.series)) return false
		return character.series.length > 0
	})
</script>

<div class="name-cell">
	<span class="name">{displayName}</span>
	{#if hasSeason || hasSeries}
		<div class="tags">
			{#if hasSeason}
				<CharacterTag {character} type="season" />
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
