<svelte:options runes={true} />

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
	import { withInitialData } from '$lib/query/ssr'

	// Components
	import DetailScaffold from '$lib/features/database/detail/DetailScaffold.svelte'

	// Section Components
	import JobMetadataSection from '$lib/features/database/jobs/sections/JobMetadataSection.svelte'
	import JobProficiencySection from '$lib/features/database/jobs/sections/JobProficiencySection.svelte'
	import JobFeaturesSection from '$lib/features/database/jobs/sections/JobFeaturesSection.svelte'

	// Utils
	import { getJobIconUrl } from '$lib/utils/jobUtils'

	// Types
	import type { PageData } from './$types'

	let { data }: { data: PageData } = $props()

	const queryClient = useQueryClient()

	// Use TanStack Query with SSR initial data
	const jobQuery = createQuery(() => ({
		...jobQueries.byId(data.job?.granblueId ?? ''),
		...withInitialData(data.job)
	}))

	// Get job from query
	const job = $derived(jobQuery.data)

	// Always in edit mode
	const editMode = true

	// Save state
	let isSaving = $state(false)
	let saveError = $state<string | null>(null)
	let saveSuccess = $state(false)

	// Editable fields - initialized from job data
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

	// Populate edit data when job loads
	$effect(() => {
		if (job) {
			editData = {
				name: job.name?.en || '',
				nameJp: job.name?.ja || '',
				granblueId: job.granblueId || '',
				row: job.row?.toString() || '1',
				order: job.order || 0,
				proficiency1: job.proficiency?.[0] || 0,
				proficiency2: job.proficiency?.[1] || 0,
				masterLevel: job.masterLevel || false,
				ultimateMastery: job.ultimateMastery || false,
				auxWeapon: job.auxWeapon || false,
				accessory: job.accessory || false,
				accessoryType: job.accessoryType || 0
			}
		}
	})

	async function saveChanges() {
		if (!job?.granblueId) return

		isSaving = true
		saveError = null
		saveSuccess = false

		try {
			// Prepare the data for API (flat snake_case format)
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

			await jobAdapter.updateJob(job.granblueId, payload)

			// Invalidate TanStack Query cache to refetch fresh data
			await queryClient.invalidateQueries({ queryKey: jobKeys.all })

			saveSuccess = true

			// Navigate back to detail page after a short delay
			setTimeout(() => {
				goto(`/database/jobs/${editData.granblueId}`)
			}, 500)
		} catch (error) {
			saveError = 'Failed to save changes. Please try again.'
			console.error('Save error:', error)
		} finally {
			isSaving = false
		}
	}

	function handleCancel() {
		goto(`/database/jobs/${job?.granblueId}`)
	}

	// Page title
	const pageTitle = $derived(m.page_title_db_edit({ name: job?.name?.en ?? 'Job' }))
</script>

<PageMeta title={pageTitle} description={m.page_desc_home()} />

<div class="page">
	{#if job}
		<DetailScaffold
			type="job"
			item={job}
			image={getJobIconUrl(job.granblueId)}
			showEdit={true}
			{editMode}
			{isSaving}
			{saveSuccess}
			{saveError}
			onSave={saveChanges}
			onCancel={handleCancel}
		>
			<section class="details">
				<JobMetadataSection {job} {editMode} bind:editData />
				<JobProficiencySection {job} {editMode} bind:editData />
				<JobFeaturesSection {job} {editMode} bind:editData />
			</section>
		</DetailScaffold>
	{:else}
		<div class="not-found">
			<h2>Job Not Found</h2>
			<p>The job you're looking for could not be found.</p>
			<button onclick={() => goto('/database/jobs')}>Back to Jobs</button>
		</div>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;

	.page {
		background: var(--card-bg);
		border-radius: layout.$card-corner;
		box-shadow: var(--shadow-sm);
	}

	.details {
		display: flex;
		flex-direction: column;
	}

	.not-found {
		text-align: center;
		padding: spacing.$unit * 4;

		button {
			background: colors.$blue;
			color: white;
			border: none;
			padding: spacing.$unit spacing.$unit-2x;
			border-radius: layout.$item-corner;
			cursor: pointer;
			margin-top: spacing.$unit;

			&:hover {
				filter: brightness(0.9);
			}
		}
	}
</style>
