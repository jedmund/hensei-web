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

	const jobsQuery = createQuery(() => jobQueries.list())

	let searchQuery = $state('')
	let selectedTiers = $state<Set<string>>(new Set(['4', '5', 'ex2', 'o1']))
	let resultsScrolled = $state(false)
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

	const filteredJobs = $derived(
		(() => {
			let jobs = jobsQuery.data || []

			if (searchQuery) {
				const query = searchQuery.toLowerCase()
				jobs = jobs.filter(
					(job) =>
						job.name.en.toLowerCase().includes(query) || job.name.ja?.toLowerCase().includes(query)
				)
			}

			if (selectedTiers.size > 0) {
				jobs = jobs.filter((job) => {
					const jobTier = job.row.toString().toLowerCase()
					return selectedTiers.has(jobTier)
				})
			}

			jobs = [...jobs].sort((a, b) => {
				const tierDiff = getJobTierOrder(a.row) - getJobTierOrder(b.row)
				if (tierDiff !== 0) return tierDiff
				return a.order - b.order
			})

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
	<div class="controls" class:scrolled={resultsScrolled}>
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

	<div class="results-section" onscroll={(e) => { resultsScrolled = e.currentTarget.scrollTop > 0 }}>
		{#if jobsQuery.isLoading}
			<div class="loading">
				<Icon name="loader-2" size={24} />
				<span>{m.sidebar_loading_jobs()}</span>
			</div>
		{:else if jobsQuery.isError}
			<div class="error-state">
				<Icon name="alert-circle" size={24} />
				<p>{jobsQuery.error?.message || m.sidebar_jobs_error()}</p>
				<Button size="small" onclick={() => jobsQuery.refetch()}>{m.retry()}</Button>
			</div>
		{:else if Object.keys(filteredJobs).length === 0}
			<div class="no-results">
				{#if searchQuery || selectedTiers.size > 0}
					{m.sidebar_no_jobs()}
				{:else}
					{m.sidebar_no_jobs()}
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
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;

	.job-selection-content {
		display: flex;
		flex-direction: column;
		height: calc(100vh - 60px);
		overflow: hidden;
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

	.jobs-grid {
		display: flex;
		flex-direction: column;
		gap: $unit-3x;
		padding-top: $unit;
	}

	.tier-group {
		.tier-header {
			display: flex;
			align-items: center;
			margin-bottom: $unit;
			padding: 0 $unit-half;

			h4 {
				margin: 0;
				font-size: $font-small;
				font-weight: $medium;
				color: var(--text-secondary);
				letter-spacing: 0.5px;
			}
		}

		.jobs-list {
			display: flex;
			flex-direction: column;
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
