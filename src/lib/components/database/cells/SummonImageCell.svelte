<svelte:options runes={true} />

<script lang="ts">
	import type { Cell } from 'wx-svelte-grid'
	import { getSummonImage } from '$lib/features/database/detail/image'

	const { row }: Cell = $props()
</script>

<div class="image-cell">
	<img src={getSummonImage(row.granblueId, 'square')} alt="" class="database-image" />
</div>

<style lang="scss">
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;

	.image-cell {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		padding: spacing.$unit-half;
	}

	.database-image {
		max-width: 100%;
		max-height: 60px;
		width: auto;
		height: auto;
		object-fit: contain;
		border-radius: layout.$item-corner-small;
	}
</style>