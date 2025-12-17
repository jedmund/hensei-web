<svelte:options runes={true} />

<script lang="ts">
	import type { Cell } from 'wx-svelte-grid'
	import type { Weapon } from '$lib/types/api/entities'

	const { row }: Cell = $props()

	// Cast row to Weapon type for type safety
	const weapon = row as Weapon

	// Get display name
	const displayName = $derived.by(() => {
		const nameObj = weapon.name
		if (!nameObj) return '—'
		if (typeof nameObj === 'string') return nameObj
		return nameObj.en || nameObj.ja || '—'
	})
</script>

<div class="name-cell">
	<span class="name" title={displayName}>{displayName}</span>
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
