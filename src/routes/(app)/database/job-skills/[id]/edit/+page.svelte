
<script lang="ts">
	import { goto } from '$app/navigation'

	import PageMeta from '$lib/components/PageMeta.svelte'
	import * as m from '$lib/paraglide/messages'

	import { createQuery, useQueryClient } from '@tanstack/svelte-query'
	import { jobQueries, jobKeys, jobSkillKeys } from '$lib/api/queries/job.queries'
	import { jobAdapter } from '$lib/api/adapters/job.adapter'
	import { withInitialData } from '$lib/query/ssr'

	import SidebarHeader from '$lib/components/ui/SidebarHeader.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'

	import { localizedName } from '$lib/utils/locale'

	import type { PageData } from './$types'

	let { data }: { data: PageData } = $props()

	const queryClient = useQueryClient()

	const skillQuery = createQuery(() => ({
		...jobQueries.skillById(data.skill?.id ?? ''),
		...withInitialData(data.skill)
	}))

	const skill = $derived(skillQuery.data)

	// Save state
	let isSaving = $state(false)
	let saveError = $state<string | null>(null)
	let saveSuccess = $state(false)

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

	// Editable fields
	let editData = $state({
		nameEn: '',
		nameJp: '',
		slug: '',
		skillType: 'main' as 'main' | 'sub' | 'emp' | 'base',
		color: 0,
		order: 0,
		imageId: '',
		actionId: 0
	})

	// Populate from loaded skill
	$effect(() => {
		if (skill) {
			editData = {
				nameEn: skill.name?.en || '',
				nameJp: skill.name?.ja || '',
				slug: skill.slug || '',
				skillType: skill.main
					? 'main'
					: skill.sub
						? 'sub'
						: skill.emp
							? 'emp'
							: skill.base
								? 'base'
								: 'main',
				color: skill.color ?? 0,
				order: skill.order ?? 0,
				imageId: skill.imageId ?? '',
				actionId: skill.actionId ?? 0
			}
		}
	})

	async function saveChanges() {
		if (!skill?.id || !skill.job?.granblueId) return

		isSaving = true
		saveError = null
		saveSuccess = false

		try {
			const payload = {
				name_en: editData.nameEn,
				name_jp: editData.nameJp || undefined,
				slug: editData.slug,
				color: editData.color,
				main: editData.skillType === 'main',
				sub: editData.skillType === 'sub',
				emp: editData.skillType === 'emp',
				base: editData.skillType === 'base',
				order: editData.order,
				image_id: editData.imageId || undefined,
				action_id: editData.actionId || undefined
			}

			await jobAdapter.updateSkill(skill.job.granblueId, skill.id, payload)

			await queryClient.invalidateQueries({ queryKey: jobKeys.allSkills() })
			await queryClient.invalidateQueries({ queryKey: jobSkillKeys.all })
			await queryClient.invalidateQueries({ queryKey: jobKeys.skills(skill.job.granblueId) })

			saveSuccess = true
			setTimeout(() => {
				goto(`/database/job-skills/${skill!.id}`)
			}, 500)
		} catch (error) {
			saveError = 'Failed to save changes. Please try again.'
			console.error('Save error:', error)
		} finally {
			isSaving = false
		}
	}

	function handleCancel() {
		goto(`/database/job-skills/${skill?.id}`)
	}

	const pageTitle = $derived(
		m.page_title_db_edit({ name: skill?.name?.en ?? 'Job Skill' })
	)
</script>

<PageMeta title={pageTitle} description={m.page_desc_home()} />

<div class="page">
	{#if skill}
		<SidebarHeader title="Edit: {localizedName(skill.name)}">
			{#snippet leftAccessory()}
				<Button variant="secondary" size="small" onclick={handleCancel} disabled={isSaving}>
					Cancel
				</Button>
			{/snippet}
			{#snippet rightAccessory()}
				<Button variant="primary" size="small" onclick={saveChanges} disabled={isSaving}>
					{isSaving ? 'Saving...' : 'Save'}
				</Button>
			{/snippet}
		</SidebarHeader>

		{#if saveError}
			<div class="error-banner">{saveError}</div>
		{/if}

		{#if saveSuccess}
			<div class="success-banner">Changes saved successfully!</div>
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
					label="Slug"
					bind:value={editData.slug}
					editable={true}
					type="text"
					placeholder="e.g. double-trouble"
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
	{:else if skillQuery.isLoading}
		<div class="loading">Loading skill...</div>
	{:else}
		<div class="error">Failed to load skill</div>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.page {
		background: var(--card-bg);
		border-radius: layout.$card-corner;
		box-shadow: var(--shadow-sm);
	}

	.details {
		display: flex;
		flex-direction: column;
	}

	.error-banner {
		color: var(--danger);
		font-size: typography.$font-small;
		padding: spacing.$unit-2x;
		background: var(--danger-bg);
	}

	.success-banner {
		color: var(--success);
		font-size: typography.$font-small;
		padding: spacing.$unit-2x;
		background: var(--success-bg);
	}

	.loading,
	.error {
		text-align: center;
		padding: spacing.$unit * 4;
		color: var(--text-secondary);
	}

	.error {
		color: var(--red);
	}
</style>
