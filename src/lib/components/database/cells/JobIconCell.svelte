<svelte:options runes={true} />

<script lang="ts">
	import type { Cell } from 'wx-svelte-grid'
	import { getJobIconUrl } from '$lib/utils/jobUtils'

	const { row }: Cell = $props()
</script>

<div class="image-cell">
	<img src={getJobIconUrl(row.granblueId)} alt={row.name?.en || ''} class="job-icon" />
</div>

<style lang="scss">
	.image-cell {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		padding: 4px;
	}

	.job-icon {
		width: auto;
		height: 32px;
		object-fit: contain;
		border-radius: 4px;
	}
</style>
