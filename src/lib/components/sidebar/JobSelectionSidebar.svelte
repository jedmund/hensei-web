<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query'
	import type { Job } from '$lib/types/api/entities'
	import { jobQueries } from '$lib/api/queries/job.queries'
	import { getJobTierName, getJobTierOrder } from '$lib/utils/jobUtils'
	import JobItem from '../job/JobItem.svelte'
	import JobTierSelector from '../job/JobTierSelector.svelte'
	import Input from '../ui/Input.svelte'
	import SelectionSidebarLayout from './SelectionSidebarLayout.svelte'
	import * as m from '$lib/paraglide/messages'

	type ElementType = 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'

	interface Props {
		currentJobId?: string
		onSelectJob?: (job: Job) => void
		element?: ElementType
	}

	let { currentJobId, onSelectJob, element }: Props = $props()

	const jobsQuery = createQuery(() => jobQueries.list())

	let searchQuery = $state('')
	let selectedTiers = $state<Set<string>>(new Set(['4', '5', 'ex2', 'o1']))
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
	<SelectionSidebarLayout
		isLoading={jobsQuery.isLoading}
		isError={jobsQuery.isError}
		isEmpty={Object.keys(filteredJobs).length === 0}
		error={jobsQuery.error?.message}
		onRetry={() => jobsQuery.refetch()}
		loadingMessage={m.sidebar_loading_jobs()}
		emptyMessage={m.sidebar_no_jobs()}
		errorMessage={m.sidebar_jobs_error()}
	>
		{#snippet controls()}
			<Input
				type="text"
				placeholder={m.job_selection_search_placeholder()}
				bind:value={searchQuery}
				leftIcon="search"
				fullWidth={true}
				contained={true}
			/>

			<JobTierSelector {tiers} {selectedTiers} onToggleTier={toggleTier} {element} />
		{/snippet}

		{#snippet results()}
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
		{/snippet}
	</SelectionSidebarLayout>
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
</style>
