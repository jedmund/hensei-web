<svelte:options runes={true} />

<script lang="ts">
	// SvelteKit imports
	import { goto } from '$app/navigation'
	import { page } from '$app/stores'

	// TanStack Query
	import { createQuery } from '@tanstack/svelte-query'
	import { entityQueries } from '$lib/api/queries/entity.queries'
	import { entityAdapter } from '$lib/api/adapters/entity.adapter'
	import { withInitialData } from '$lib/query/ssr'

	// Components
	import DetailScaffold, { type DetailTab } from '$lib/features/database/detail/DetailScaffold.svelte'
	import SummonMetadataSection from '$lib/features/database/summons/sections/SummonMetadataSection.svelte'
	import SummonUncapSection from '$lib/features/database/summons/sections/SummonUncapSection.svelte'
	import SummonTaxonomySection from '$lib/features/database/summons/sections/SummonTaxonomySection.svelte'
	import SummonStatsSection from '$lib/features/database/summons/sections/SummonStatsSection.svelte'
	import EntityImagesTab from '$lib/features/database/detail/tabs/EntityImagesTab.svelte'
	import EntityRawDataTab from '$lib/features/database/detail/tabs/EntityRawDataTab.svelte'
	import { getSummonImage } from '$lib/utils/images'

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
		...entityQueries.summon(data.summon?.id ?? ''),
		...withInitialData(data.summon)
	}))

	// Get summon from query
	const summon = $derived(summonQuery.data)
	const userRole = $derived(data.role || 0)
	const canEdit = $derived(userRole >= 7)

	// Edit URL for navigation
	const editUrl = $derived(summon?.id ? `/database/summons/${summon.id}/edit` : undefined)

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

	// Generate image items for summon (detail, grid, main, square, wide variants)
	const summonImages = $derived.by((): ImageItem[] => {
		if (!summon?.granblueId) return []

		const variants = ['detail', 'grid', 'main', 'square', 'wide'] as const
		const images: ImageItem[] = []

		for (const variant of variants) {
			images.push({
				url: getSummonImage(summon.granblueId, variant),
				label: variant,
				variant
			})
		}

		return images
	})
</script>

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
		>
			{#if currentTab === 'info'}
				<section class="details">
					<SummonMetadataSection {summon} />
					<SummonUncapSection {summon} />
					<SummonTaxonomySection {summon} />
					<SummonStatsSection {summon} />

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
				<EntityImagesTab images={summonImages} />
			{:else if currentTab === 'raw'}
				<EntityRawDataTab
					wikiRaw={rawDataQuery.data?.wikiRaw}
					gameRawEn={rawDataQuery.data?.gameRawEn}
					gameRawJp={rawDataQuery.data?.gameRawJp}
					isLoading={rawDataQuery.isLoading}
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
</style>
