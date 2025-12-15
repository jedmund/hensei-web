<svelte:options runes={true} />

<script lang="ts">
	import type { Job, JobSkill } from '$lib/types/api/entities'
	import { createQuery } from '@tanstack/svelte-query'
	import { jobQueries } from '$lib/api/queries/job.queries'
	import { getJobSkillIcon } from '$lib/utils/images'
	import { getSkillCategoryName, getSkillCategoryColor } from '$lib/utils/jobUtils'

	interface Props {
		job: Job
	}

	let { job }: Props = $props()

	// Fetch skills for this job
	const skillsQuery = createQuery(() => jobQueries.skillsByJob(job.granblueId))

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
</script>

<div class="skills-tab">
	{#if skillsQuery.isLoading}
		<div class="loading">Loading skills...</div>
	{:else if skillsQuery.isError}
		<div class="error">Failed to load skills</div>
	{:else if !skillsQuery.data?.length}
		<div class="empty">No skills found for this job</div>
	{:else}
		{#if hasSkills('main')}
			<section class="skill-group">
				<h3 class="group-title">Main Skills</h3>
				<div class="skill-list">
					{#each groupedSkills.main as skill}
						<div class="skill-item">
							<img src={getJobSkillIcon(skill.slug)} alt={skill.name.en} class="skill-icon" />
							<div class="skill-info">
								<span class="skill-name">{skill.name.en}</span>
								{#if skill.name.ja}
									<span class="skill-name-jp">{skill.name.ja}</span>
								{/if}
							</div>
							<span class="skill-category" style="background: {getSkillCategoryColor(skill)}">
								{getSkillCategoryName(skill)}
							</span>
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
							<img src={getJobSkillIcon(skill.slug)} alt={skill.name.en} class="skill-icon" />
							<div class="skill-info">
								<span class="skill-name">{skill.name.en}</span>
								{#if skill.name.ja}
									<span class="skill-name-jp">{skill.name.ja}</span>
								{/if}
							</div>
							<span class="skill-category" style="background: {getSkillCategoryColor(skill)}">
								{getSkillCategoryName(skill)}
							</span>
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
							<img src={getJobSkillIcon(skill.slug)} alt={skill.name.en} class="skill-icon" />
							<div class="skill-info">
								<span class="skill-name">{skill.name.en}</span>
								{#if skill.name.ja}
									<span class="skill-name-jp">{skill.name.ja}</span>
								{/if}
							</div>
							<span class="skill-category" style="background: {getSkillCategoryColor(skill)}">
								{getSkillCategoryName(skill)}
							</span>
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
							<img src={getJobSkillIcon(skill.slug)} alt={skill.name.en} class="skill-icon" />
							<div class="skill-info">
								<span class="skill-name">{skill.name.en}</span>
								{#if skill.name.ja}
									<span class="skill-name-jp">{skill.name.ja}</span>
								{/if}
							</div>
							<span class="skill-category" style="background: {getSkillCategoryColor(skill)}">
								{getSkillCategoryName(skill)}
							</span>
						</div>
					{/each}
				</div>
			</section>
		{/if}
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/effects' as effects;

	.skills-tab {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x;
	}

	.loading,
	.error,
	.empty {
		text-align: center;
		padding: spacing.$unit * 4;
		color: colors.$grey-50;
	}

	.error {
		color: colors.$red;
	}

	.skill-group {
		background: white;
		border-radius: layout.$card-corner;
		box-shadow: effects.$page-elevation;
		padding: spacing.$unit-2x;
	}

	.group-title {
		font-size: typography.$font-large;
		font-weight: typography.$bold;
		margin: 0 0 spacing.$unit 0;
		padding-bottom: spacing.$unit;
		border-bottom: 1px solid colors.$grey-90;
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
		background: colors.$grey-95;
		border-radius: layout.$item-corner;
		transition: background-color 0.15s ease;

		&:hover {
			background: colors.$grey-90;
		}
	}

	.skill-icon {
		width: 40px;
		height: 40px;
		border-radius: 4px;
		object-fit: cover;
	}

	.skill-info {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-width: 0;
	}

	.skill-name {
		font-size: typography.$font-medium;
		font-weight: typography.$medium;
	}

	.skill-name-jp {
		font-size: typography.$font-small;
		color: colors.$grey-50;
	}

	.skill-category {
		font-size: typography.$font-tiny;
		font-weight: typography.$medium;
		padding: 2px 8px;
		border-radius: 12px;
		color: white;
		white-space: nowrap;
	}
</style>
