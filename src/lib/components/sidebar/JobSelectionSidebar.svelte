<script lang="ts">
	import { onDestroy } from 'svelte'
	import { SvelteSet } from 'svelte/reactivity'
	import { createInfiniteQuery, createQuery } from '@tanstack/svelte-query'
	import type { Job } from '$lib/types/api/entities'
	import { jobQueries } from '$lib/api/queries/job.queries'
	import { useInfiniteLoader } from '$lib/stores/loaderState.svelte'
	import { getLocale } from '$lib/paraglide/runtime'
	import { filterJobsStrictly, groupJobsByTier, isJobSearchQuery } from '$lib/utils/jobUtils'
	import JobItem from '../job/JobItem.svelte'
	import JobTierSelector from '../job/JobTierSelector.svelte'
	import Icon from '../Icon.svelte'
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

	const SEARCH_DEBOUNCE_MS = 300

	const jobsQuery = createQuery(() => jobQueries.list())

	let searchQuery = $state('')
	let debouncedSearchQuery = $state('')
	let debounceTimer: ReturnType<typeof setTimeout> | undefined
	let isComposing = $state(false)

	// Tier values are the stored job rows
	let selectedTiers = new SvelteSet(['4', '5', 'ex2', 'o1'])
	const tiers = [
		{ value: '1', label: m.job_tier_class_1(), shortLabel: 'I' },
		{ value: '2', label: m.job_tier_class_2(), shortLabel: 'II' },
		{ value: '3', label: m.job_tier_class_3(), shortLabel: 'III' },
		{ value: '4', label: m.job_tier_class_4(), shortLabel: 'IV' },
		{ value: '5', label: m.job_tier_class_5(), shortLabel: 'V' },
		{ value: 'ex1', label: m.job_tier_ex(), shortLabel: 'EXI' },
		{ value: 'ex2', label: m.job_tier_ex2(), shortLabel: 'EXII' },
		{ value: 'o1', label: m.job_tier_origin_1(), shortLabel: 'OI' }
	]

	function toggleTier(value: string) {
		if (selectedTiers.has(value)) {
			selectedTiers.delete(value)
		} else {
			selectedTiers.add(value)
		}
	}

	function handleCompositionStart() {
		isComposing = true
	}

	function handleCompositionEnd() {
		setTimeout(() => {
			isComposing = false
		}, 50)
	}

	// Debounce query changes (skipped during IME composition)
	$effect(() => {
		const query = searchQuery

		if (debounceTimer) clearTimeout(debounceTimer)
		if (isComposing) return

		debounceTimer = setTimeout(() => {
			debouncedSearchQuery = query.trim()
		}, SEARCH_DEBOUNCE_MS)

		return () => {
			if (debounceTimer) clearTimeout(debounceTimer)
		}
	})

	const rowFilter = $derived([...selectedTiers])

	// Two or more characters search the API; shorter queries browse the full list
	const searching = $derived(isJobSearchQuery(debouncedSearchQuery))

	const searchResultsQuery = createInfiniteQuery(() => ({
		...jobQueries.search(
			debouncedSearchQuery,
			rowFilter.length > 0 ? { row: rowFilter } : undefined,
			getLocale() as 'en' | 'ja'
		),
		enabled: searching
	}))

	let sentinelEl = $state<HTMLElement>()

	const loader = useInfiniteLoader(
		() => searchResultsQuery,
		() => sentinelEl,
		{ rootMargin: '200px' }
	)

	$effect(() => {
		void debouncedSearchQuery
		void rowFilter
		loader.reset()
	})

	onDestroy(() => loader.destroy())

	const browsedJobs = $derived.by(() => {
		let jobs = jobsQuery.data || []

		if (searchQuery) {
			const query = searchQuery.toLowerCase()
			jobs = jobs.filter(
				(job) =>
					job.name.en.toLowerCase().includes(query) || job.name.ja?.toLowerCase().includes(query)
			)
		}

		return filterJobsStrictly(jobs, { row: rowFilter })
	})

	// Keep the locally filtered list up until the search answers, so it doesn't blink
	const showSearchResults = $derived(
		searching && (searchResultsQuery.data !== undefined || searchResultsQuery.isError)
	)

	const filteredJobs = $derived(
		groupJobsByTier(
			showSearchResults
				? (searchResultsQuery.data?.pages.flatMap((page) => page.results) ?? [])
				: browsedJobs
		)
	)

	const activeQuery = $derived(showSearchResults ? searchResultsQuery : jobsQuery)

	function handleSelectJob(job: Job) {
		onSelectJob?.(job)
	}

	function isJobSelected(job: Job): boolean {
		return job.id === currentJobId
	}
</script>

<div class="job-selection-content">
	<SelectionSidebarLayout
		isLoading={activeQuery.isLoading}
		isError={activeQuery.isError}
		isEmpty={Object.keys(filteredJobs).length === 0}
		error={activeQuery.error?.message}
		onRetry={() => activeQuery.refetch()}
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
				oncompositionstart={handleCompositionStart}
				oncompositionend={handleCompositionEnd}
			/>

			<JobTierSelector {tiers} {selectedTiers} onToggleTier={toggleTier} {element} />
		{/snippet}

		{#snippet results()}
			<div class="jobs-grid">
				{#each Object.entries(filteredJobs) as [tierName, jobs] (tierName)}
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

				{#if showSearchResults}
					<div
						class="load-more-sentinel"
						bind:this={sentinelEl}
						class:hidden={!searchResultsQuery.hasNextPage}
					></div>

					{#if searchResultsQuery.isFetchingNextPage}
						<div class="loading-more">
							<Icon name="loader-2" size={20} />
							<span>{m.sidebar_loading_jobs()}</span>
						</div>
					{/if}
				{/if}
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
		height: calc(100dvh - 60px);
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

	.load-more-sentinel {
		height: 1px;

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
