
<script lang="ts">
	import { createInfiniteQuery } from '@tanstack/svelte-query'
	import { onDestroy } from 'svelte'
	import type { Job, JobSkill } from '$lib/types/api/entities'
	import type { JobSkillList } from '$lib/types/api/party'
	import { jobQueries } from '$lib/api/queries/job.queries'
	import JobSkillItem from '../job/JobSkillItem.svelte'
	import Button from '../ui/Button.svelte'
	import Input from '../ui/Input.svelte'
	import Select from '../ui/Select.svelte'
	import Icon from '../Icon.svelte'
	import { useInfiniteLoader } from '$lib/stores/loaderState.svelte'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		job?: Job
		currentSkills?: JobSkillList
		targetSlot: number
		onSelectSkill?: (skill: JobSkill) => void
		onRemoveSkill?: () => void
	}

	let {
		job,
		currentSkills = {},
		targetSlot = 0,
		onSelectSkill,
		onRemoveSkill
	}: Props = $props()

	// Skill category filter options
	// Values match Rails search_controller expectations:
	// -1: All, 0-3: Color categories, 4: EMP, 5: Base
	const skillCategoryOptions = $derived([
		{ value: -1, label: m.skill_filter_all() },
		{ value: 2, label: m.skill_filter_damaging() },
		{ value: 0, label: m.skill_filter_buffing() },
		{ value: 1, label: m.skill_filter_debuffing() },
		{ value: 3, label: m.skill_filter_healing() },
		{ value: 4, label: m.skill_category_emp() },
		{ value: 5, label: m.skill_category_base() }
	])

	// State for filtering (local UI state, not server state)
	let searchQuery = $state('')
	let skillCategory = $state(-1) // -1 = All
	let error = $state<string | undefined>()
	let resultsScrolled = $state(false)

	// Debounced search value for query
	let debouncedSearchQuery = $state('')
	let debounceTimer: ReturnType<typeof setTimeout> | undefined

	// Debounce search query changes
	$effect(() => {
		const query = searchQuery

		if (debounceTimer) {
			clearTimeout(debounceTimer)
		}

		debounceTimer = setTimeout(() => {
			debouncedSearchQuery = query
		}, 300)

		return () => {
			if (debounceTimer) {
				clearTimeout(debounceTimer)
			}
		}
	})

	// Check if slot is locked
	const slotLocked = $derived(targetSlot === 0)
	const currentSkill = $derived(currentSkills[targetSlot as keyof JobSkillList])
	const canSearch = $derived(Boolean(job) && !slotLocked)

	const skillsQuery = createInfiniteQuery(() => {
		const jobId = job?.id
		const query = debouncedSearchQuery
		const category = skillCategory

		const filters = category >= 0 ? { group: category } : undefined

		return {
			...jobQueries.skills(jobId ?? '', {
				query: query || undefined,
				filters
			}),
			enabled: !!jobId && !slotLocked
		}
	})

	const skills = $derived(skillsQuery.data?.pages.flatMap((page) => page.results) ?? [])

	let sentinelEl = $state<HTMLElement>()

	const loader = useInfiniteLoader(() => skillsQuery, () => sentinelEl, { rootMargin: '200px' })

	$effect(() => {
		void debouncedSearchQuery
		void skillCategory
		loader.reset()
	})

	onDestroy(() => loader.destroy())

	const isEmpty = $derived(skills.length === 0 && !skillsQuery.isLoading && !skillsQuery.isError)

	function handleSelectSkill(skill: JobSkill) {
		error = undefined

		if (slotLocked) {
			error = m.skill_slot_locked()
			return
		}

		const alreadyEquipped = Object.entries(currentSkills).some(([slotKey, s]) => {
			if (parseInt(slotKey) === targetSlot) return false
			return s?.id === skill.id
		})

		if (alreadyEquipped) {
			error = m.skill_slot_already_equipped()
			return
		}

		onSelectSkill?.(skill)
	}

	function handleRemoveSkill() {
		if (!slotLocked) {
			error = undefined
			onRemoveSkill?.()
		}
	}
</script>

