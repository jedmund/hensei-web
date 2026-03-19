
<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query'
	import { entityQueries } from '$lib/api/queries/entity.queries'
	import { withInitialData } from '$lib/query/ssr'
	import PageMeta from '$lib/components/PageMeta.svelte'
	import * as m from '$lib/paraglide/messages'
	import DatabasePageHeader from '$lib/components/database/DatabasePageHeader.svelte'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import NotFoundPlaceholder from '$lib/components/database/NotFoundPlaceholder.svelte'
	import { localizedName } from '$lib/utils/locale'
	import type { PageData } from './$types'

	let { data }: { data: PageData } = $props()

	const seriesQuery = createQuery(() => ({
		...entityQueries.characterSeries(data.series?.slug ?? ''),
		...withInitialData(data.series)
	}))

	const series = $derived(seriesQuery.data)
	const userRole = $derived(data.role || 0)
	const canEdit = $derived(userRole >= 7)
	const editUrl = $derived(series?.slug ? `/database/series/characters/${series.slug}/edit` : undefined)

	const pageTitle = $derived(series?.name ? `${localizedName(series.name)} Series` : 'Character Series')
</script>

<PageMeta title={pageTitle} description={m.page_desc_home()} />

<div class="page">
	<DatabasePageHeader title="Character Series">
		{#snippet leftAction()}
			<Button variant="ghost" size="small" leftIcon="chevron-left" href="/database/characters?view=series">Back</Button>
		{/snippet}
		{#snippet rightAction()}
			{#if canEdit && editUrl}
				<Button variant="ghost" size="small" href={editUrl}>Edit</Button>
			{/if}
		{/snippet}
	</DatabasePageHeader>

	{#if series}
		<div class="content">
			<DetailsContainer title="Basic Info">
				<DetailItem label="Name (EN)" value={series.name.en} />
				<DetailItem label="Name (JA)" value={series.name.ja} />
				<DetailItem label="Slug" value={series.slug} />
				<DetailItem label="Order" value={series.order} />
			</DetailsContainer>

			{#if series.characterCount !== undefined}
				<DetailsContainer title="Statistics">
					<DetailItem label="Character Count" value={series.characterCount} />
				</DetailsContainer>
			{/if}
		</div>
	{:else}
		<NotFoundPlaceholder
			title="Series Not Found"
			message="The character series you're looking for could not be found."
			backHref="/database/characters?view=series"
			backLabel="Back to Series"
		/>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/database' as database;
	@use '$src/themes/layout' as layout;

	.page {
		background: var(--card-bg);
		border-radius: layout.$page-corner;
		box-shadow: var(--shadow-sm);
	}

	.content {
		@include database.details;
	}
</style>
