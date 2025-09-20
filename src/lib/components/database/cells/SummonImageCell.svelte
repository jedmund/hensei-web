<svelte:options runes={true} />

<script lang="ts">
	import type { IRow } from 'wx-svelte-grid'
	import { getSummonImage } from '$lib/features/database/detail/image'

	interface Props {
		row: IRow
	}

	const { row }: Props = $props()
</script>

<div class="image-cell">
	<img src={getSummonImage(row.granblueId, 'square')} alt="" class="database-image" />
</div>

<style lang="scss">
	.image-cell {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		padding: 4px;
	}

	.database-image {
		max-width: 100%;
		max-height: 60px;
		width: auto;
		height: auto;
		object-fit: contain;
		border-radius: 4px;
	}
</style>