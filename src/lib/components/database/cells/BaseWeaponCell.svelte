<script lang="ts">
	import type { Cell } from 'wx-svelte-grid'
	import { getWeaponImage } from '$lib/features/database/detail/image'

	const { row }: Cell = $props()

	const forgedFrom = $derived(row.forgedFrom)
	const displayName = $derived.by(() => {
		if (!forgedFrom?.name) return null
		const n = forgedFrom.name
		return typeof n === 'string' ? n : n.en || n.ja || null
	})
</script>

<div class="base-weapon-cell">
	{#if forgedFrom && displayName}
		<img
			src={getWeaponImage(forgedFrom.granblueId, 'square')}
			alt=""
			class="base-weapon-image"
		/>
		<span class="base-weapon-name" title={displayName}>{displayName}</span>
	{:else}
		<span class="empty">—</span>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.base-weapon-cell {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
		height: 100%;
		min-width: 0;
	}

	.base-weapon-image {
		width: 32px;
		height: 32px;
		object-fit: contain;
		border-radius: layout.$item-corner-small;
		flex-shrink: 0;
	}

	.base-weapon-name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: typography.$font-small;
	}

	.empty {
		color: var(--text-tertiary);
	}
</style>
