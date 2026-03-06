<svelte:options runes={true} />

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

	// Utils
	import { getAccessoryTypeName } from '$lib/utils/jobAccessoryUtils'

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
	const editUrl = $derived(accessory?.granblueId ? `/database/job-accessories/${accessory.granblueId}/edit` : undefined)

	// Page title
	const pageTitle = $derived(m.page_title_db_entity({ name: accessory?.name?.en ?? 'Job Accessory' }))

	function handleBack() {
		goto('/database/jobs?view=accessories')
	}
</script>

<PageMeta title={pageTitle} description={m.page_desc_home()} />

<div class="page">
	{#if accessory}
		<div class="header">
			<div class="header-content">
				<button class="back-button" onclick={handleBack}>
					← Back to Accessories
				</button>
				<h1 class="title">{accessory.name.en}</h1>
				{#if accessory.name.ja}
					<p class="subtitle">{accessory.name.ja}</p>
				{/if}
			</div>
			{#if canEdit && editUrl}
				<Button href={editUrl} variant="secondary" size="small">Edit</Button>
			{/if}
		</div>

		<section class="details">
			<DetailsContainer title="Metadata">
				<DetailItem label="English Name">
					{accessory.name.en}
				</DetailItem>
				<DetailItem label="Japanese Name">
					{accessory.name.ja ?? '—'}
				</DetailItem>
				<DetailItem label="Granblue ID">
					<code>{accessory.granblueId}</code>
				</DetailItem>
			</DetailsContainer>

			<DetailsContainer title="Classification">
				<DetailItem label="Accessory Type">
					<span class="type-badge {accessory.accessoryType === 1 ? 'shield' : 'manatura'}">
						{getAccessoryTypeName(accessory.accessoryType)}
					</span>
				</DetailItem>
				<DetailItem label="Rarity">
					{accessory.rarity ?? '—'}
				</DetailItem>
				<DetailItem label="Release Date">
					{accessory.releaseDate ?? '—'}
				</DetailItem>
			</DetailsContainer>

			<DetailsContainer title="Associated Job">
				<DetailItem label="Job">
					{#if accessory.job}
						<a href="/database/jobs/{accessory.job.granblueId}" class="job-link">
							{accessory.job.name.en}
						</a>
					{:else}
						—
					{/if}
				</DetailItem>
			</DetailsContainer>
		</section>
	{:else if accessoryQuery.isLoading}
		<div class="loading">Loading accessory...</div>
	{:else}
		<div class="error">Failed to load accessory</div>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/effects' as effects;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.page {
		padding: spacing.$unit-2x 0;
		margin: 0 auto;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: spacing.$unit-2x;
		padding: spacing.$unit-2x;
		background: var(--card-bg);
		border: 0.5px solid rgba(0, 0, 0, 0.18);
		border-radius: layout.$page-corner;
		box-shadow: effects.$page-elevation;
	}

	.header-content {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-half;
	}

	.back-button {
		background: none;
		border: none;
		color: var(--text-secondary);
		font-size: typography.$font-small;
		cursor: pointer;
		padding: 0;
		margin-bottom: spacing.$unit-half;

		&:hover {
			color: var(--text-primary);
		}
	}

	.title {
		font-size: typography.$font-xlarge;
		font-weight: typography.$bold;
		margin: 0;
	}

	.subtitle {
		font-size: typography.$font-medium;
		color: var(--text-secondary);
		margin: 0;
	}

	.details {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x;
	}

	.type-badge {
		display: inline-block;
		padding: 2px 8px;
		border-radius: layout.$item-corner-small;
		font-size: typography.$font-small;
		font-weight: typography.$medium;

		&.shield {
			background: #e0f2fe;
			color: #0369a1;
		}

		&.manatura {
			background: #fce7f3;
			color: #be185d;
		}
	}

	.job-link {
		color: var(--blue);
		text-decoration: none;

		&:hover {
			text-decoration: underline;
		}
	}

	code {
		font-size: typography.$font-small;
		background: #f0f0f0;
		padding: 2px 6px;
		border-radius: 3px;
	}

	.loading,
	.error {
		text-align: center;
		padding: spacing.$unit * 4;
		color: var(--text-secondary);
	}

	.error {
		color: var(--red);
	}
</style>
