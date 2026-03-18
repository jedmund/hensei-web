
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
	import { jobAdapter } from '$lib/api/adapters/job.adapter'
	import { withInitialData } from '$lib/query/ssr'

	// Components
	import Button from '$lib/components/ui/Button.svelte'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import DatabasePageHeader from '$lib/components/database/DatabasePageHeader.svelte'
	import DetailScaffold, {
		type DetailTab
	} from '$lib/features/database/detail/DetailScaffold.svelte'
	import EntityImagesTab from '$lib/features/database/detail/tabs/EntityImagesTab.svelte'
	import NotFoundPlaceholder from '$lib/components/database/NotFoundPlaceholder.svelte'
	import AssociatedEntityLink from '$lib/components/database/AssociatedEntityLink.svelte'
	import { toast } from 'svelte-sonner'

	// Utils
	import { getAccessoryTypeName } from '$lib/utils/jobAccessoryUtils'
	import { getAccessoryImage } from '$lib/utils/images'
	import { localizeHref } from '$lib/paraglide/runtime'
	import { getRarityLabel } from '$lib/utils/rarity'

	// Types
	import type { PageData } from './$types'
	import type { ImageItem } from '$lib/features/database/detail/tabs/EntityImagesTab.svelte'

	let { data }: { data: PageData } = $props()

	// Tab state from URL
	const currentTab = $derived(($page.url.searchParams.get('tab') as DetailTab) || 'info')

	function handleTabChange(tab: DetailTab) {
		const url = new URL($page.url)
		if (tab === 'info') {
			url.searchParams.delete('tab')
		} else {
			url.searchParams.set('tab', tab)
		}
		goto(url.toString(), { replaceState: true })
	}

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

	// Available image sizes
	const accessorySizes = ['grid', 'square']

	// Generate image items for the images tab
	const accessoryImages = $derived.by((): ImageItem[] => {
		if (!accessory?.granblueId) return []

		return accessorySizes.map((variant) => ({
			url: getAccessoryImage(accessory.granblueId, variant as 'grid' | 'square'),
			label: variant,
			variant
		}))
	})

	// Poll download status
	async function pollDownloadStatus(accessoryId: string, toastId: string | number): Promise<void> {
		const maxAttempts = 30
		for (let i = 0; i < maxAttempts; i++) {
			await new Promise((r) => setTimeout(r, 2000))
			const status = await jobAdapter.getAccessoryDownloadStatus(accessoryId)

			if (status.status === 'processing') {
				const downloaded = status.imagesDownloaded ?? 0
				const total = status.imagesTotal ?? 0
				toast.loading(`Downloading images… ${downloaded}/${total}`, { id: toastId })
			}

			if (status.status === 'completed') {
				toast.success(`Downloaded ${status.imagesDownloaded ?? ''} images`, { id: toastId })
				return
			}
			if (status.status === 'failed') {
				toast.error(status.error ?? 'Download failed', { id: toastId })
				return
			}
		}
		toast.error('Download timed out', { id: toastId })
	}

	// Image download handlers
	async function handleDownloadImage(
		size: string,
		_transformation: string | undefined,
		force: boolean
	) {
		if (!accessory?.granblueId) return
		await jobAdapter.downloadAccessoryImage(accessory.granblueId, size, force)
		toast.success('Image downloaded')
	}

	async function handleDownloadAllImages(force: boolean) {
		if (!accessory?.granblueId) return
		const toastId = toast.loading('Queuing download…')
		try {
			await jobAdapter.downloadAccessoryImages(accessory.granblueId, { force })
			toast.loading('Downloading images…', { id: toastId })
			await pollDownloadStatus(accessory.granblueId, toastId)
		} catch {
			toast.error('Failed to start download', { id: toastId })
		}
	}

	async function handleDownloadSize(size: string) {
		if (!accessory?.granblueId) return
		await jobAdapter.downloadAccessoryImage(accessory.granblueId, size, false)
		toast.success('Image downloaded')
	}
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
		<DetailScaffold
			type="accessory"
			item={accessory}
			image={getAccessoryImage(accessory.granblueId)}
			{currentTab}
			onTabChange={handleTabChange}
			showTabs={true}
			onDownloadAllImages={canEdit ? handleDownloadAllImages : undefined}
			onDownloadSize={canEdit ? handleDownloadSize : undefined}
			availableSizes={accessorySizes}
		>
			{#if currentTab === 'info'}
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
			{:else if currentTab === 'images'}
				<EntityImagesTab
					images={accessoryImages}
					{canEdit}
					onDownloadImage={canEdit ? handleDownloadImage : undefined}
					onDownloadAllImages={canEdit ? handleDownloadAllImages : undefined}
				/>
			{/if}
		</DetailScaffold>
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
