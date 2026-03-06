<svelte:options runes={true} />

<script lang="ts">
	import { goto } from '$app/navigation'
	import { page } from '$app/stores'
	import { createQuery } from '@tanstack/svelte-query'
	import { raidAdapter } from '$lib/api/adapters/raid.adapter'
	import Button from '$lib/components/ui/Button.svelte'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import ElementBadge from '$lib/components/ui/ElementBadge.svelte'
	import DetailScaffold, { type DetailTab } from '$lib/features/database/detail/DetailScaffold.svelte'
	import EntityImagesTab from '$lib/features/database/detail/tabs/EntityImagesTab.svelte'
	import DatabasePageHeader from '$lib/components/database/DatabasePageHeader.svelte'
	import type { PageData } from './$types'
	import type { ImageItem } from '$lib/features/database/detail/tabs/EntityImagesTab.svelte'
	import { getRaidImage, getRaidCdnImage, type RaidImageVariant } from '$lib/utils/images'

	function displayName(input: any): string {
		if (!input) return '—'
		const maybe = input.name ?? input
		if (typeof maybe === 'string') return maybe
		if (maybe && typeof maybe === 'object') return maybe.en || maybe.ja || '—'
		return '—'
	}

	interface Props {
		data: PageData
	}

	let { data }: Props = $props()

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

	// Get raid slug from URL
	const raidSlug = $derived($page.params.slug)

	// Query for raid data
	const raidQuery = createQuery(() => ({
		queryKey: ['raids', raidSlug],
		queryFn: () => raidAdapter.getBySlug(raidSlug ?? ''),
		enabled: !!raidSlug
	}))

	const raid = $derived(raidQuery.data)
	const userRole = $derived(data.role || 0)
	const canEdit = $derived(userRole >= 7)

	// Edit URL for navigation
	const editUrl = $derived(raidSlug ? `/database/raids/${raidSlug}/edit` : undefined)

	// Navigate back
	function handleBack() {
		goto('/database/raids')
	}

	// Navigate to group detail
	function handleGroupClick() {
		if (raid?.group?.id) {
			goto(`/database/raid-groups/${raid.group.id}`)
		}
	}

	// Get header image - use local raid-thumbnail, fallback to icon from CDN
	const headerImage = $derived.by(() => {
		if (raid?.slug) return getRaidImage(raid.slug, 'thumbnail')
		if (raid?.enemy_id) return getRaidCdnImage('icon', raid.enemy_id)
		return ''
	})

	// Available image sizes for raids (always show all types)
	const raidSizes = ['icon', 'thumbnail', 'lobby', 'background']

	// Generate image items for raid (using CDN URLs for the images tab)
	// Always show all image types so user can right-click to download
	const raidImages = $derived.by((): ImageItem[] => {
		if (!raid) return []

		return [
			{
				url: getRaidCdnImage('icon', raid.enemy_id),
				label: 'Icon',
				variant: 'icon'
			},
			{
				url: getRaidCdnImage('thumbnail', raid.summon_id),
				label: 'Thumbnail',
				variant: 'thumbnail'
			},
			{
				url: getRaidCdnImage('lobby', raid.quest_id),
				label: 'Lobby',
				variant: 'lobby'
			},
			{
				url: getRaidCdnImage('background', raid.quest_id),
				label: 'Background',
				variant: 'background'
			}
		]
	})

	// Image download handlers
	type RaidImageSize = 'icon' | 'thumbnail' | 'lobby' | 'background'

	async function handleDownloadImage(
		size: string,
		_transformation: string | undefined,
		force: boolean
	) {
		if (!raidSlug) return
		await raidAdapter.downloadRaidImage(raidSlug, size as RaidImageSize, force)
	}

	async function handleDownloadAllImages(force: boolean) {
		if (!raidSlug) return
		await raidAdapter.downloadRaidImages(raidSlug, { force })
	}

	async function handleDownloadSize(size: string) {
		if (!raidSlug) return
		await raidAdapter.downloadRaidImage(raidSlug, size as RaidImageSize, false)
	}
</script>

