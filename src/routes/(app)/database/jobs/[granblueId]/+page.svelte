
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
	import DatabasePageHeader from '$lib/components/database/DatabasePageHeader.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import NotFoundPlaceholder from '$lib/components/database/NotFoundPlaceholder.svelte'
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
	import { localizeHref } from '$lib/paraglide/runtime'

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
	<DatabasePageHeader title="Job">
		{#snippet leftAction()}
			<Button variant="ghost" size="small" leftIcon="chevron-left" href="/database/jobs">Back</Button>
		{/snippet}
		{#snippet rightAction()}
			{#if canEdit && editUrl}
				<Button variant="secondary" size="small" href={editUrl}>Edit</Button>
			{/if}
		{/snippet}
	</DatabasePageHeader>

	{#if job}
		<DetailScaffold
			type="job"
			item={job}
			image={getJobIconUrl(job.granblueId)}
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
		<NotFoundPlaceholder
			title="Job Not Found"
			message="The job you're looking for could not be found."
			backHref={localizeHref('/database/jobs')}
			backLabel="Back to Jobs"
		/>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/database' as database;

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
		@include database.details;
	}
</style>
