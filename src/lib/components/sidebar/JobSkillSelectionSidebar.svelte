<svelte:options runes={true} />

<script lang="ts">
	import type { Job, JobSkill } from '$lib/types/api/entities'
	import type { JobSkillList } from '$lib/types/api/party'
	import { jobAdapter } from '$lib/api/adapters/job.adapter'
	import { createInfiniteScrollResource } from '$lib/api/adapters/resources/infiniteScroll.resource.svelte'
	import JobSkillItem from '../job/JobSkillItem.svelte'
	import Button from '../ui/Button.svelte'
	import Input from '../ui/Input.svelte'
	import Icon from '../Icon.svelte'
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

	// State
	let searchQuery = $state('')
	let error = $state<string | undefined>()
	let sentinelEl = $state<HTMLElement>()
	let skillsResource = $state<ReturnType<typeof createInfiniteScrollResource<JobSkill>> | null>(null)
	let lastSearchQuery = ''
	let lastJobId: string | undefined

	// Check if slot is locked
	const slotLocked = $derived(targetSlot === 0)
	const currentSkill = $derived(currentSkills[targetSlot as keyof JobSkillList])

	const canSearch = $derived(Boolean(job) && !slotLocked)

	// Manage resource creation and search updates
	let debounceTimer: ReturnType<typeof setTimeout> | undefined

	function updateSearch() {
		const jobId = job?.id
		const locked = slotLocked

		// Clean up if no job or locked
		if (!jobId || locked) {
			if (skillsResource) {
				skillsResource.destroy()
				skillsResource = null
			}
			lastJobId = undefined
			lastSearchQuery = ''
			return
		}

		// Create new resource if job changed
		if (jobId !== lastJobId) {
			if (skillsResource) {
				skillsResource.destroy()
			}

			const resource = createInfiniteScrollResource<JobSkill>({
				fetcher: async (page) => {
					const response = await jobAdapter.searchSkills({
						query: lastSearchQuery,
						jobId,
						page
					})
					return response
				},
				threshold: 200,
				debounceMs: 200
			})

			skillsResource = resource
			lastJobId = jobId
			lastSearchQuery = searchQuery
			resource.load()
		}
		// Reload if search query changed
		else if (searchQuery !== lastSearchQuery && skillsResource) {
			lastSearchQuery = searchQuery
			skillsResource.reset()
			skillsResource.load()
		}
	}

	// Watch for job changes
	$effect(() => {
		job // Track job
		updateSearch()
	})

	// Watch for search query changes with debounce
	$effect(() => {
		const query = searchQuery // Track searchQuery

		if (debounceTimer) {
			clearTimeout(debounceTimer)
		}

		debounceTimer = setTimeout(() => {
			if (query !== lastSearchQuery) {
				updateSearch()
			}
		}, 300)

		return () => {
			if (debounceTimer) {
				clearTimeout(debounceTimer)
			}
		}
	})

	// Bind sentinel when ready
	$effect(() => {
		const sentinel = sentinelEl
		const resource = skillsResource

		if (sentinel && resource) {
			resource.bindSentinel(sentinel)
		}
	})

	function handleSelectSkill(skill: JobSkill) {
		// Clear any previous errors
		error = undefined

		if (slotLocked) {
			error = 'This slot cannot be changed'
			return
		}

		// Check if skill is already equipped in a different slot
		const alreadyEquipped = Object.entries(currentSkills).some(([slotKey, s]) => {
			// Skip checking the current slot we're updating
			if (parseInt(slotKey) === targetSlot) return false
			return s?.id === skill.id
		})

		if (alreadyEquipped) {
			error = 'This skill is already equipped in another slot'
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
			<p>This slot cannot be changed</p>
		</div>
	{/if}

	{#if currentSkill && !slotLocked}
		<div class="current-skill">
			<h4>Current Skill</h4>
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
			<button class="close-error" on:click={() => error = undefined}>
				<Icon name="x" size={16} />
			</button>
		</div>
	{/if}

	<div class="search-section">
		<Input
			type="text"
			placeholder={m.skill_selection_search_placeholder()}
			bind:value={searchQuery}
			leftIcon="search"
			disabled={!canSearch}
			fullWidth={true}
		/>
	</div>

	<div class="skills-container">
		{#if !job}
			<div class="empty-state">
				<Icon name="briefcase" size={32} />
				<p>Select a job first</p>
			</div>
	{:else if slotLocked}
		<div class="empty-state">
			<Icon name="arrow-left" size={32} />
			<p>This slot cannot be changed</p>
		</div>
	{:else if skillsResource?.loading}
			<div class="loading-state">
				<Icon name="loader-2" size={32} />
				<p>Loading skills...</p>
			</div>
		{:else if skillsResource?.error}
			<div class="error-state">
				<Icon name="alert-circle" size={32} />
				<p>{skillsResource.error.message || 'Failed to load skills'}</p>
				<Button size="small" on:click={() => skillsResource?.retry()}>Retry</Button>
			</div>
		{:else}
			<div class="skills-list">
				{#each skillsResource?.items || [] as skill (skill.id)}
					<JobSkillItem
						{skill}
						onClick={() => handleSelectSkill(skill)}
					/>
				{/each}

				{#if skillsResource?.isEmpty}
					<div class="empty-state">
						<Icon name="search-x" size={32} />
						<p>No skills found</p>
						{#if searchQuery}
							<Button size="small" variant="ghost" on:click={() => searchQuery = ''}>
								Clear search
							</Button>
						{/if}
					</div>
				{/if}

				{#if skillsResource?.hasMore && !skillsResource?.loadingMore}
					<div class="load-more-sentinel" bind:this={sentinelEl}></div>
				{/if}

				{#if skillsResource?.loadingMore}
					<div class="loading-more">
						<Icon name="loader-2" size={20} />
						<span>Loading more skills...</span>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;

	.skill-selection-content {
		display: flex;
		flex-direction: column;
		height: 100%;
		overflow: hidden;
	}

	.locked-notice {
		display: flex;
		align-items: center;
		gap: $unit;
		padding: $unit-2x 0;
		background: var(--warning-bg);
		border-bottom: 1px solid var(--border-subtle);

		:global(svg) {
			color: var(--warning-text);
		}

		p {
			margin: 0;
			font-size: 14px;
			color: var(--warning-text);
		}
	}

	.current-skill {
		padding: $unit-2x 0;
		border-bottom: 1px solid var(--border-subtle);

		h4 {
			margin: 0 0 $unit 0;
			font-size: 12px;
			font-weight: 600;
			text-transform: uppercase;
			letter-spacing: 0.5px;
			color: var(--text-secondary);
		}
	}

	.error-banner {
		display: flex;
		align-items: center;
		gap: $unit;
		padding: $unit;
		background: var(--error-bg);
		border-bottom: 1px solid var(--error-border);

		:global(svg) {
			color: var(--error-text);
			flex-shrink: 0;
		}

		p {
			flex: 1;
			margin: 0;
			font-size: 13px;
			color: var(--error-text);
		}

		.close-error {
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 4px;
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

	.search-section {
		padding: $unit-2x 0;
		border-bottom: 1px solid var(--border-subtle);
		flex-shrink: 0;
	}

	.skills-container {
		flex: 1;
		overflow-y: auto;
		padding: $unit-2x 0;
		min-height: 0;
	}

	.loading-state,
	.error-state,
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: $unit;
		padding: $unit-4x;
		color: var(--text-secondary);

		:global(svg) {
			color: var(--text-tertiary);
		}

		p {
			margin: 0;
			font-size: 14px;
		}
	}

	.loading-state :global(svg) {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	.skills-list {
		display: flex;
		flex-direction: column;
		gap: $unit-half;
	}

	.load-more-sentinel {
		height: 1px;
		margin-top: $unit;
	}

	.loading-more {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: $unit;
		padding: $unit-2x;
		color: var(--text-secondary);
		font-size: 14px;

		:global(svg) {
			animation: spin 1s linear infinite;
		}
	}
</style>
