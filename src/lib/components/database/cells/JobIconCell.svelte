
<script lang="ts">
	import type { Cell } from 'wx-svelte-grid'
	import { getJobIconUrl } from '$lib/utils/jobUtils'

	const { row }: Cell = $props()
</script>

<div class="image-cell">
	<img src={getJobIconUrl(row.granblueId)} alt={row.name?.en || ''} class="job-icon" />
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

	.job-icon {
		width: auto;
		height: 32px;
		object-fit: contain;
		border-radius: layout.$item-corner-small;
	}
</style>
