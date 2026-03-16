
<script lang="ts">
	// SvelteKit imports
	import { goto } from '$app/navigation'

	// Page metadata
	import PageMeta from '$lib/components/PageMeta.svelte'
	import * as m from '$lib/paraglide/messages'

	// TanStack Query
	import { createQuery, useQueryClient } from '@tanstack/svelte-query'
	import { jobQueries, jobKeys } from '$lib/api/queries/job.queries'
	import { jobAdapter } from '$lib/api/adapters/job.adapter'

	// Components
	import DatabaseFormHeader from '$lib/components/database/DatabaseFormHeader.svelte'

	// Types
	import type { Job } from '$lib/types/api/entities'

	// Section Components
	import JobMetadataSection from '$lib/features/database/jobs/sections/JobMetadataSection.svelte'
	import JobProficiencySection from '$lib/features/database/jobs/sections/JobProficiencySection.svelte'
	import JobFeaturesSection from '$lib/features/database/jobs/sections/JobFeaturesSection.svelte'

	const queryClient = useQueryClient()

	// Fetch all jobs to compute next order per row
	const allJobsQuery = createQuery(() => jobQueries.list())

	function getNextOrderForRow(row: string): number {
		const jobs = allJobsQuery.data ?? []
		const jobsInRow = jobs.filter((j) => String(j.row) === row)
		if (jobsInRow.length === 0) return 1
		return Math.max(...jobsInRow.map((j) => j.order ?? 0)) + 1
	}

	// Save state
	let isSaving = $state(false)
	let saveError = $state<string | null>(null)

	// Empty job for section components
	const emptyJob: Job = {
		id: '',
		name: { en: '', ja: '' },
		granblueId: '',
		row: 1,
		order: 0,
		proficiency: [0, 0] as [number, number],
		masterLevel: false,
		ultimateMastery: false,
		auxWeapon: false,
		accessory: false,
		accessoryType: 0
	}

	// Always in edit mode for new job
	const editMode = true

	// Editable fields - same shape as the edit page
	let editData = $state({
		name: '',
		nameJp: '',
		granblueId: '',
		row: '1',
		order: 0,
		proficiency1: 0,
		proficiency2: 0,
		masterLevel: false,
		ultimateMastery: false,
		auxWeapon: false,
		accessory: false,
		accessoryType: 0
	})

	// Auto-set order when row changes or jobs load
	$effect(() => {
		if (allJobsQuery.data) {
			editData.order = getNextOrderForRow(editData.row)
		}
	})

	// Validation
	const canCreate = $derived(
		editData.name.trim() !== '' && editData.granblueId.trim() !== ''
	)

	async function handleCreate() {
		if (!canCreate) return

		isSaving = true
		saveError = null

		try {
			const payload = {
				name_en: editData.name,
				name_jp: editData.nameJp,
				granblue_id: editData.granblueId,
				row: editData.row,
				order: editData.order,
				proficiency1: editData.proficiency1,
				proficiency2: editData.proficiency2,
				master_level: editData.masterLevel,
				ultimate_mastery: editData.ultimateMastery,
				aux_weapon: editData.auxWeapon,
				accessory: editData.accessory,
				accessory_type: editData.accessoryType
			}

			const job = await jobAdapter.createJob(payload)

			// Invalidate cache
			await queryClient.invalidateQueries({ queryKey: jobKeys.all })

			// Navigate to the new job
			goto(`/database/jobs/${job.granblueId}`)
		} catch (error) {
			saveError = 'Failed to create job. Please try again.'
			console.error('Create error:', error)
		} finally {
			isSaving = false
		}
	}

	function handleCancel() {
		goto('/database/jobs')
	}
</script>

<PageMeta title={m.page_title_db_new({ type: 'Job' })} description={m.page_desc_home()} />

<div class="page">
	<DatabaseFormHeader
		title="New Job"
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
		<JobMetadataSection job={emptyJob} {editMode} bind:editData />
		<JobProficiencySection job={emptyJob} {editMode} bind:editData />
		<JobFeaturesSection job={emptyJob} {editMode} bind:editData />
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
