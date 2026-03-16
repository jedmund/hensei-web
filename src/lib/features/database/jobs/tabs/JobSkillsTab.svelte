
<script lang="ts">
	import { goto } from '$app/navigation'
	import type { Job, JobSkill } from '$lib/types/api/entities'
	import { createQuery, useQueryClient } from '@tanstack/svelte-query'
	import { jobQueries, jobKeys } from '$lib/api/queries/job.queries'
	import { jobAdapter } from '$lib/api/adapters/job.adapter'
	import { localizeHref } from '$lib/paraglide/runtime'
	import Button from '$lib/components/ui/Button.svelte'
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import ModalHeader from '$lib/components/ui/ModalHeader.svelte'
	import ModalBody from '$lib/components/ui/ModalBody.svelte'
	import ModalFooter from '$lib/components/ui/ModalFooter.svelte'
	import SkillRow from './SkillRow.svelte'

	interface Props {
		job: Job
		canEdit?: boolean
	}

	let { job, canEdit = false }: Props = $props()

	const queryClient = useQueryClient()

	const skillsQuery = createQuery(() => jobQueries.skillsByJob(job.granblueId))

	// Delete dialog state
	let deleteDialogOpen = $state(false)
	let skillToDelete = $state<JobSkill | undefined>(undefined)
	let isDeleting = $state(false)

	const skillGroups = [
		{ key: 'main' as const, title: 'Main Skills' },
		{ key: 'sub' as const, title: 'Subskills' },
		{ key: 'emp' as const, title: 'EMP Skills' },
		{ key: 'base' as const, title: 'Base Skills' }
	]

	const groupedSkills = $derived.by(() => {
		const skills = skillsQuery.data ?? []
		const groups: Record<'main' | 'sub' | 'emp' | 'base', JobSkill[]> = {
			main: [],
			sub: [],
			emp: [],
			base: []
		}

		for (const skill of skills) {
			if (skill.main) groups.main.push(skill)
			else if (skill.sub) groups.sub.push(skill)
			else if (skill.emp) groups.emp.push(skill)
			else if (skill.base) groups.base.push(skill)
		}

		for (const key of Object.keys(groups) as Array<keyof typeof groups>) {
			groups[key].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
		}

		return groups
	})

	function handleAddSkill() {
		goto(localizeHref(`/database/job-skills/new?job=${job.granblueId}`))
	}

	function handleDeleteClick(skill: JobSkill) {
		skillToDelete = skill
		deleteDialogOpen = true
	}

	function handleDeleteCancel() {
		deleteDialogOpen = false
		skillToDelete = undefined
	}

	async function handleDeleteConfirm() {
		if (!skillToDelete) return

		isDeleting = true
		try {
			await jobAdapter.deleteSkill(job.granblueId, skillToDelete.id)
			await queryClient.invalidateQueries({ queryKey: jobKeys.skills(job.granblueId) })
			deleteDialogOpen = false
			skillToDelete = undefined
		} catch (error) {
			console.error('Failed to delete skill:', error)
		} finally {
			isDeleting = false
		}
	}
</script>

<div class="skills-tab">
	{#if skillsQuery.isLoading}
		<div class="loading">Loading skills...</div>
	{:else if skillsQuery.isError}
		<div class="error">Failed to load skills</div>
	{:else if !skillsQuery.data?.length}
		<div class="empty">
			<p>No skills found for this job</p>
			{#if canEdit}
				<Button variant="secondary" onclick={handleAddSkill}>Add Skill</Button>
			{/if}
		</div>
	{:else}
		{#each skillGroups as group}
			{#if groupedSkills[group.key].length > 0}
				<section class="skill-group">
					<h3 class="group-title">{group.title}</h3>
					<div class="skill-list">
						{#each groupedSkills[group.key] as skill (skill.id)}
							<SkillRow {skill} {canEdit} onDelete={handleDeleteClick} />
						{/each}
					</div>
				</section>
			{/if}
		{/each}

		{#if canEdit}
			<div class="add-skill-section">
				<Button variant="secondary" onclick={handleAddSkill}>Add Skill</Button>
			</div>
		{/if}
	{/if}
</div>

<Dialog bind:open={deleteDialogOpen}>
	{#snippet children()}
		<ModalHeader title="Delete Skill?" />
		<ModalBody>
			<p class="delete-message">
				Are you sure you want to delete "{skillToDelete?.name?.en ?? 'this skill'}"?
				This action cannot be undone.
			</p>
		</ModalBody>
		<ModalFooter
			onCancel={handleDeleteCancel}
			cancelDisabled={isDeleting}
			primaryAction={{
				label: isDeleting ? 'Deleting...' : 'Delete',
				onclick: handleDeleteConfirm,
				destructive: true,
				disabled: isDeleting
			}}
		/>
	{/snippet}
</Dialog>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.skills-tab {
		display: flex;
		flex-direction: column;
	}

	.loading,
	.error,
	.empty {
		text-align: center;
		padding: spacing.$unit * 4;
		color: var(--text-secondary);

		p {
			margin: 0 0 spacing.$unit-2x 0;
		}
	}

	.error {
		color: var(--red);
	}

	.skill-group {
		padding: spacing.$unit-2x;
	}

	.group-title {
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		color: var(--text-secondary);
		margin: 0 0 spacing.$unit 0;
	}

	.skill-list {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
	}

	.add-skill-section {
		padding: spacing.$unit-2x;
		display: flex;
		justify-content: center;
	}

	.delete-message {
		margin: 0;
		font-size: typography.$font-regular;
		line-height: 1.4;
		color: var(--text-primary);
	}
</style>
