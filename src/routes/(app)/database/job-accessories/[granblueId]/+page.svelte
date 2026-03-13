
<script lang="ts">
	// SvelteKit imports
	import { goto } from '$app/navigation'

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

	// Utils
	import { getAccessoryTypeName } from '$lib/utils/jobAccessoryUtils'
	import { getJobAccessoryImageUrl } from '$lib/utils/jobAccessoryUtils'
	import { getJobIconUrl } from '$lib/utils/jobUtils'
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
	<DatabasePageHeader title="Job Accessory" backHref="/database/jobs?view=accessories">
		{#snippet rightAction()}
			{#if canEdit && editUrl}
				<Button variant="secondary" size="small" href={editUrl}>Edit</Button>
			{/if}
		{/snippet}
	</DatabasePageHeader>

	{#if accessory}
		<div class="content">
			<header class="detail-header">
				<div class="detail-header-left">
					<div class="accessory-image">
						<img
							src={getJobAccessoryImageUrl(accessory.granblueId)}
							alt={displayName}
						/>
					</div>
					<div class="detail-header-info">
						<h2>{displayName}</h2>
						<div class="meta">
							<span
								class="type-badge"
								class:shield={accessory.accessoryType === 1}
								class:manatura={accessory.accessoryType === 2}
							>
								{getAccessoryTypeName(accessory.accessoryType)}
							</span>
						</div>
					</div>
				</div>
			</header>

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
							<a href={localizeHref(`/database/jobs/${accessory.job.granblueId}`)} class="job-link">
								<img
									src={getJobIconUrl(accessory.job.granblueId)}
									alt=""
									class="job-link-icon"
								/>
								{localizedName(accessory.job.name)}
							</a>
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
		<div class="not-found">
			<h2>Accessory Not Found</h2>
			<p>The accessory you're looking for could not be found.</p>
			<Button variant="secondary" size="small" href={localizeHref('/database/jobs?view=accessories')}>
				Back to Accessories
			</Button>
		</div>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.page {
		background: var(--card-bg);
		border-radius: layout.$page-corner;
		box-shadow: var(--shadow-sm);
	}

	.content {
		overflow: visible;
		position: relative;
	}

	.detail-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: spacing.$unit-2x;
		padding: 0 spacing.$unit-2x spacing.$unit-2x;
	}

	.detail-header-left {
		display: flex;
		align-items: center;
		gap: spacing.$unit-2x;
	}

	.accessory-image {
		flex-shrink: 0;

		img {
			width: 96px;
			height: auto;
			border-radius: layout.$item-corner;
		}
	}

	.detail-header-info {
		flex: 1;

		h2 {
			font-size: typography.$font-xlarge;
			font-weight: typography.$bold;
			margin: 0 0 spacing.$unit 0;
			color: var(--text-primary);
		}

		.meta {
			display: flex;
			flex-direction: row;
			gap: spacing.$unit;
			align-items: center;
		}
	}

	.details {
		display: flex;
		flex-direction: column;
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

	.job-link {
		display: flex;
		align-items: center;
		gap: spacing.$unit-half;
		padding: spacing.$unit-half;
		border-radius: layout.$item-corner;
		color: var(--blue);
		text-decoration: none;
		transition: background-color 0.15s ease;

		&:hover {
			background: var(--button-contained-bg-hover);
		}
	}

	.job-link-icon {
		width: auto;
		height: 24px;
		object-fit: contain;
		border-radius: layout.$item-corner-small;
	}

	.empty-value {
		color: var(--text-secondary);
	}

	.loading,
	.not-found {
		text-align: center;
		padding: spacing.$unit * 4;
		color: var(--text-secondary);
	}

	@media (max-width: 768px) {
		.detail-header {
			flex-direction: column;
		}

		.accessory-image img {
			width: 64px;
		}
	}
</style>
