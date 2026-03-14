<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query'
	import type { Job } from '$lib/types/api/entities'
	import { jobQueries } from '$lib/api/queries/job.queries'
	import { getJobTierName, getJobTierOrder } from '$lib/utils/jobUtils'
	import JobItem from '../job/JobItem.svelte'
	import JobTierSelector from '../job/JobTierSelector.svelte'
	import Input from '../ui/Input.svelte'
	import Button from '../ui/Button.svelte'
	import Icon from '../Icon.svelte'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		currentJobId?: string
		onSelectJob?: (job: Job) => void
	}

	let { currentJobId, onSelectJob }: Props = $props()

	// TanStack Query v6: Use createQuery with thunk pattern for reactivity
	// Jobs are cached for 30 minutes and shared across all components
	const jobsQuery = createQuery(() => jobQueries.list())

	// State for filtering (local UI state, not server state)
	let searchQuery = $state('')
	let selectedTiers = $state<Set<string>>(new Set(['4', '5', 'ex2', 'o1'])) // Default to IV, V, EXII, OI

	// Available tiers with short labels for display
	const tiers = [
		{ value: '1', label: m.job_tier_class_1(), shortLabel: 'I' },
		{ value: '2', label: m.job_tier_class_2(), shortLabel: 'II' },
		{ value: '3', label: m.job_tier_class_3(), shortLabel: 'III' },
		{ value: '4', label: m.job_tier_class_4(), shortLabel: 'IV' },
		{ value: '5', label: m.job_tier_class_5(), shortLabel: 'V' },
		{ value: 'ex', label: m.job_tier_ex(), shortLabel: 'EXI' },
		{ value: 'ex2', label: m.job_tier_ex2(), shortLabel: 'EXII' },
		{ value: 'o1', label: m.job_tier_origin_1(), shortLabel: 'OI' }
	]

	function toggleTier(value: string) {
		const newSet = new Set(selectedTiers)
		if (newSet.has(value)) {
			newSet.delete(value)
		} else {
			newSet.add(value)
		}
		selectedTiers = newSet
	}

	// Filter jobs based on search and filters
	// TanStack Query handles loading/error states, we just filter the data
	const filteredJobs = $derived(
		(() => {
			let jobs = jobsQuery.data || []

			// Filter by search query
			if (searchQuery) {
				const query = searchQuery.toLowerCase()
				jobs = jobs.filter(
					(job) =>
						job.name.en.toLowerCase().includes(query) || job.name.ja?.toLowerCase().includes(query)
				)
			}

			// Filter by selected tiers
			if (selectedTiers.size > 0) {
				jobs = jobs.filter((job) => {
					const jobTier = job.row.toString().toLowerCase()
					return selectedTiers.has(jobTier)
				})
			}

			// Sort by tier and then by order field (create a copy to avoid mutating state)
			jobs = [...jobs].sort((a, b) => {
				const tierDiff = getJobTierOrder(a.row) - getJobTierOrder(b.row)
				if (tierDiff !== 0) return tierDiff
				// Use the order field for sorting within the same tier
				return a.order - b.order
			})

			// Group by tier
			const grouped: Record<string, Job[]> = {}
			for (const job of jobs) {
				const tierName = getJobTierName(job.row)
				if (!grouped[tierName]) {
					grouped[tierName] = []
				}
				grouped[tierName].push(job)
			}

			return grouped
		})()
	)

	function handleSelectJob(job: Job) {
		onSelectJob?.(job)
	}

	function isJobSelected(job: Job): boolean {
		return job.id === currentJobId
	}
</script>

<div class="job-selection-content">
	<div class="search-section">
		<Input
			type="text"
			placeholder={m.job_selection_search_placeholder()}
			bind:value={searchQuery}
			leftIcon="search"
			fullWidth={true}
			contained={true}
		/>

		<JobTierSelector {tiers} {selectedTiers} onToggleTier={toggleTier} />
	</div>

	<div class="jobs-container">
		{#if jobsQuery.isLoading}
			<div class="loading-state">
				<Icon name="loader-2" size={32} />
				<p>{m.sidebar_loading_jobs()}</p>
			</div>
		{:else if jobsQuery.isError}
			<div class="error-state">
				<Icon name="alert-circle" size={32} />
				<p>{jobsQuery.error?.message || m.sidebar_jobs_error()}</p>
				<Button size="small" onclick={() => jobsQuery.refetch()}>{m.retry()}</Button>
			</div>
		{:else if Object.keys(filteredJobs).length === 0}
			<div class="empty-state">
				<Icon name="briefcase" size={32} />
				<p>{m.sidebar_no_jobs()}</p>
				{#if searchQuery || selectedTiers.size > 0}
					<Button
						size="small"
						variant="ghost"
						onclick={() => {
							searchQuery = ''
							selectedTiers = new Set(['4', '5', 'ex2', 'o1'])
						}}
					>
						{m.sidebar_clear_filters()}
					</Button>
				{/if}
			</div>
		{:else}
			<div class="jobs-grid">
				{#each Object.entries(filteredJobs) as [tierName, jobs]}
					<div class="tier-group">
						<div class="tier-header">
							<h4>{tierName}</h4>
						</div>
						<div class="jobs-list">
							{#each jobs as job (job.id)}
								<JobItem {job} selected={isJobSelected(job)} onClick={() => handleSelectJob(job)} />
							{/each}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style lang="scss">
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.job-selection-content {
		display: flex;
		flex-direction: column;
		height: 100%;
		overflow: hidden;
	}

	.search-section {
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
		padding: 0 spacing.$unit-2x spacing.$unit-2x;
	}

	.jobs-container {
		flex: 1;
		overflow-y: auto;
		padding: spacing.$unit-2x 0;
	}

	.loading-state,
	.error-state,
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: spacing.$unit;
		padding: spacing.$unit-4x;
		color: var(--text-secondary);

		:global(svg) {
			color: var(--text-tertiary);
		}

		p {
			margin: 0;
			font-size: typography.$font-regular;
		}
	}

	.loading-state :global(svg) {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.jobs-grid {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-3x;
	}

	.tier-group {
		.tier-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			margin-bottom: spacing.$unit;
			padding: 0 spacing.$unit-2x spacing.$unit-half;

			h4 {
				margin: 0;
				font-size: typography.$font-small;
				font-weight: typography.$medium;
				color: var(--text-secondary);
				letter-spacing: 0.5px;
			}

			.job-count {
				padding: spacing.$unit-half spacing.$unit-2x;
				background: var(--badge-bg);
				border-radius: layout.$card-corner;
				font-size: typography.$font-small;
				color: var(--text-secondary);
			}
		}

		.jobs-list {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
			padding: 0 spacing.$unit;
		}
	}
</style>
