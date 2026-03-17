
<script lang="ts">
	import { goto } from '$app/navigation'
	import { createQuery, useQueryClient } from '@tanstack/svelte-query'
	import { entityQueries } from '$lib/api/queries/entity.queries'
	import { entityAdapter } from '$lib/api/adapters/entity.adapter'
	import { withInitialData } from '$lib/query/ssr'
	import PageMeta from '$lib/components/PageMeta.svelte'
	import * as m from '$lib/paraglide/messages'
	import DatabasePageHeader from '$lib/components/database/DatabasePageHeader.svelte'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import NotFoundPlaceholder from '$lib/components/database/NotFoundPlaceholder.svelte'
	import VariantModal from '$lib/features/database/weapons/VariantModal.svelte'
	import VariantRow from '$lib/features/database/weapons/VariantRow.svelte'
	import { getAugmentTypeOptions } from '$lib/utils/augmentType'
	import { localizedName } from '$lib/utils/locale'
	import type { AugmentType } from '$lib/types/api/weaponStatModifier'
	import type { WeaponSeriesVariant } from '$lib/types/api/weaponSeriesVariant'
	import type { PageData } from './$types'

	let { data }: { data: PageData } = $props()

	const queryClient = useQueryClient()

	const seriesQuery = createQuery(() => ({
		...entityQueries.weaponSeries(data.series?.slug ?? ''),
		...withInitialData(data.series)
	}))

	const series = $derived(seriesQuery.data)
	const variants = $derived(series?.variants ?? [])
	const pageTitle = $derived(series?.name ? `Edit ${localizedName(series.name)}` : 'Edit Weapon Series')

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

	// Save state
	let isSaving = $state(false)
	let saveError = $state<string | null>(null)

	// Editable fields
	let editData = $state({
		nameEn: '',
		nameJa: '',
		slug: '',
		order: 0,
		extra: false,
		elementChangeable: false,
		hasWeaponKeys: false,
		hasAwakening: false,
		augmentType: 'no_augment' as AugmentType,
		numWeaponKeys: null as number | null
	})

	// Populate edit data when series loads
	$effect(() => {
		if (series) {
			editData = {
				nameEn: series.name.en || '',
				nameJa: series.name.ja || '',
				slug: series.slug || '',
				order: series.order || 0,
				extra: series.extra || false,
				elementChangeable: series.elementChangeable || false,
				hasWeaponKeys: series.hasWeaponKeys || false,
				hasAwakening: series.hasAwakening || false,
				augmentType: series.augmentType || 'no_augment',
				numWeaponKeys: series.numWeaponKeys ?? null
			}
		}
	})

	// Augment type options for dropdown
	const augmentTypeOptions = getAugmentTypeOptions().map((opt) => ({
		value: opt.value,
		label: opt.label
	}))

	async function saveChanges() {
		if (!series?.id) return

		isSaving = true
		saveError = null

		try {
			const payload = {
				name_en: editData.nameEn,
				name_jp: editData.nameJa,
				slug: editData.slug,
				order: editData.order,
				extra: editData.extra,
				element_changeable: editData.elementChangeable,
				has_weapon_keys: editData.hasWeaponKeys,
				has_awakening: editData.hasAwakening,
				augment_type: editData.augmentType,
				num_weapon_keys: editData.numWeaponKeys
			}

			await entityAdapter.updateWeaponSeries(series.id, payload)

			// Invalidate cache
			await queryClient.invalidateQueries({
				queryKey: ['weaponSeries'],
				refetchType: 'all'
			})

			// Navigate back to detail page (use new slug if changed)
			goto(`/database/series/weapons/${editData.slug}`)
		} catch (error) {
			saveError = 'Failed to save changes. Please try again.'
			console.error('Save error:', error)
		} finally {
			isSaving = false
		}
	}
</script>

<PageMeta title={pageTitle} description={m.page_desc_home()} />

