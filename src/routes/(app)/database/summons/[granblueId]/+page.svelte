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
	import { entityQueries } from '$lib/api/queries/entity.queries'
	import { entityAdapter } from '$lib/api/adapters/entity.adapter'
	import { withInitialData } from '$lib/query/ssr'
	import { fetchWikiPage } from '$lib/api/wiki'

	// Components
	import DetailScaffold, { type DetailTab } from '$lib/features/database/detail/DetailScaffold.svelte'
	import SummonMetadataSection from '$lib/features/database/summons/sections/SummonMetadataSection.svelte'
	import SummonGachaSection from '$lib/features/database/summons/sections/SummonGachaSection.svelte'
	import SummonUncapSection from '$lib/features/database/summons/sections/SummonUncapSection.svelte'
	import SummonTaxonomySection from '$lib/features/database/summons/sections/SummonTaxonomySection.svelte'
	import SummonStatsSection from '$lib/features/database/summons/sections/SummonStatsSection.svelte'
	import EntityImagesTab from '$lib/features/database/detail/tabs/EntityImagesTab.svelte'
	import EntityRawDataTab from '$lib/features/database/detail/tabs/EntityRawDataTab.svelte'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import { getSummonImage } from '$lib/utils/images'
	import {
		buildWikiEnUrl,
		buildWikiJaUrl,
		buildGamewithUrl,
		buildKamigameUrl
	} from '$lib/utils/external-links'

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
	const summonQuery = createQuery(() => ({
		...entityQueries.summon(data.summon?.granblueId ?? ''),
		...withInitialData(data.summon)
	}))

	// Get summon from query
	const summon = $derived(summonQuery.data)
	const userRole = $derived(data.role || 0)
	const canEdit = $derived(userRole >= 7)

	// Edit URL for navigation
	const editUrl = $derived(summon?.granblueId ? `/database/summons/${summon.granblueId}/edit` : undefined)

	// Query for raw data (only when on raw tab)
	const rawDataQuery = createQuery(() => ({
		queryKey: ['summons', 'raw', summon?.id],
		queryFn: async () => {
			if (!summon?.id) return null
			return entityAdapter.getSummonRawData(summon.id)
		},
		enabled: currentTab === 'raw' && !!summon?.id
	}))

	// Helper function for summon grid image
	function getSummonGridImage(summon: any): string {
		return getSummonImage(summon?.granblueId, 'grid')
	}

	// Available image sizes for summons
	const summonSizes = ['detail', 'grid', 'main', 'square', 'wide']

	// Generate image items for summon (detail, grid, main, square, wide variants)
	// Summons have transformations: Base (no suffix), ULB (_02), Transcendence Stage 1 (_03), Transcendence Stage 5 (_04)
	const summonImages = $derived.by((): ImageItem[] => {
		if (!summon?.granblueId) return []

		const variants = ['detail', 'grid', 'main', 'square', 'wide'] as const
		const images: ImageItem[] = []

		// Only include transformations that are available
		const transformations: { id: string; label: string; suffix?: string }[] = [
			{ id: '01', label: 'Base', suffix: undefined }
		]

		if (summon.uncap?.ulb) {
			transformations.push({ id: '02', label: 'ULB', suffix: '02' })
		}

		if (summon.uncap?.transcendence) {
			transformations.push(
				{ id: '03', label: 'Transcendence (1)', suffix: '03' },
				{ id: '04', label: 'Transcendence (5)', suffix: '04' }
			)
		}

		for (const transformation of transformations) {
			for (const variant of variants) {
				images.push({
					url: getSummonImage(summon.granblueId, variant, transformation.suffix),
					label: `${variant} (${transformation.label})`,
					variant,
					pose: transformation.id,
					poseLabel: transformation.label
				})
			}
		}

		return images
	})

	// Image download handlers
	async function handleDownloadImage(size: string, transformation: string | undefined, force: boolean) {
		if (!summon?.id) return
		// For summons, '01' means base (no transformation suffix)
		const trans = transformation === '01' ? undefined : transformation
		await entityAdapter.downloadSummonImage(summon.id, size, trans, force)
	}

	async function handleDownloadAllPose(pose: string, force: boolean) {
		if (!summon?.id) return
		const trans = pose === '01' ? undefined : pose
		// Download all sizes for this pose
		for (const size of summonSizes) {
			await entityAdapter.downloadSummonImage(summon.id, size, trans, force)
		}
	}

	async function handleDownloadAllImages(force: boolean) {
		if (!summon?.id) return
		await entityAdapter.downloadSummonImages(summon.id, { force })
	}

	async function handleDownloadSize(size: string) {
		if (!summon?.id) return
		// Download this size for all available transformations
		const transformations: (string | undefined)[] = [undefined]
		if (summon.uncap?.ulb) {
			transformations.push('02')
		}
		if (summon.uncap?.transcendence) {
			transformations.push('03', '04')
		}

		for (const trans of transformations) {
			await entityAdapter.downloadSummonImage(summon.id, size, trans, false)
		}
	}

	// Page title
	const pageTitle = $derived(m.page_title_db_entity({ name: summon?.name?.en ?? 'Summon' }))
