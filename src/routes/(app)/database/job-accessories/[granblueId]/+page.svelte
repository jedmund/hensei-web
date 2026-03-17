
<script lang="ts">
	// Page metadata
	import PageMeta from '$lib/components/PageMeta.svelte'
	import * as m from '$lib/paraglide/messages'

	// TanStack Query
	import { createQuery } from '@tanstack/svelte-query'
	import { jobQueries } from '$lib/api/queries/job.queries'
	import { withInitialData } from '$lib/query/ssr'

	// Components
	import Button from '$lib/components/ui/Button.svelte'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import DatabasePageHeader from '$lib/components/database/DatabasePageHeader.svelte'
	import DetailEntityHeader from '$lib/components/database/DetailEntityHeader.svelte'
	import NotFoundPlaceholder from '$lib/components/database/NotFoundPlaceholder.svelte'
	import AssociatedEntityLink from '$lib/components/database/AssociatedEntityLink.svelte'

	// Utils
	import { getAccessoryTypeName } from '$lib/utils/jobAccessoryUtils'
	import { getAccessoryImage } from '$lib/utils/images'
	import { localizedName } from '$lib/utils/locale'
	import { localizeHref } from '$lib/paraglide/runtime'
	import { getRarityLabel } from '$lib/utils/rarity'

	// Types
	import type { PageData } from './$types'

	let { data }: { data: PageData } = $props()

	// Use TanStack Query with SSR initial data
	const accessoryQuery = createQuery(() => ({
		...jobQueries.accessoryById(data.accessory?.granblueId ?? ''),
		...withInitialData(data.accessory)
	}))

	// Get accessory from query
	const accessory = $derived(accessoryQuery.data)
	const userRole = $derived(data.role || 0)
	const canEdit = $derived(userRole >= 7)

	// Edit URL for navigation
	const editUrl = $derived(
		accessory?.granblueId
			? `/database/job-accessories/${accessory.granblueId}/edit`
			: undefined
	)

	// Page title
	const pageTitle = $derived(
		m.page_title_db_entity({ name: accessory?.name?.en ?? 'Job Accessory' })
	)

	// Display name
	const displayName = $derived.by(() => {
		const nameObj = accessory?.name
		if (!nameObj) return 'Unknown'
		if (typeof nameObj === 'string') return nameObj
		return nameObj.en || nameObj.ja || 'Unknown'
	})
</script>

<PageMeta title={pageTitle} description={m.page_desc_home()} />

<div class="page">
	<DatabasePageHeader title="Job Accessory">
		{#snippet leftAction()}
			<Button variant="ghost" size="small" leftIcon="chevron-left" href="/database/jobs?view=accessories">Back</Button>
		{/snippet}
		{#snippet rightAction()}
			{#if canEdit && editUrl}
				<Button variant="secondary" size="small" href={editUrl}>Edit</Button>
			{/if}
		{/snippet}
	</DatabasePageHeader>

	{#if accessory}
		<div class="content">
			<DetailEntityHeader imageUrl={getAccessoryImage(accessory.granblueId)} name={displayName} imageSize={96}>
				{#snippet meta()}
					<span
						class="type-badge"
						class:shield={accessory.accessoryType === 1}
						class:manatura={accessory.accessoryType === 2}
					>
						{getAccessoryTypeName(accessory.accessoryType)}
					</span>
				{/snippet}
			</DetailEntityHeader>

			<section class="details">
				<DetailsContainer title="Metadata">
					<DetailItem label="Name (EN)" value={accessory.name.en} />
					<DetailItem label="Name (JP)" value={accessory.name.ja ?? '—'} />
					<DetailItem label="Rarity" value={getRarityLabel(accessory.rarity)} />
					<DetailItem label="Granblue ID" value={accessory.granblueId} />
				</DetailsContainer>

				<DetailsContainer title="Classification">
					<DetailItem label="Accessory Type">
						<span
							class="type-badge"
							class:shield={accessory.accessoryType === 1}
							class:manatura={accessory.accessoryType === 2}
						>
							{getAccessoryTypeName(accessory.accessoryType)}
						</span>
					</DetailItem>
					<DetailItem label="Release Date" value={accessory.releaseDate ?? '—'} />
				</DetailsContainer>

				<DetailsContainer title="Associated Job">
					<DetailItem label="Job">
						{#if accessory.job}
							<AssociatedEntityLink type="job" entity={accessory.job} />
						{:else}
							<span class="empty-value">—</span>
						{/if}
					</DetailItem>
				</DetailsContainer>
			</section>
		</div>
	{:else if accessoryQuery.isLoading}
		<div class="loading">Loading accessory...</div>
	{:else}
		<NotFoundPlaceholder
			title="Accessory Not Found"
			message="The accessory you're looking for could not be found."
			backHref={localizeHref('/database/jobs?view=accessories')}
			backLabel="Back to Accessories"
		/>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/database' as database;

	.page {
		background: var(--card-bg);
		border-radius: layout.$page-corner;
		box-shadow: var(--shadow-sm);
	}

	.content {
		overflow: visible;
		position: relative;
	}

	.details {
		@include database.details;
	}

	.type-badge {
		display: inline-block;
		padding: 2px 8px;
		border-radius: layout.$item-corner-small;
		font-size: typography.$font-small;
		font-weight: typography.$medium;

		&.shield {
			background: color-mix(in srgb, var(--water-button-bg) 20%, transparent);
			color: var(--water-text);
		}

		&.manatura {
			background: color-mix(in srgb, var(--fire-button-bg) 20%, transparent);
			color: var(--fire-text);
		}
	}

	.empty-value {
		color: var(--text-secondary);
	}

	.loading {
		text-align: center;
		padding: spacing.$unit * 4;
		color: var(--text-secondary);
	}
</style>
