
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
	import VariantModal from '$lib/features/database/weapons/VariantModal.svelte'
	import { getAugmentTypeLabel } from '$lib/utils/augmentType'
	import { localizedName } from '$lib/utils/locale'
	import type { WeaponSeriesVariant } from '$lib/types/api/weaponSeriesVariant'
	import type { PageData } from './$types'

	let { data }: { data: PageData } = $props()

	const seriesQuery = createQuery(() => ({
		...entityQueries.weaponSeries(data.series?.slug ?? ''),
		...withInitialData(data.series)
	}))

	const series = $derived(seriesQuery.data)
	const userRole = $derived(data.role || 0)
	const canEdit = $derived(userRole >= 7)
	const editUrl = $derived(series?.slug ? `/database/series/weapons/${series.slug}/edit` : undefined)
	const variants = $derived(series?.variants ?? [])
	const showVariantsSection = $derived(variants.length > 0 || canEdit)

	const pageTitle = $derived(series?.name ? `${localizedName(series.name)} Series` : 'Weapon Series')

	// Variant modal state
	let variantModalOpen = $state(false)
	let editingVariant = $state<WeaponSeriesVariant | null>(null)

	function openCreateVariant() {
		editingVariant = null
		variantModalOpen = true
	}

	function openEditVariant(variant: WeaponSeriesVariant) {
		editingVariant = variant
		variantModalOpen = true
	}

	function formatOverrides(variant: WeaponSeriesVariant): string {
		const parts: string[] = []
		if (variant.hasWeaponKeys !== null) parts.push(`Keys: ${variant.hasWeaponKeys ? 'Yes' : 'No'}`)
		if (variant.hasAwakening !== null) parts.push(`Awakening: ${variant.hasAwakening ? 'Yes' : 'No'}`)
		if (variant.numWeaponKeys !== null) parts.push(`Key Slots: ${variant.numWeaponKeys}`)
		if (variant.augmentType !== null) parts.push(`Augment: ${getAugmentTypeLabel(variant.augmentType)}`)
		if (variant.elementChangeable !== null) parts.push(`Element Change: ${variant.elementChangeable ? 'Yes' : 'No'}`)
		if (variant.extra !== null) parts.push(`Extra: ${variant.extra ? 'Yes' : 'No'}`)
		return parts.join(', ') || 'No overrides'
	}
</script>

<PageMeta title={pageTitle} description={m.page_desc_home()} />

<div class="page">
	<DatabasePageHeader title="Weapon Series">
		{#snippet leftAction()}
			<Button variant="ghost" size="small" leftIcon="chevron-left" href="/database/weapons?view=series">Back</Button>
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

			<DetailsContainer title="Flags">
				<DetailItem label="Extra Grid" value={series.extra ? 'Yes' : 'No'} />
				<DetailItem label="Element Changeable" value={series.elementChangeable ? 'Yes' : 'No'} />
				<DetailItem label="Has Weapon Keys" value={series.hasWeaponKeys ? 'Yes' : 'No'} />
				<DetailItem label="Has Awakening" value={series.hasAwakening ? 'Yes' : 'No'} />
				<DetailItem label="Augment Type" value={getAugmentTypeLabel(series.augmentType)} />
			</DetailsContainer>

			{#if showVariantsSection}
				<DetailsContainer title="Variants">
					{#if variants.length > 0}
						{#each variants as variant (variant.id)}
							<DetailItem label={`Variant ${variant.id.slice(0, 8)}`}>
								{#if canEdit}
									<button class="variant-row" onclick={() => openEditVariant(variant)}>
										{formatOverrides(variant)}
									</button>
								{:else}
									<span>{formatOverrides(variant)}</span>
								{/if}
							</DetailItem>
						{/each}
					{:else}
						<DetailItem label="No variants" value="This series has no variant overrides" />
					{/if}
					{#if canEdit}
						<div class="variant-actions">
							<Button variant="ghost" size="small" leftIcon="plus" onclick={openCreateVariant}>Add Variant</Button>
						</div>
					{/if}
				</DetailsContainer>
			{/if}

			{#if series.weaponCount !== undefined}
				<DetailsContainer title="Statistics">
					<DetailItem label="Weapon Count" value={series.weaponCount} />
				</DetailsContainer>
			{/if}
		</div>
	{:else}
		<NotFoundPlaceholder
			title="Series Not Found"
			message="The weapon series you're looking for could not be found."
			backHref="/database/weapons?view=series"
			backLabel="Back to Series"
		/>
	{/if}
</div>

{#if series && canEdit}
	<VariantModal
		bind:open={variantModalOpen}
		seriesId={series.id}
		variant={editingVariant}
	/>
{/if}

<style lang="scss">
	@use '$src/themes/database' as database;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;

	.page {
		background: var(--card-bg);
		border-radius: layout.$page-corner;
		box-shadow: var(--shadow-sm);
	}

	.content {
		@include database.details;
	}

	.variant-row {
		background: none;
		border: none;
		color: var(--text-link);
		cursor: pointer;
		padding: 0;
		font-size: inherit;
		text-align: left;

		&:hover {
			text-decoration: underline;
		}
	}

	.variant-actions {
		padding-top: spacing.$unit;
	}
</style>