</script>

<PageMeta title={pageTitle} description={m.page_desc_home()} />

<div class="page">
	{#if summon}
		<DetailScaffold
			type="summon"
			item={summon}
			image={getSummonGridImage(summon)}
			showEdit={canEdit}
			editUrl={canEdit ? editUrl : undefined}
			{currentTab}
			onTabChange={handleTabChange}
			onDownloadAllImages={canEdit ? handleDownloadAllImages : undefined}
			onDownloadSize={canEdit ? handleDownloadSize : undefined}
			availableSizes={summonSizes}
		>
			{#if currentTab === 'info'}
				<section class="details">
					<SummonMetadataSection {summon} />
					<SummonGachaSection {summon} />
					<SummonUncapSection {summon} />
					<SummonTaxonomySection {summon} />
					<SummonStatsSection {summon} />

					<DetailsContainer title="Nicknames">
						<DetailItem label="English">
							{#if summon.nicknames?.en?.length}
								<div class="nickname-tags">
									{#each summon.nicknames.en as nickname}
										<span class="nickname-tag">{nickname}</span>
									{/each}
								</div>
							{:else}
								<span class="empty-value">—</span>
							{/if}
						</DetailItem>
						<DetailItem label="Japanese">
							{#if summon.nicknames?.ja?.length}
								<div class="nickname-tags">
									{#each summon.nicknames.ja as nickname}
										<span class="nickname-tag">{nickname}</span>
									{/each}
								</div>
							{:else}
								<span class="empty-value">—</span>
							{/if}
						</DetailItem>
					</DetailsContainer>

					<DetailsContainer title="Dates">
						<DetailItem label="Release Date" value={summon.releaseDate || '—'} />
						<DetailItem label="FLB Date" value={summon.flbDate || '—'} />
						<DetailItem label="ULB Date" value={summon.ulbDate || '—'} />
						<DetailItem label="Transcendence Date" value={summon.transcendenceDate || '—'} />
					</DetailsContainer>

					<DetailsContainer title="Links">
						<DetailItem label="Wiki (EN)">
							{@const url = buildWikiEnUrl(summon.wiki?.en)}
							{#if url}
								<a href={url} target="_blank" rel="noopener noreferrer" class="external-link">
									{url}
								</a>
							{:else}
								<span class="empty-value">—</span>
							{/if}
						</DetailItem>
						<DetailItem label="Wiki (JP)">
							{@const url = buildWikiJaUrl(summon.wiki?.ja)}
							{#if url}
								<a href={url} target="_blank" rel="noopener noreferrer" class="external-link">
									{url}
								</a>
							{:else}
								<span class="empty-value">—</span>
							{/if}
						</DetailItem>
						<DetailItem label="Gamewith">
							{@const url = buildGamewithUrl(summon.gamewith)}
							{#if url}
								<a href={url} target="_blank" rel="noopener noreferrer" class="external-link">
									{url}
								</a>
							{:else}
								<span class="empty-value">—</span>
							{/if}
						</DetailItem>
						<DetailItem label="Kamigame">
							{@const url = buildKamigameUrl(summon.kamigame, 'summon')}
							{#if url}
								<a href={url} target="_blank" rel="noopener noreferrer" class="external-link">
									{url}
								</a>
							{:else}
								<span class="empty-value">—</span>
							{/if}
						</DetailItem>
					</DetailsContainer>

					<div class="summon-abilities">
						<h3>Call Effect</h3>
						<div class="abilities-section">
							{#if summon.callName || summon.callDescription}
								<div class="ability-item">
									<h4 class="ability-name">{summon.callName || 'Call Effect'}</h4>
									<p class="ability-description">
										{summon.callDescription || 'No description available'}
									</p>
								</div>
							{:else}
								<p class="no-abilities">No call effect information available</p>
							{/if}
						</div>

						<h3>Aura Effect</h3>
						<div class="abilities-section">
							{#if summon.auraName || summon.auraDescription}
								<div class="ability-item">
									<h4 class="ability-name">{summon.auraName || 'Aura Effect'}</h4>
									<p class="ability-description">
										{summon.auraDescription || 'No description available'}
									</p>
								</div>
							{:else}
								<p class="no-abilities">No aura effect information available</p>
							{/if}
						</div>

						{#if summon.subAuraName || summon.subAuraDescription}
							<h3>Sub Aura Effect</h3>
							<div class="abilities-section">
								<div class="ability-item">
									<h4 class="ability-name">{summon.subAuraName || 'Sub Aura Effect'}</h4>
									<p class="ability-description">
										{summon.subAuraDescription || 'No description available'}
									</p>
								</div>
							</div>
						{/if}
					</div>
				</section>
			{:else if currentTab === 'images'}
				<EntityImagesTab
					images={summonImages}
					{canEdit}
					onDownloadImage={canEdit ? handleDownloadImage : undefined}
					onDownloadAllPose={canEdit ? handleDownloadAllPose : undefined}
				/>
			{:else if currentTab === 'raw'}
				<EntityRawDataTab
					wikiRaw={rawDataQuery.data?.wikiRaw}
					gameRawEn={rawDataQuery.data?.gameRawEn}
					gameRawJp={rawDataQuery.data?.gameRawJp}
					isLoading={rawDataQuery.isLoading}
					{canEdit}
					onFetchWiki={canEdit && summon?.id && summon?.wiki?.en
						? async () => {
								// Fetch wiki data client-side (bypasses CloudFlare)
								const wikiResult = await fetchWikiPage(summon.wiki!.en!)
								if (wikiResult.error) {
									throw new Error(wikiResult.error)
								}
								// Update the summon with the wiki_raw data
								await entityAdapter.updateSummon(summon.id, { wiki_raw: wikiResult.wikiRaw })
								rawDataQuery.refetch()
								return { wikiRaw: wikiResult.wikiRaw ?? null, gameRawEn: null, gameRawJp: null }
							}
						: undefined}
				/>
			{/if}
		</DetailScaffold>
	{:else}
		<div class="not-found">
			<h2>Summon Not Found</h2>
			<p>The summon you're looking for could not be found.</p>
			<button onclick={() => goto('/database/summons')}>Back to Summons</button>
		</div>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.page {
		background: white;
		border-radius: layout.$card-corner;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.not-found {
		text-align: center;
		padding: spacing.$unit * 4;

		button {
			background: #007bff;
			color: white;
			border: none;
			padding: spacing.$unit-half spacing.$unit;
			border-radius: 4px;
			cursor: pointer;
			margin-top: spacing.$unit;

			&:hover {
				background: #0056b3;
			}
		}
	}

	.details {
		display: flex;
		flex-direction: column;
	}

	.summon-abilities {
		padding: spacing.$unit-2x;
		border-bottom: 1px solid #e5e5e5;

		&:last-child {
			border-bottom: none;
		}

		h3 {
			font-size: typography.$font-large;
			font-weight: typography.$bold;
			margin: 0 0 spacing.$unit 0;
		}

		.abilities-section {
			margin-bottom: spacing.$unit * 2;

			&:last-child {
				margin-bottom: 0;
			}

			.ability-item {
				padding: spacing.$unit;
				background: #f8f9fa;
				border-radius: 4px;

				.ability-name {
					font-size: typography.$font-medium;
					font-weight: typography.$medium;
					margin: 0 0 spacing.$unit * 0.5 0;
					color: #333;
				}

				.ability-description {
					font-size: typography.$font-small;
					color: #666;
					margin: 0;
					line-height: 1.4;
				}
			}

			.no-abilities {
				text-align: center;
				color: #666;
				font-style: italic;
				padding: spacing.$unit;
			}
		}
	}

	.nickname-tags {
		display: flex;
		flex-wrap: wrap;
		gap: spacing.$unit;
	}

	.nickname-tag {
		background: colors.$grey-90;
		padding: spacing.$unit-half spacing.$unit;
		border-radius: layout.$item-corner-small;
		font-size: typography.$font-small;
	}

	.external-link {
		color: colors.$blue;
		text-decoration: none;
		word-break: break-all;

		&:hover {
			text-decoration: underline;
		}
	}
</style>
