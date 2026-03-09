
<script lang="ts">
	import type { Job } from '$lib/types/api/entities'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import CopyableText from '$lib/components/ui/CopyableText.svelte'
	import Select from '$lib/components/ui/Select.svelte'
	import { getJobTierName } from '$lib/utils/jobUtils'

	interface Props {
		job: Job
		editMode?: boolean
		editData?: any
	}

	let { job, editMode = false, editData = $bindable() }: Props = $props()

	// Row options for the select dropdown
	const rowOptions = [
		{ value: '1', label: 'Class I' },
		{ value: '2', label: 'Class II' },
		{ value: '3', label: 'Class III' },
		{ value: '4', label: 'Class IV' },
		{ value: '5', label: 'Class V' },
		{ value: 'ex', label: 'Extra' },
		{ value: 'ex2', label: 'Extra II' },
		{ value: 'o1', label: 'Origin I' }
	]
</script>

<DetailsContainer title="Metadata">
	{#if editMode}
		<DetailItem
			label="Name (EN)"
			bind:value={editData.name}
			editable={true}
			type="text"
			placeholder="English name"
		/>
		<DetailItem
			label="Name (JP)"
			bind:value={editData.nameJp}
			editable={true}
			type="text"
			placeholder="日本語名"
		/>
		<DetailItem
			label="Granblue ID"
			bind:value={editData.granblueId}
			editable={true}
			type="text"
			placeholder="Granblue ID"
		/>
		<DetailItem label="Row" editable={true}>
			<Select size="medium" options={rowOptions} bind:value={editData.row} contained />
		</DetailItem>
		<DetailItem
			label="Order"
			bind:value={editData.order}
			editable={true}
			type="number"
			placeholder="Display order"
		/>
	{:else}
		<DetailItem label="Name (EN)" value={job.name?.en || '—'} />
		<DetailItem label="Name (JP)" value={job.name?.ja || '—'} />
		<DetailItem label="Granblue ID">
			{#if job.granblueId}
				<CopyableText value={job.granblueId} />
			{:else}
				—
			{/if}
		</DetailItem>
		<DetailItem label="Row" value={getJobTierName(job.row)} />
		<DetailItem label="Order" value={job.order?.toString() || '—'} />
	{/if}
</DetailsContainer>
