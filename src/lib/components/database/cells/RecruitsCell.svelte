<script lang="ts">
	import type { Cell } from 'wx-svelte-grid'
	import { getCharacterImage } from '$lib/features/database/detail/image'

	const { row }: Cell = $props()

	const recruits = $derived(row.recruits)
	const displayName = $derived.by(() => {
		if (!recruits?.name) return null
		const n = recruits.name
		return typeof n === 'string' ? n : n.en || n.ja || null
	})
</script>

<div class="recruits-cell">
	{#if recruits && displayName}
		<img
			src={getCharacterImage(recruits.granblueId, 'square')}
			alt=""
			class="recruits-image"
		/>
		<span class="recruits-name" title={displayName}>{displayName}</span>
	{:else}
		<span class="empty">—</span>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.recruits-cell {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
		height: 100%;
		min-width: 0;
	}

	.recruits-image {
		width: 32px;
		height: 32px;
		object-fit: contain;
		border-radius: layout.$item-corner-small;
		flex-shrink: 0;
	}

	.recruits-name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: typography.$font-small;
	}

	.empty {
		color: var(--text-tertiary);
	}
</style>
