
<script lang="ts">
	import type { Cell } from 'wx-svelte-grid'
	import { getJobAccessoryImageUrl } from '$lib/utils/jobAccessoryUtils'

	const { row }: Cell = $props()
</script>

<div class="image-cell">
	<img src={getJobAccessoryImageUrl(row.granblueId)} alt="" class="database-image" />
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
		max-height: 48px;
		width: auto;
		height: auto;
		object-fit: contain;
		border-radius: layout.$item-corner-small;
	}
</style>
