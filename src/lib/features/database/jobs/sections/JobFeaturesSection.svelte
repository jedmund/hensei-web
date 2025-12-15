<svelte:options runes={true} />

<script lang="ts">
	import type { Job } from '$lib/types/api/entities'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import Checkbox from '$lib/components/ui/checkbox/Checkbox.svelte'
	import Select from '$lib/components/ui/Select.svelte'

	interface Props {
		job: Job
		editMode?: boolean
		editData?: any
	}

	let { job, editMode = false, editData = $bindable() }: Props = $props()

	// Accessory type options
	const accessoryTypeOptions = [
		{ value: 0, label: 'None' },
		{ value: 1, label: 'Shield' },
		{ value: 2, label: 'Manatura' }
	]

	function getAccessoryTypeName(type: number | undefined): string {
		const option = accessoryTypeOptions.find((o) => o.value === type)
		return option?.label || '—'
	}

	function formatBoolean(value: boolean | undefined): string {
		return value ? 'Yes' : 'No'
	}
</script>

<DetailsContainer title="Features">
	{#if editMode}
		<DetailItem label="Master Level" editable={true}>
			<Checkbox bind:checked={editData.masterLevel} contained />
		</DetailItem>
		<DetailItem label="Ultimate Mastery" editable={true}>
			<Checkbox bind:checked={editData.ultimateMastery} contained />
		</DetailItem>
		<DetailItem label="Has Accessory" editable={true}>
			<Checkbox bind:checked={editData.accessory} contained />
		</DetailItem>
		{#if editData.accessory}
			<DetailItem label="Accessory Type" editable={true}>
				<Select
					size="medium"
					options={accessoryTypeOptions}
					bind:value={editData.accessoryType}
					contained
				/>
			</DetailItem>
		{/if}
	{:else}
		<DetailItem label="Master Level">
			<span class="boolean-indicator" class:yes={job.masterLevel}>
				{formatBoolean(job.masterLevel)}
			</span>
		</DetailItem>
		<DetailItem label="Ultimate Mastery">
			<span class="boolean-indicator" class:yes={job.ultimateMastery}>
				{formatBoolean(job.ultimateMastery)}
			</span>
		</DetailItem>
		<DetailItem label="Has Accessory">
			<span class="boolean-indicator" class:yes={job.accessory}>
				{formatBoolean(job.accessory)}
			</span>
		</DetailItem>
		{#if job.accessory}
			<DetailItem label="Accessory Type" value={getAccessoryTypeName(job.accessoryType)} />
		{/if}
	{/if}
</DetailsContainer>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/typography' as typography;

	.boolean-indicator {
		font-size: typography.$font-regular;
		color: colors.$grey-50;

		&.yes {
			color: colors.$wind-bg-00;
		}
	}
</style>
