
<script lang="ts">
	import type { Cell } from 'wx-svelte-grid'
	import type { Character } from '$lib/types/api/entities'
	import CharacterTags from '$lib/components/tags/CharacterTags.svelte'

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
</script>

<div class="name-cell">
	<span class="name" title={displayName}>{displayName}</span>
	<CharacterTags {character} />
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;

	.name-cell {
		display: flex;
		flex-direction: column;
		gap: $unit-half;
		padding: $unit-half 0;
		min-width: 0;
	}

	.name {
		font-weight: $medium;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
