<svelte:options runes={true} />

<script lang="ts">
	// SvelteKit imports
	import { goto } from '$app/navigation'
	import { page } from '$app/stores'

	// Page metadata
	import PageMeta from '$lib/components/PageMeta.svelte'
	import * as m from '$lib/paraglide/messages'

	// TanStack Query
	import { createQuery } from '@tanstack/svelte-query'
	import { jobQueries } from '$lib/api/queries/job.queries'
	import { withInitialData } from '$lib/query/ssr'

	// Components
	import DetailScaffold, { type DetailTab } from '$lib/features/database/detail/DetailScaffold.svelte'
	import SegmentedControl from '$lib/components/ui/segmented-control/SegmentedControl.svelte'
	import Segment from '$lib/components/ui/segmented-control/Segment.svelte'

	// Section Components
	import JobMetadataSection from '$lib/features/database/jobs/sections/JobMetadataSection.svelte'
	import JobProficiencySection from '$lib/features/database/jobs/sections/JobProficiencySection.svelte'
	import JobFeaturesSection from '$lib/features/database/jobs/sections/JobFeaturesSection.svelte'

	// Tab Components
	import JobSkillsTab from '$lib/features/database/jobs/tabs/JobSkillsTab.svelte'
	import JobImagesTab from '$lib/features/database/jobs/tabs/JobImagesTab.svelte'

	// Utils
	import { getJobIconUrl } from '$lib/utils/jobUtils'

	// Types
	import type { PageData } from './$types'

	type JobTab = 'info' | 'skills' | 'images'

	let { data }: { data: PageData } = $props()

	// Tab state from URL
	const currentTab = $derived(($page.url.searchParams.get('tab') as JobTab) || 'info')

	function handleTabChange(tab: string) {
		const url = new URL($page.url)
		if (tab === 'info') {
			url.searchParams.delete('tab')
		} else {
			url.searchParams.set('tab', tab)
		}
		goto(url.toString(), { replaceState: true })
	}

	// Use TanStack Query with SSR initial data
	const jobQuery = createQuery(() => ({
		...jobQueries.byId(data.job?.granblueId ?? ''),
		...withInitialData(data.job)
	}))

	// Get job from query
	const job = $derived(jobQuery.data)
	const userRole = $derived(data.role || 0)
	const canEdit = $derived(userRole >= 7)

	// Edit URL for navigation
	const editUrl = $derived(job?.granblueId ? `/database/jobs/${job.granblueId}/edit` : undefined)

	// Page title
	const pageTitle = $derived(m.page_title_db_entity({ name: job?.name?.en ?? 'Job' }))
</script>

<PageMeta title={pageTitle} description={m.page_desc_home()} />

<div class="page">
	{#if job}
		<DetailScaffold
			type="job"
			item={job}
			image={getJobIconUrl(job.granblueId)}
			showEdit={canEdit}
			editUrl={canEdit ? editUrl : undefined}
			currentTab={currentTab as DetailTab}
			onTabChange={handleTabChange}
			showTabs={false}
		>
			<div class="tabs-bar">
				<SegmentedControl value={currentTab} onValueChange={handleTabChange} variant="background" size="small">
					<Segment value="info">Info</Segment>
					<Segment value="skills">Skills</Segment>
					<Segment value="images">Images</Segment>
				</SegmentedControl>
			</div>

			{#if currentTab === 'info'}
				<section class="details">
					<JobMetadataSection {job} />
					<JobProficiencySection {job} />
					<JobFeaturesSection {job} />
				</section>
			{:else if currentTab === 'skills'}
				<JobSkillsTab {job} {canEdit} />
			{:else if currentTab === 'images'}
				<JobImagesTab {job} />
			{/if}
		</DetailScaffold>
	{:else}
		<div class="not-found">
			<h2>Job Not Found</h2>
			<p>The job you're looking for could not be found.</p>
			<button onclick={() => goto('/database/jobs')}>Back to Jobs</button>
		</div>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;

	.page {
		background: var(--card-bg);
		border-radius: layout.$card-corner;
		box-shadow: var(--shadow-sm);
	}

	.tabs-bar {
		padding: spacing.$unit-2x;
		border-bottom: 1px solid var(--separator-bg);
	}

	.details {
		display: flex;
		flex-direction: column;
	}

	.not-found {
		text-align: center;
		padding: spacing.$unit * 4;

		button {
			background: var(--blue);
			color: white;
			border: none;
			padding: spacing.$unit spacing.$unit-2x;
			border-radius: layout.$item-corner;
			cursor: pointer;
			margin-top: spacing.$unit;

			&:hover {
				filter: brightness(0.9);
			}
		}
	}
</style>
