
<script lang="ts">
	import type { Cell } from 'wx-svelte-grid'
	import type { JobAccessory } from '$lib/types/api/entities'
	import { getJobIconUrl } from '$lib/utils/jobUtils'

	const { row }: Cell = $props()

	const accessory = row as JobAccessory
	const jobName = $derived(accessory.job?.name?.en ?? '—')
	const jobIcon = $derived(accessory.job ? getJobIconUrl(accessory.job.granblueId) : undefined)
</script>

<div class="job-cell">
	{#if jobIcon}
		<img src={jobIcon} alt="" class="job-icon" />
	{/if}
	<span class="job-name">{jobName}</span>
</div>

<style lang="scss">
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.job-cell {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
		min-width: 0;
	}

	.job-icon {
		width: auto;
		height: 24px;
		object-fit: contain;
		border-radius: layout.$item-corner-small;
		flex-shrink: 0;
	}

	.job-name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
