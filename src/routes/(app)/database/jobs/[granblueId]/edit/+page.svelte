
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
	import DatabaseFormHeader from '$lib/components/database/DatabaseFormHeader.svelte'
	import NotFoundPlaceholder from '$lib/components/database/NotFoundPlaceholder.svelte'

	// Section Components
	import JobMetadataSection from '$lib/features/database/jobs/sections/JobMetadataSection.svelte'
	import JobProficiencySection from '$lib/features/database/jobs/sections/JobProficiencySection.svelte'
	import JobFeaturesSection from '$lib/features/database/jobs/sections/JobFeaturesSection.svelte'

	// Utils
	import { localizedName } from '$lib/utils/locale'
	import { localizeHref } from '$lib/paraglide/runtime'

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

			await queryClient.invalidateQueries({ queryKey: jobKeys.all })

			saveSuccess = true

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
		<DatabaseFormHeader
			title="Edit Job"
			onCancel={handleCancel}
			onSave={saveChanges}
			{isSaving}
		/>

		{#if saveError}
			<div class="error-banner">{saveError}</div>
		{/if}

		{#if saveSuccess}
			<div class="success-banner">Changes saved successfully!</div>
		{/if}

		<section class="details">
			<JobMetadataSection {job} {editMode} bind:editData />
			<JobProficiencySection {job} {editMode} bind:editData />
			<JobFeaturesSection {job} {editMode} bind:editData />
		</section>
	{:else}
		<NotFoundPlaceholder
			title="Job Not Found"
			message="The job you're looking for could not be found."
			backHref={localizeHref('/database/jobs')}
			backLabel="Back to Jobs"
		/>
	{/if}
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

	.success-banner {
		@include database.success-banner;
	}
</style>
