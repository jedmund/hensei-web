<svelte:options runes={true} />

<script lang="ts">
	import type { Job, JobSkill } from '$lib/types/api/entities'
	import { createQuery, useQueryClient } from '@tanstack/svelte-query'
	import { jobQueries, jobKeys } from '$lib/api/queries/job.queries'
	import { jobAdapter } from '$lib/api/adapters/job.adapter'
	import { getJobSkillIcon } from '$lib/utils/images'
	import { getSkillCategoryName, getSkillCategoryColor } from '$lib/utils/jobUtils'
	import { DropdownMenu } from 'bits-ui'
	import Button from '$lib/components/ui/Button.svelte'
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import ModalHeader from '$lib/components/ui/ModalHeader.svelte'
	import ModalBody from '$lib/components/ui/ModalBody.svelte'
	import ModalFooter from '$lib/components/ui/ModalFooter.svelte'
	import { openJobSkillEditSidebar } from '../openJobSkillEditSidebar'

	interface Props {
		job: Job
		/** Whether the user can edit (has editor role) */
		canEdit?: boolean
	}

	let { job, canEdit = false }: Props = $props()

	const queryClient = useQueryClient()

	// Fetch skills for this job
	const skillsQuery = createQuery(() => jobQueries.skillsByJob(job.granblueId))

	// Delete dialog state
	let deleteDialogOpen = $state(false)
	let skillToDelete = $state<JobSkill | undefined>(undefined)
	let isDeleting = $state(false)

	// Group skills by type
	const groupedSkills = $derived.by(() => {
		const skills = skillsQuery.data ?? []
		const groups: { main: JobSkill[]; sub: JobSkill[]; emp: JobSkill[]; base: JobSkill[] } = {
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

		// Sort each group by order
		for (const key of Object.keys(groups) as Array<keyof typeof groups>) {
			groups[key].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
		}

		return groups
	})

	// Check if there are any skills in a group
	function hasSkills(group: keyof typeof groupedSkills): boolean {
		return groupedSkills[group].length > 0
	}

	// Open sidebar for creating a new skill
	function handleAddSkill() {
		openJobSkillEditSidebar({ jobId: job.granblueId })
	}

	// Open sidebar for editing a skill
	function handleEditSkill(skill: JobSkill) {
		openJobSkillEditSidebar({ jobId: job.granblueId, skill })
	}

	// Open delete confirmation dialog
	function handleDeleteClick(skill: JobSkill) {
		skillToDelete = skill
		deleteDialogOpen = true
	}

	// Cancel delete
	function handleDeleteCancel() {
		deleteDialogOpen = false
		skillToDelete = undefined
	}

	// Confirm delete
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
			// TODO: Show error toast
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
		{#if hasSkills('main')}
			<section class="skill-group">
				<h3 class="group-title">Main Skills</h3>
				<div class="skill-list">
					{#each groupedSkills.main as skill}
						<div class="skill-item">
							<img src={getJobSkillIcon(skill)} alt={skill.name.en} class="skill-icon" />
							<div class="skill-info">
								<span class="skill-name">{skill.name.en}</span>
								{#if skill.name.ja}
									<span class="skill-name-jp">{skill.name.ja}</span>
								{/if}
							</div>
							<span class="skill-category" style="background: {getSkillCategoryColor(skill)}">
								{getSkillCategoryName(skill)}
							</span>
							{#if canEdit}
								<DropdownMenu.Root>
									<DropdownMenu.Trigger>
										{#snippet child({ props })}
											<Button
												{...props}
												variant="ghost"
												size="small"
												iconOnly
												icon="ellipsis"
												aria-label="Skill options"
											/>
										{/snippet}
									</DropdownMenu.Trigger>
									<DropdownMenu.Portal>
										<DropdownMenu.Content class="skill-menu" side="bottom" align="end" sideOffset={4}>
											<DropdownMenu.Item class="skill-menu-item" onSelect={() => handleEditSkill(skill)}>
												Edit
											</DropdownMenu.Item>
											<DropdownMenu.Item class="skill-menu-item danger" onSelect={() => handleDeleteClick(skill)}>
												Delete
											</DropdownMenu.Item>
										</DropdownMenu.Content>
									</DropdownMenu.Portal>
								</DropdownMenu.Root>
							{/if}
						</div>
					{/each}
				</div>
			</section>
		{/if}

		{#if hasSkills('sub')}
			<section class="skill-group">
				<h3 class="group-title">Subskills</h3>
				<div class="skill-list">
					{#each groupedSkills.sub as skill}
						<div class="skill-item">
							<img src={getJobSkillIcon(skill)} alt={skill.name.en} class="skill-icon" />
							<div class="skill-info">
								<span class="skill-name">{skill.name.en}</span>
								{#if skill.name.ja}
									<span class="skill-name-jp">{skill.name.ja}</span>
								{/if}
							</div>
							<span class="skill-category" style="background: {getSkillCategoryColor(skill)}">
								{getSkillCategoryName(skill)}
							</span>
							{#if canEdit}
								<DropdownMenu.Root>
									<DropdownMenu.Trigger>
										{#snippet child({ props })}
											<Button
												{...props}
												variant="ghost"
												size="small"
												iconOnly
												icon="ellipsis"
												aria-label="Skill options"
											/>
										{/snippet}
									</DropdownMenu.Trigger>
									<DropdownMenu.Portal>
										<DropdownMenu.Content class="skill-menu" side="bottom" align="end" sideOffset={4}>
											<DropdownMenu.Item class="skill-menu-item" onSelect={() => handleEditSkill(skill)}>
												Edit
											</DropdownMenu.Item>
											<DropdownMenu.Item class="skill-menu-item danger" onSelect={() => handleDeleteClick(skill)}>
												Delete
											</DropdownMenu.Item>
										</DropdownMenu.Content>
									</DropdownMenu.Portal>
								</DropdownMenu.Root>
							{/if}
						</div>
					{/each}
				</div>
			</section>
		{/if}

		{#if hasSkills('emp')}
			<section class="skill-group">
				<h3 class="group-title">EMP Skills</h3>
				<div class="skill-list">
					{#each groupedSkills.emp as skill}
						<div class="skill-item">
							<img src={getJobSkillIcon(skill)} alt={skill.name.en} class="skill-icon" />
							<div class="skill-info">
								<span class="skill-name">{skill.name.en}</span>
								{#if skill.name.ja}
									<span class="skill-name-jp">{skill.name.ja}</span>
								{/if}
							</div>
							<span class="skill-category" style="background: {getSkillCategoryColor(skill)}">
								{getSkillCategoryName(skill)}
							</span>
							{#if canEdit}
								<DropdownMenu.Root>
									<DropdownMenu.Trigger>
										{#snippet child({ props })}
											<Button
												{...props}
												variant="ghost"
												size="small"
												iconOnly
												icon="ellipsis"
												aria-label="Skill options"
											/>
										{/snippet}
									</DropdownMenu.Trigger>
									<DropdownMenu.Portal>
										<DropdownMenu.Content class="skill-menu" side="bottom" align="end" sideOffset={4}>
											<DropdownMenu.Item class="skill-menu-item" onSelect={() => handleEditSkill(skill)}>
												Edit
											</DropdownMenu.Item>
											<DropdownMenu.Item class="skill-menu-item danger" onSelect={() => handleDeleteClick(skill)}>
												Delete
											</DropdownMenu.Item>
										</DropdownMenu.Content>
									</DropdownMenu.Portal>
								</DropdownMenu.Root>
							{/if}
						</div>
					{/each}
				</div>
			</section>
		{/if}

		{#if hasSkills('base')}
			<section class="skill-group">
				<h3 class="group-title">Base Skills</h3>
				<div class="skill-list">
					{#each groupedSkills.base as skill}
						<div class="skill-item">
							<img src={getJobSkillIcon(skill)} alt={skill.name.en} class="skill-icon" />
							<div class="skill-info">
								<span class="skill-name">{skill.name.en}</span>
								{#if skill.name.ja}
									<span class="skill-name-jp">{skill.name.ja}</span>
								{/if}
							</div>
							<span class="skill-category" style="background: {getSkillCategoryColor(skill)}">
								{getSkillCategoryName(skill)}
							</span>
							{#if canEdit}
								<DropdownMenu.Root>
									<DropdownMenu.Trigger>
										{#snippet child({ props })}
											<Button
												{...props}
												variant="ghost"
												size="small"
												iconOnly
												icon="ellipsis"
												aria-label="Skill options"
											/>
										{/snippet}
									</DropdownMenu.Trigger>
									<DropdownMenu.Portal>
										<DropdownMenu.Content class="skill-menu" side="bottom" align="end" sideOffset={4}>
											<DropdownMenu.Item class="skill-menu-item" onSelect={() => handleEditSkill(skill)}>
												Edit
											</DropdownMenu.Item>
											<DropdownMenu.Item class="skill-menu-item danger" onSelect={() => handleDeleteClick(skill)}>
												Delete
											</DropdownMenu.Item>
										</DropdownMenu.Content>
									</DropdownMenu.Portal>
								</DropdownMenu.Root>
							{/if}
						</div>
					{/each}
				</div>
			</section>
		{/if}

		{#if canEdit}
			<div class="add-skill-section">
				<Button variant="secondary" onclick={handleAddSkill}>Add Skill</Button>
			</div>
		{/if}
	{/if}
</div>

<!-- Delete Confirmation Dialog -->
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
	@use '$src/themes/layout' as layout;
	@use '$src/themes/effects' as effects;

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

	.skill-item {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
		padding: spacing.$unit;
		background: var(--card-bg);
		border-radius: layout.$item-corner;
		transition: background-color 0.15s ease;

		&:hover {
			background: var(--background);
		}
	}

	.skill-icon {
		width: 40px;
		height: 40px;
		border-radius: layout.$item-corner-small;
		object-fit: cover;
	}

	.skill-info {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-half;
		flex: 1;
		min-width: 0;
	}

	.skill-name {
		font-size: typography.$font-medium;
		font-weight: typography.$medium;
	}

	.skill-name-jp {
		font-size: typography.$font-small;
		color: var(--text-secondary);
	}

	.skill-category {
		font-size: typography.$font-tiny;
		font-weight: typography.$medium;
		padding: 2px 8px;
		border-radius: layout.$card-corner;
		color: white;
		white-space: nowrap;
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

	// Dropdown menu styles
	:global(.skill-menu) {
		background: var(--menu-bg, white);
		border: 1px solid var(--border-color, #ddd);
		border-radius: layout.$card-corner;
		box-shadow: var(--shadow-md);
		padding: spacing.$unit-half;
		min-width: calc(spacing.$unit * 16);
		z-index: effects.$z-modal;
	}

	:global(.skill-menu-item) {
		padding: spacing.$unit spacing.$unit-2x;
		border-radius: layout.$item-corner-small;
		cursor: pointer;
		font-size: typography.$font-medium;
		color: var(--text-primary);
		outline: none;

		&:hover,
		&:focus {
			background: var(--button-bg-hover, #f5f5f5);
		}

		&.danger {
			color: var(--danger, #dc3545);

			&:hover,
			&:focus {
				background: var(--danger-bg, #fff5f5);
			}
		}
	}
</style>
