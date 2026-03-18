
<script lang="ts">
	// SvelteKit imports
	import { goto } from '$app/navigation'

	// Page metadata
	import PageMeta from '$lib/components/PageMeta.svelte'
	import * as m from '$lib/paraglide/messages'

	// TanStack Query
	import { createQuery, useQueryClient } from '@tanstack/svelte-query'
	import { jobQueries, jobAccessoryKeys } from '$lib/api/queries/job.queries'
	import { jobAdapter } from '$lib/api/adapters/job.adapter'

	// Components
	import DatabaseFormHeader from '$lib/components/database/DatabaseFormHeader.svelte'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'

	// Utils
	import { getAccessoryTypeOptions } from '$lib/utils/jobAccessoryUtils'
	import { getRarityOptions } from '$lib/utils/rarity'

	const queryClient = useQueryClient()

	// Fetch all jobs to auto-resolve job_id from accessory type
	const jobsQuery = createQuery(() => jobQueries.list())
	const matchedJob = $derived(
		jobsQuery.data?.find(
			(job) => job.accessory && job.accessoryType === editData.accessoryType
		)
	)

	// Save state
	let isSaving = $state(false)
	let saveError = $state<string | null>(null)

	// Form data
	let editData = $state({
		nameEn: '',
		nameJp: '',
		granblueId: '',
		accessoryType: 1,
		rarity: 3,
		releaseDate: ''
	})

	const accessoryTypeOptions = getAccessoryTypeOptions()
	const rarityOptions = getRarityOptions()

	// Validation
	const canCreate = $derived(
		editData.nameEn.trim() !== '' && editData.granblueId.trim() !== ''
	)

	async function handleCreate() {
		if (!canCreate) return

		isSaving = true
		saveError = null

		try {
			const payload = {
				name_en: editData.nameEn,
				name_jp: editData.nameJp,
				granblue_id: editData.granblueId,
				accessory_type: editData.accessoryType,
				rarity: editData.rarity,
				release_date: editData.releaseDate || undefined,
				job_id: matchedJob?.id
			}

			const accessory = await jobAdapter.createAccessory(payload)

			// Invalidate cache
			await queryClient.invalidateQueries({ queryKey: jobAccessoryKeys.all })

			// Navigate to the new accessory
			goto(`/database/job-accessories/${accessory.granblueId}`)
		} catch (error) {
			saveError = 'Failed to create accessory. Please try again.'
			console.error('Create error:', error)
		} finally {
			isSaving = false
		}
	}

	function handleCancel() {
		goto('/database/jobs?view=accessories')
	}
</script>

<PageMeta title={m.page_title_db_new({ type: 'Job Accessory' })} description={m.page_desc_home()} />

<div class="page">
	<DatabaseFormHeader
		title="New Job Accessory"
		onCancel={handleCancel}
		onSave={handleCreate}
		{isSaving}
		disabled={!canCreate}
		saveLabel="Create"
		savingLabel="Creating..."
	/>

	{#if saveError}
		<div class="error-banner">{saveError}</div>
	{/if}

	<section class="details">
		<DetailsContainer title="Basic Info">
			<DetailItem
				label="Name (EN)"
				bind:value={editData.nameEn}
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
				placeholder="e.g., 1234567"
			/>
		</DetailsContainer>

		<DetailsContainer title="Classification">
			<DetailItem
				label="Accessory Type"
				bind:value={editData.accessoryType}
				editable={true}
				type="select"
				options={accessoryTypeOptions}
			/>
			<DetailItem
				label="Rarity"
				bind:value={editData.rarity}
				editable={true}
				type="select"
				options={rarityOptions}
			/>
			<DetailItem
				label="Release Date"
				bind:value={editData.releaseDate}
				editable={true}
				type="date"
			/>
		</DetailsContainer>
	</section>
</div>

<style lang="scss">
	@use '$src/themes/layout' as layout;
	@use '$src/themes/database' as database;

	.page {
		background: var(--card-bg);
		border-radius: layout.$card-corner;
		box-shadow: var(--shadow-sm);
	}

	.details {
		@include database.details;
	}

	.error-banner {
		@include database.error-banner;
	}
</style>
