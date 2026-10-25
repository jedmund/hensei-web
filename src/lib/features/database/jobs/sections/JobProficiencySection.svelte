<script lang="ts">
	import type { Job } from '$lib/types/api/entities'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import Select from '$lib/components/ui/Select.svelte'
	import { getProficiencyLabelImage } from '$lib/utils/images'
	import { formatJobProficiency } from '$lib/utils/jobUtils'
	import { getProficiencyOptions } from '$lib/utils/proficiency'

	interface Props {
		job: Job
		editMode?: boolean
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic edit data shape
		editData?: any
	}

	let { job, editMode = false, editData = $bindable() }: Props = $props()

	// Proficiency options for the select dropdowns
	const proficiencyOptions = getProficiencyOptions()

	// Get proficiency names for display
	const proficiencyNames = $derived(formatJobProficiency(job.proficiency))
</script>

<DetailsContainer title="Proficiencies">
	{#if editMode}
		<DetailItem label="Proficiency 1" editable={true}>
			<Select
				size="medium"
				options={proficiencyOptions}
				bind:value={editData.proficiency1}
				contained
			/>
		</DetailItem>
		<DetailItem label="Proficiency 2" editable={true}>
			<Select
				size="medium"
				options={proficiencyOptions}
				bind:value={editData.proficiency2}
				contained
			/>
		</DetailItem>
	{:else}
		<DetailItem label="Proficiency 1">
			{#if proficiencyNames[0]}
				<img
					src={getProficiencyLabelImage(proficiencyNames[0])}
					alt={proficiencyNames[0]}
					class="proficiency-icon"
				/>
			{:else}
				—
			{/if}
		</DetailItem>
		<DetailItem label="Proficiency 2">
			{#if proficiencyNames[1]}
				<img
					src={getProficiencyLabelImage(proficiencyNames[1])}
					alt={proficiencyNames[1]}
					class="proficiency-icon"
				/>
			{:else}
				—
			{/if}
		</DetailItem>
	{/if}
</DetailsContainer>

<style lang="scss">
	.proficiency-icon {
		height: 24px;
		width: auto;
	}
</style>