<div class="page">
	<DatabasePageHeader title="Raid" backHref="/database/raids">
		{#snippet rightAction()}
			{#if canEdit && editUrl}
				<Button variant="secondary" size="small" href={editUrl}>Edit</Button>
			{/if}
		{/snippet}
	</DatabasePageHeader>

	{#if raidQuery.isLoading}
		<div class="loading-state">
			<p>Loading raid...</p>
		</div>
	{:else if raidQuery.isError}
		<div class="error-state">
			<p>Failed to load raid</p>
			<Button variant="secondary" onclick={handleBack}>Back to Raids</Button>
		</div>
	{:else if raid}
		<DetailScaffold
			type="raid"
			item={raid}
			image={headerImage}
			{currentTab}
			onTabChange={handleTabChange}
			onDownloadAllImages={canEdit ? handleDownloadAllImages : undefined}
			onDownloadSize={canEdit ? handleDownloadSize : undefined}
			availableSizes={raidSizes}
		>
			{#if currentTab === 'info'}
				<section class="details">
					<DetailsContainer title="Raid Details">
						<DetailItem label="Name (EN)" value={raid.name.en || '-'} />
						<DetailItem label="Name (JA)" value={raid.name.ja || '-'} />
						<DetailItem label="Slug" value={raid.slug || '-'} />
						<DetailItem label="Level" value={raid.level?.toString() ?? '-'} />
						<DetailItem label="Element">
							{#if raid.element !== undefined && raid.element !== null}
								<ElementBadge element={raid.element} />
							{:else}
								<span class="no-value">-</span>
							{/if}
						</DetailItem>
					</DetailsContainer>

					<DetailsContainer title="IDs">
						<DetailItem label="Enemy ID" value={raid.enemy_id?.toString() ?? '-'} />
						<DetailItem label="Summon ID" value={raid.summon_id?.toString() ?? '-'} />
						<DetailItem label="Quest ID" value={raid.quest_id?.toString() ?? '-'} />
					</DetailsContainer>

					<DetailsContainer title="Classification">
						<DetailItem label="Group">
							{#if raid.group}
								<Button variant="ghost" size="small" rightIcon="chevron-right-small" onclick={handleGroupClick}>
									{displayName(raid.group)}
								</Button>
							{:else}
								<span class="no-value">-</span>
							{/if}
						</DetailItem>
						{#if raid.group}
							<DetailItem label="Difficulty" value={raid.group.difficulty?.toString() ?? '-'} />
							<DetailItem label="HL">
								<span class="badge" class:active={raid.group.hl}>{raid.group.hl ? 'Yes' : 'No'}</span>
							</DetailItem>
							<DetailItem label="Extra">
								<span class="badge" class:active={raid.group.extra}>{raid.group.extra ? 'Yes' : 'No'}</span>
							</DetailItem>
							<DetailItem label="Guidebooks">
								<span class="badge" class:active={raid.group.guidebooks}>{raid.group.guidebooks ? 'Yes' : 'No'}</span>
							</DetailItem>
						{/if}
					</DetailsContainer>
				</section>
			{:else if currentTab === 'images'}
				<EntityImagesTab
					images={raidImages}
					{canEdit}
					onDownloadImage={canEdit ? handleDownloadImage : undefined}
				/>
			{:else if currentTab === 'raw'}
				<div class="raw-placeholder">
					<p>Raw data not available for raids.</p>
				</div>
			{/if}
		</DetailScaffold>
	{:else}
		<div class="not-found">
			<h2>Raid Not Found</h2>
			<p>The raid you're looking for could not be found.</p>
			<Button variant="secondary" onclick={handleBack}>Back to Raids</Button>
		</div>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/effects' as effects;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.page {
		background: var(--card-bg);
		border: 0.5px solid rgba(0, 0, 0, 0.18);
		border-radius: layout.$page-corner;
		box-shadow: effects.$page-elevation;
	}

	.loading-state,
	.error-state {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		min-height: 200px;
		gap: spacing.$unit-2x;
		color: var(--text-secondary);
	}

	.not-found {
		text-align: center;
		padding: spacing.$unit-4x;

		h2 {
			margin-bottom: spacing.$unit;
		}

		p {
			color: var(--text-secondary);
			margin-bottom: spacing.$unit-2x;
		}
	}

	.details {
		display: flex;
		flex-direction: column;
	}

	.no-value {
		color: var(--text-tertiary);
	}

	.badge {
		display: inline-block;
		padding: 2px 8px;
		border-radius: layout.$item-corner-small;
		font-size: typography.$font-small;
		background: #f0f0f0;
		color: #666;

		&.active {
			background: #28a745;
			color: white;
		}
	}

	.raw-placeholder {
		padding: spacing.$unit-4x;
		text-align: center;
		color: var(--text-secondary);
	}
</style>