<div class="page">
	<DatabasePageHeader title="Edit Weapon Series">
		{#snippet leftAction()}
			<Button variant="ghost" size="small" leftIcon="chevron-left" href={`/database/series/weapons/${series?.slug}`}>Back</Button>
		{/snippet}
		{#snippet rightAction()}
			<Button variant="ghost" size="small" onclick={saveChanges} disabled={isSaving}>
				{isSaving ? 'Saving...' : 'Save'}
			</Button>
		{/snippet}
	</DatabasePageHeader>

	{#if series}
		<div class="content">
			{#if saveError}
				<div class="error-banner">{saveError}</div>
			{/if}

			<DetailsContainer title="Basic Info">
				<DetailItem
					label="Name (EN)"
					bind:value={editData.nameEn}
					editable={true}
					type="text"
					placeholder="English name"
					width="320px"
				/>
				<DetailItem
					label="Name (JA)"
					bind:value={editData.nameJa}
					editable={true}
					type="text"
					placeholder="Japanese name"
					width="320px"
				/>
				<DetailItem
					label="Slug"
					bind:value={editData.slug}
					editable={true}
					type="text"
					placeholder="url-friendly-slug"
					width="240px"
				/>
				<DetailItem
					label="Order"
					bind:value={editData.order}
					editable={true}
					type="number"
					placeholder="0"
				/>
			</DetailsContainer>

			<DetailsContainer title="Flags">
				<DetailItem
					label="Extra Grid"
					sublabel="Weapon can be placed in Extra grid slots"
					bind:value={editData.extra}
					editable={true}
					type="checkbox"
				/>
				<DetailItem
					label="Element Changeable"
					sublabel="Weapon element can be changed by player"
					bind:value={editData.elementChangeable}
					editable={true}
					type="checkbox"
				/>
				<DetailItem
					label="Has Weapon Keys"
					sublabel="Weapon supports Pendulum/Teluma keys"
					bind:value={editData.hasWeaponKeys}
					editable={true}
					type="checkbox"
				/>
				{#if editData.hasWeaponKeys}
					<DetailItem
						label="Weapon Key Slots"
						sublabel="Number of key slots (e.g. 2 for Opus, 3 for Ultima)"
						bind:value={editData.numWeaponKeys}
						editable={true}
						type="number"
						placeholder="0"
					/>
				{/if}
				<DetailItem
					label="Has Awakening"
					sublabel="Weapon can be awakened"
					bind:value={editData.hasAwakening}
					editable={true}
					type="checkbox"
				/>
				<DetailItem
					label="Augment Type"
					sublabel="Type of stat augments this series supports"
					bind:value={editData.augmentType}
					editable={true}
					type="select"
					options={augmentTypeOptions}
				/>
			</DetailsContainer>

			<div class="variants-section">
				<div class="variants-header">
					<h4>Variants</h4>
					<Button variant="ghost" size="small" leftIcon="plus" onclick={openCreateVariant}>Add Variant</Button>
				</div>
				<div class="details">
					{#if variants.length > 0}
						{#each variants as variant (variant.id)}
							<VariantRow {variant} onclick={() => openEditVariant(variant)} />
						{/each}
					{:else}
						<p class="no-variants">No variants</p>
					{/if}
				</div>
			</div>
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

{#if series}
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
	@use '$src/themes/typography' as typography;

	.page {
		background: var(--card-bg);
		border-radius: layout.$page-corner;
		box-shadow: var(--shadow-sm);
	}

	.content {
		@include database.details;
	}

	.error-banner {
		@include database.error-banner;
	}

	.variants-section {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
		padding: spacing.$unit-2x;
		border-bottom: 1px solid var(--border-subtle);

		&:last-child {
			border-bottom: none;
		}
	}

	.variants-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: spacing.$unit;

		h4 {
			color: var(--text-primary);
			font-size: typography.$font-medium;
			font-weight: typography.$bold;
			margin: 0;
		}
	}

	.details {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
	}

	.no-variants {
		color: var(--text-secondary);
		text-align: center;
		margin: 0;
		padding-bottom: spacing.$unit-2x;
	}

</style>
