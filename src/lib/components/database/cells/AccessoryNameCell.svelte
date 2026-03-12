
<script lang="ts">
	import type { Cell } from 'wx-svelte-grid'
	import type { JobAccessory } from '$lib/types/api/entities'

	const { row }: Cell = $props()

	const accessory = row as JobAccessory

	const displayName = $derived.by(() => {
		const nameObj = accessory.name
		if (!nameObj) return '—'
		if (typeof nameObj === 'string') return nameObj
		return nameObj.en || nameObj.ja || '—'
	})

	const jaName = $derived(accessory.name?.ja)
</script>

<div class="name-cell">
	<span class="name" title={displayName}>{displayName}</span>
	{#if jaName}
		<span class="name-ja">{jaName}</span>
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
		min-width: 0;
	}

	.name {
		font-weight: $medium;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.name-ja {
		font-size: $font-small;
		color: var(--text-secondary);
	}
</style>
