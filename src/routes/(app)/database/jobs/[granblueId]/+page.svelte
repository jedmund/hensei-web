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
	import type { DetailTab } from '$lib/features/database/detail/DetailScaffold.svelte'
	import JobDetail from '$lib/features/database/jobs/JobDetail.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import DatabasePageHeader from '$lib/components/database/DatabasePageHeader.svelte'

	// Types
	import type { PageData } from './$types'

	let { data }: { data: PageData } = $props()

	function handleTabChange(tab: DetailTab) {
		const url = new URL($page.url)
		if (tab === 'info') {
			url.searchParams.delete('tab')
		} else {
			url.searchParams.set('tab', tab)
		}
		goto(url.toString(), { replaceState: true })
	}

	// Same query as the detail body (shared cache), for the header and title
	const jobQuery = createQuery(() => ({
		...jobQueries.byId(data.job?.granblueId ?? ''),
		...withInitialData(data.job)
	}))

	const job = $derived(jobQuery.data)
	const canEdit = $derived((data.role || 0) >= 7)

	// Edit URL for navigation
	const editUrl = $derived(job?.granblueId ? `/database/jobs/${job.granblueId}/edit` : undefined)

	// Page title
	const pageTitle = $derived(m.page_title_db_entity({ name: job?.name?.en ?? 'Job' }))
</script>

<PageMeta title={pageTitle} description={m.page_desc_home()} />

<div class="page">
	<DatabasePageHeader title="Job">
		{#snippet leftAction()}
			<Button variant="ghost" size="small" leftIcon="chevron-left" href="/database/jobs"
				>Back</Button
			>
		{/snippet}
		{#snippet rightAction()}
			{#if canEdit && editUrl}
				<Button variant="secondary" size="small" href={editUrl}>Edit</Button>
			{/if}
		{/snippet}
	</DatabasePageHeader>

	<JobDetail
		granblueId={data.job?.granblueId ?? ''}
		initialData={data.job}
		role={data.role || 0}
		tab={$page.url.searchParams.get('tab')}
		onTabChange={handleTabChange}
	/>
</div>

<style lang="scss">
	@use '$src/themes/layout' as layout;

	.page {
		background: var(--card-bg);
		border-radius: layout.$card-corner;
		box-shadow: var(--shadow-sm);
	}
</style>
