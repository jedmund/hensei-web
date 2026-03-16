
<script lang="ts">
	import { goto } from '$app/navigation'
	import { useQueryClient } from '@tanstack/svelte-query'
	import { entityAdapter } from '$lib/api/adapters/entity.adapter'
	import PageMeta from '$lib/components/PageMeta.svelte'
	import * as m from '$lib/paraglide/messages'
	import DatabasePageHeader from '$lib/components/database/DatabasePageHeader.svelte'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import { getAugmentTypeOptions } from '$lib/utils/augmentType'
	import type { AugmentType } from '$lib/types/api/weaponStatModifier'

	const queryClient = useQueryClient()

	// Save state
	let isSaving = $state(false)
	let saveError = $state<string | null>(null)

	// Form fields
	let formData = $state({
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

	// Augment type options for dropdown
	const augmentTypeOptions = getAugmentTypeOptions().map((opt) => ({
		value: opt.value,
		label: opt.label
	}))

	async function createSeries() {
		if (!formData.nameEn || !formData.slug) {
			saveError = 'Name (EN) and Slug are required.'
			return
		}

		isSaving = true
		saveError = null

		try {
			const payload = {
				name_en: formData.nameEn,
				name_jp: formData.nameJa,
				slug: formData.slug,
				order: formData.order,
				extra: formData.extra,
				element_changeable: formData.elementChangeable,
				has_weapon_keys: formData.hasWeaponKeys,
				has_awakening: formData.hasAwakening,
				augment_type: formData.augmentType,
				num_weapon_keys: formData.numWeaponKeys
			}

			await entityAdapter.createWeaponSeries(payload)

			// Invalidate cache
			await queryClient.invalidateQueries({
				queryKey: ['weaponSeries'],
				refetchType: 'all'
			})

			// Navigate to the new series detail page
			goto(`/database/series/weapons/${formData.slug}`)
		} catch (error) {
			saveError = 'Failed to create weapon series. Please try again.'
			console.error('Create error:', error)
		} finally {
			isSaving = false
		}
	}
</script>

<PageMeta title="New Weapon Series" description={m.page_desc_home()} />

<div class="page">
	<DatabasePageHeader title="New Weapon Series" backHref="/database/weapons?view=series">
		{#snippet rightAction()}
			<Button variant="ghost" size="small" onclick={createSeries} disabled={isSaving}>
				{isSaving ? 'Creating...' : 'Create'}
			</Button>
		{/snippet}
	</DatabasePageHeader>

	<div class="content">
		{#if saveError}
			<div class="error-banner">{saveError}</div>
		{/if}

		<DetailsContainer title="Basic Info">
			<DetailItem
				label="Name (EN)"
				bind:value={formData.nameEn}
				editable={true}
				type="text"
				placeholder="English name"
				width="320px"
			/>
			<DetailItem
				label="Name (JA)"
				bind:value={formData.nameJa}
				editable={true}
				type="text"
				placeholder="Japanese name"
				width="320px"
			/>
			<DetailItem
				label="Slug"
				bind:value={formData.slug}
				editable={true}
				type="text"
				placeholder="url-friendly-slug"
				width="240px"
			/>
			<DetailItem
				label="Order"
				bind:value={formData.order}
				editable={true}
				type="number"
				placeholder="0"
			/>
		</DetailsContainer>

		<DetailsContainer title="Flags">
			<DetailItem
				label="Extra Grid"
				sublabel="Weapon can be placed in Extra grid slots"
				bind:value={formData.extra}
				editable={true}
				type="checkbox"
			/>
			<DetailItem
				label="Element Changeable"
				sublabel="Weapon element can be changed by player"
				bind:value={formData.elementChangeable}
				editable={true}
				type="checkbox"
			/>
			<DetailItem
				label="Has Weapon Keys"
				sublabel="Weapon supports Pendulum/Teluma keys"
				bind:value={formData.hasWeaponKeys}
				editable={true}
				type="checkbox"
			/>
			{#if formData.hasWeaponKeys}
				<DetailItem
					label="Weapon Key Slots"
					sublabel="Number of key slots (e.g. 2 for Opus, 3 for Ultima)"
					bind:value={formData.numWeaponKeys}
					editable={true}
					type="number"
					placeholder="0"
				/>
			{/if}
			<DetailItem
				label="Has Awakening"
				sublabel="Weapon can be awakened"
				bind:value={formData.hasAwakening}
				editable={true}
				type="checkbox"
			/>
			<DetailItem
				label="Augment Type"
				sublabel="Type of stat augments this series supports"
				bind:value={formData.augmentType}
				editable={true}
				type="select"
				options={augmentTypeOptions}
			/>
		</DetailsContainer>
	</div>
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
</style>