<div class="skill-selection-content">
	{#if slotLocked && currentSkill}
		<div class="locked-notice">
			<Icon name="arrow-left" size={16} />
			<p>{m.skill_slot_locked()}</p>
		</div>
	{/if}

	{#if currentSkill && !slotLocked}
		<div class="current-skill">
			<h4>{m.skill_slot_current()}</h4>
			<JobSkillItem
				skill={currentSkill}
				variant="current"
				onRemove={handleRemoveSkill}
			/>
		</div>
	{/if}

	{#if error}
		<div class="error-banner">
			<Icon name="alert-circle" size={16} />
			<p>{error}</p>
			<button class="close-error" onclick={() => error = undefined}>
				<Icon name="x" size={16} />
			</button>
		</div>
	{/if}

	<div class="controls" class:scrolled={resultsScrolled}>
		<Input
			type="text"
			placeholder={m.skill_selection_search_placeholder()}
			bind:value={searchQuery}
			leftIcon="search"
			disabled={!canSearch}
			fullWidth={true}
			contained={true}
		/>
		<Select
			options={skillCategoryOptions}
			bind:value={skillCategory}
			placeholder={m.sidebar_filter_category()}
			disabled={!canSearch}
			fullWidth={true}
			contained={true}
		/>
	</div>

	<div class="results-section" onscroll={(e) => { resultsScrolled = e.currentTarget.scrollTop > 0 }}>
		{#if !job}
			<div class="no-results">
				{m.skill_slot_select_job_first()}
			</div>
		{:else if slotLocked}
			<div class="no-results">
				{m.skill_slot_locked()}
			</div>
		{:else if skillsQuery.isLoading}
			<div class="loading">
				<Icon name="loader-2" size={24} />
				<span>{m.sidebar_loading_skills()}</span>
			</div>
		{:else if skillsQuery.isError}
			<div class="error-state">
				<Icon name="alert-circle" size={24} />
				<p>{skillsQuery.error?.message || m.sidebar_skills_error()}</p>
				<Button size="small" onclick={() => skillsQuery.refetch()}>{m.retry()}</Button>
			</div>
		{:else}
			<div class="skills-list">
				{#each skills as skill (skill.id)}
					<JobSkillItem
						{skill}
						onClick={() => handleSelectSkill(skill)}
					/>
				{/each}

				{#if isEmpty}
					<div class="no-results">
						{m.sidebar_no_skills()}
					</div>
				{/if}

				<div
					class="load-more-sentinel"
					bind:this={sentinelEl}
					class:hidden={!skillsQuery.hasNextPage}
				></div>

				{#if skillsQuery.isFetchingNextPage}
					<div class="loading-more">
						<Icon name="loader-2" size={20} />
						<span>{m.sidebar_loading_more_skills()}</span>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/typography' as *;

	.skill-selection-content {
		display: flex;
		flex-direction: column;
		height: calc(100vh - 60px);
		overflow: hidden;
	}

	.locked-notice {
		display: flex;
		align-items: center;
		gap: $unit;
		padding: $unit $unit-2x;
		background: var(--warning-bg);
		border-bottom: 1px solid var(--border-primary);

		:global(svg) {
			color: var(--warning-text);
		}

		p {
			margin: 0;
			font-size: $font-regular;
			color: var(--warning-text);
		}
	}

	.current-skill {
		padding: $unit $unit-2x;
		border-bottom: 1px solid var(--border-primary);

		h4 {
			margin: 0 0 $unit 0;
			font-size: $font-small;
			font-weight: $bold;
			text-transform: uppercase;
			letter-spacing: 0.5px;
			color: var(--text-secondary);
		}
	}

	.error-banner {
		display: flex;
		align-items: center;
		gap: $unit;
		padding: $unit $unit-2x;
		background: var(--error-bg);
		border-bottom: 1px solid var(--error-border);

		:global(svg) {
			color: var(--error-text);
			flex-shrink: 0;
		}

		p {
			flex: 1;
			margin: 0;
			font-size: $font-regular;
			color: var(--error-text);
		}

		.close-error {
			display: flex;
			align-items: center;
			justify-content: center;
			padding: $unit-half;
			background: transparent;
			border: none;
			cursor: pointer;
			color: var(--error-text);
			opacity: 0.7;
			transition: opacity 0.2s;

			&:hover {
				opacity: 1;
			}
		}
	}

	.controls {
		display: flex;
		flex-direction: column;
		gap: $unit;
		padding: 0 $unit-2x $unit;
		flex-shrink: 0;
		border-bottom: 1px solid var(--border-primary);
		position: relative;
		z-index: 1;
		transition: box-shadow 0.2s ease;

		&.scrolled {
			box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
			border-bottom: 1px solid rgba(0, 0, 0, 0.01);
		}
	}

	.results-section {
		flex: 1;
		overflow-y: auto;
		padding: 0 $unit-2x;
		min-height: 0;

		.loading,
		.no-results {
			text-align: center;
			padding: $unit-3x;
			color: var(--text-secondary);
			font-size: $font-regular;
		}

		.loading {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: $unit;

			:global(svg) {
				animation: spin 1s linear infinite;
			}
		}

		.error-state {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			gap: $unit;
			padding: $unit-3x;
			color: var(--text-secondary);

			:global(svg) {
				color: var(--text-tertiary);
			}

			p {
				margin: 0;
				font-size: $font-regular;
			}
		}
	}

	.skills-list {
		display: flex;
		flex-direction: column;
		padding-top: $unit;
	}

	.load-more-sentinel {
		height: 1px;
		margin-top: $unit;

		&.hidden {
			display: none;
		}
	}

	.loading-more {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: $unit;
		padding: $unit-2x;
		color: var(--text-secondary);
		font-size: $font-regular;

		:global(svg) {
			animation: spin 1s linear infinite;
		}
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style>
