
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
	import { getAugmentTypeOptions } from '$lib/utils/augmentType'
	import { localizedName } from '$lib/utils/locale'
	import type { AugmentType } from '$lib/types/api/weaponStatModifier'
	import type { PageData } from './$types'

	let { data }: { data: PageData } = $props()

	const queryClient = useQueryClient()

	const seriesQuery = createQuery(() => ({
		...entityQueries.weaponSeries(data.series?.slug ?? ''),
		...withInitialData(data.series)
	}))

	const series = $derived(seriesQuery.data)
	const pageTitle = $derived(series?.name ? `Edit ${localizedName(series.name)}` : 'Edit Weapon Series')

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
		augmentType: 'no_augment' as AugmentType
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
				augmentType: series.augmentType || 'no_augment'
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
				augment_type: editData.augmentType
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
	<DatabasePageHeader title="Edit Weapon Series" backHref={`/database/series/weapons/${series?.slug}`}>
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
		</div>
	{:else}
		<div class="not-found">
			<h2>Series Not Found</h2>
			<p>The weapon series you're looking for could not be found.</p>
			<button onclick={() => goto('/database/weapons?view=series')}>Back to Series</button>
		</div>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.page {
		background: var(--card-bg);
		border-radius: layout.$page-corner;
		box-shadow: var(--shadow-sm);
	}

	.content {
		display: flex;
		flex-direction: column;
	}

	.error-banner {
		background: #fef2f2;
		border: 1px solid #fecaca;
		color: #dc2626;
		padding: spacing.$unit-2x;
		margin: spacing.$unit-2x;
		border-radius: layout.$item-corner;
	}

	.not-found {
		text-align: center;
		padding: spacing.$unit * 4;

		button {
			background: #007bff;
			color: white;
			border: none;
			padding: spacing.$unit-half spacing.$unit;
			border-radius: layout.$item-corner-small;
			cursor: pointer;
			margin-top: spacing.$unit;

			&:hover {
				background: #0056b3;
			}
		}
	}
</style>
