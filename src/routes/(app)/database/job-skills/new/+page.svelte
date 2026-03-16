
<script lang="ts">
	import { goto } from '$app/navigation'

	import PageMeta from '$lib/components/PageMeta.svelte'
	import * as m from '$lib/paraglide/messages'

	import { createQuery, useQueryClient } from '@tanstack/svelte-query'
	import { jobQueries, jobKeys, jobSkillKeys } from '$lib/api/queries/job.queries'
	import { jobAdapter } from '$lib/api/adapters/job.adapter'

	import DatabaseFormHeader from '$lib/components/database/DatabaseFormHeader.svelte'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'

	import { localizedName } from '$lib/utils/locale'

	const queryClient = useQueryClient()

	// Fetch all jobs for the job selector
	const jobsQuery = createQuery(() => jobQueries.list())

	// Fetch all skills to compute next order
	const allSkillsQuery = createQuery(() => jobQueries.allSkills())

	// Save state
	let isSaving = $state(false)
	let saveError = $state<string | null>(null)

	const skillTypeOptions = [
		{ value: 'main', label: 'Main' },
		{ value: 'sub', label: 'Subskill' },
		{ value: 'emp', label: 'EMP' },
		{ value: 'base', label: 'Base' }
	]

	const colorOptions = [
		{ value: 0, label: 'Yellow' },
		{ value: 1, label: 'Blue' },
		{ value: 2, label: 'Red' },
		{ value: 3, label: 'Green' },
		{ value: 4, label: 'Purple' }
	]

	// Form data
	let editData = $state({
		jobGranblueId: '',
		nameEn: '',
		nameJp: '',
		skillType: 'main' as 'main' | 'sub' | 'emp' | 'base',
		color: 0,
		order: 0,
		imageId: '',
		actionId: 0
	})

	// Build job options from query
	const jobOptions = $derived.by(() => {
		const jobs = jobsQuery.data ?? []
		return [
			{ value: '', label: 'Select a job...' },
			...jobs
				.sort((a, b) => a.row - b.row || (a.order ?? 0) - (b.order ?? 0))
				.map((j) => ({
					value: j.granblueId,
					label: localizedName(j.name)
				}))
		]
	})

	// Auto-generate slug
	function generateSlug(name: string): string {
		return name
			.toLowerCase()
			.replace(/[^a-z0-9\s-]/g, '')
			.replace(/\s+/g, '-')
			.replace(/-+/g, '-')
			.trim()
	}

	const slug = $derived(generateSlug(editData.nameEn))

	// Auto-set order when job changes
	$effect(() => {
		if (allSkillsQuery.data && editData.jobGranblueId) {
			const skills = allSkillsQuery.data
			const jobSkills = skills.filter((s) => s.job?.granblueId === editData.jobGranblueId)
			if (jobSkills.length === 0) {
				editData.order = 1
			} else {
				editData.order = Math.max(...jobSkills.map((s) => s.order ?? 0)) + 1
			}
		}
	})

	// Validation
	const canCreate = $derived(
		editData.nameEn.trim() !== '' && editData.jobGranblueId !== ''
	)

	async function handleCreate() {
		if (!canCreate) return

		isSaving = true
		saveError = null

		try {
			const payload = {
				name_en: editData.nameEn,
				name_jp: editData.nameJp || undefined,
				slug: slug,
				color: editData.color,
				main: editData.skillType === 'main',
				sub: editData.skillType === 'sub',
				emp: editData.skillType === 'emp',
				base: editData.skillType === 'base',
				order: editData.order,
				image_id: editData.imageId || undefined,
				action_id: editData.actionId || undefined
			}

			const skill = await jobAdapter.createSkill(editData.jobGranblueId, payload)

			await queryClient.invalidateQueries({ queryKey: jobKeys.allSkills() })
			await queryClient.invalidateQueries({ queryKey: jobSkillKeys.all })
			await queryClient.invalidateQueries({ queryKey: jobKeys.skills(editData.jobGranblueId) })

			goto(`/database/job-skills/${skill.id}`)
		} catch (error) {
			saveError = 'Failed to create skill. Please try again.'
			console.error('Create error:', error)
		} finally {
			isSaving = false
		}
	}

	function handleCancel() {
		goto('/database/job-skills')
	}
</script>

<PageMeta title={m.page_title_db_new({ type: 'Job Skill' })} description={m.page_desc_home()} />

<div class="page">
	<DatabaseFormHeader
		title="New Job Skill"
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
		<DetailsContainer title="Job">
			<DetailItem
				label="Job"
				bind:value={editData.jobGranblueId}
				editable={true}
				type="select"
				options={jobOptions}
			/>
		</DetailsContainer>

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
				label="Slug"
				value={slug || '(auto-generated from name)'}
				editable={false}
			/>
		</DetailsContainer>

		<DetailsContainer title="Classification">
			<DetailItem
				label="Skill Type"
				bind:value={editData.skillType}
				editable={true}
				type="select"
				options={skillTypeOptions}
			/>
			<DetailItem
				label="Color"
				bind:value={editData.color}
				editable={true}
				type="select"
				options={colorOptions}
			/>
			<DetailItem
				label="Order"
				bind:value={editData.order}
				editable={true}
				type="number"
				placeholder="0"
			/>
		</DetailsContainer>

		<DetailsContainer title="Game Data">
			<DetailItem
				label="Image ID"
				bind:value={editData.imageId}
				editable={true}
				type="text"
				placeholder="e.g. 2710_3"
			/>
			<DetailItem
				label="Action ID"
				bind:value={editData.actionId}
				editable={true}
				type="number"
				placeholder="e.g. 203921"
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
