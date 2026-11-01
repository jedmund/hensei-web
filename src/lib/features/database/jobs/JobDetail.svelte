<script lang="ts">
	// Job detail body, shared by the full page and the database record panel.

	// TanStack Query
	import { createQuery } from '@tanstack/svelte-query'
	import { jobQueries } from '$lib/api/queries/job.queries'
	import { withInitialData } from '$lib/query/ssr'

	// Components
	import DetailScaffold, {
		type DetailTab
	} from '$lib/features/database/detail/DetailScaffold.svelte'
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
	import type { Job } from '$lib/types/api/entities'

	type JobTab = 'info' | 'skills' | 'images'

	interface Props {
		granblueId: string
		/** Server-loaded record (full page); the panel loads it through the query */
		initialData?: Job | null | undefined
		role: number
		/** Requested tab (`?tab=` on the full page, local state in the panel) */
		tab: string | null
		onTabChange: (tab: DetailTab) => void
	}

	let { granblueId, initialData, role, tab, onTabChange }: Props = $props()

	// Tab state from URL
	const currentTab = $derived((tab as JobTab) || 'info')

	// Use TanStack Query with SSR initial data
	const jobQuery = createQuery(() => ({
		...jobQueries.byId(granblueId),
		...(initialData ? withInitialData(initialData) : {})
	}))

	// Get job from query
	const job = $derived(jobQuery.data)
	const userRole = $derived(role || 0)
	const canEdit = $derived(userRole >= 7)
</script>

{#if job}
	<DetailScaffold
		type="job"
		item={job}
		image={getJobIconUrl(job.granblueId)}
		currentTab={currentTab as DetailTab}
		{onTabChange}
		showTabs={false}
	>
		<div class="tabs-bar">
			<SegmentedControl
				value={currentTab}
				onValueChange={(value) => onTabChange(value as DetailTab)}
				variant="background"
				size="small"
			>
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
{:else if jobQuery.isPending}
	<div class="loading" aria-busy="true"></div>
{:else}
	<NotFoundPlaceholder
		title="Job Not Found"
		message="The job you're looking for could not be found."
		backHref={localizeHref('/database/jobs')}
		backLabel="Back to Jobs"
	/>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/database' as database;

	.loading {
		min-height: 320px;
	}

	.tabs-bar {
		padding: spacing.$unit-2x;
		border-bottom: 1px solid var(--separator-bg);
	}

	.details {
		@include database.details;
	}
</style>
