<svelte:options runes={true} />

<script lang="ts">
	import { goto } from '$app/navigation'
	import { useQueryClient } from '@tanstack/svelte-query'
	import { raidAdapter } from '$lib/api/adapters/raid.adapter'
	import Button from '$lib/components/ui/Button.svelte'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import SidebarHeader from '$lib/components/ui/SidebarHeader.svelte'
	import type { PageData } from './$types'

	interface Props {
		data: PageData
	}

	let { data }: Props = $props()

	const queryClient = useQueryClient()

	// Save state
	let isSaving = $state(false)
	let saveError = $state<string | null>(null)

	// Edit data state
	let editData = $state({
		name_en: '',
		name_jp: '',
		section: 1,
		order: 0,
		difficulty: 1,
		hl: false,
		extra: false,
		guidebooks: false,
		unlimited: false
	})

	// Validation
	const canSave = $derived(
		editData.name_en.trim() !== '' && editData.name_jp.trim() !== ''
	)

	// Create group
	async function handleSave() {
		if (!canSave) return

		isSaving = true
		saveError = null

		try {
			const newGroup = await raidAdapter.createGroup({
				name_en: editData.name_en,
				name_jp: editData.name_jp,
				section: editData.section,
				order: editData.order,
				difficulty: editData.difficulty,
				hl: editData.hl,
				extra: editData.extra,
				guidebooks: editData.guidebooks,
				unlimited: editData.unlimited
			})

			// Invalidate queries
			await queryClient.invalidateQueries({ queryKey: ['raid-groups'] })

			// Navigate to the new group's detail page
			goto(`/database/raid-groups/${newGroup.id}`)
		} catch (error: any) {
			saveError = error.message || 'Failed to create raid group'
		} finally {
			isSaving = false
		}
	}

	// Cancel and go back
	function handleCancel() {
		goto('/database/raid-groups')
	}
</script>

<div class="page">
	<SidebarHeader title="New Raid Group">
		{#snippet leftAccessory()}
			<Button variant="secondary" size="small" onclick={handleCancel}>Cancel</Button>
		{/snippet}
		{#snippet rightAccessory()}
			<Button variant="primary" size="small" onclick={handleSave} disabled={!canSave || isSaving}>
				{isSaving ? 'Saving...' : 'Save'}
			</Button>
		{/snippet}
	</SidebarHeader>

	{#if saveError}
		<div class="error-banner">{saveError}</div>
	{/if}

	<section class="details">
		<DetailsContainer title="Group Details">
			<DetailItem
				label="Name (EN)"
				bind:value={editData.name_en}
				editable={true}
				type="text"
				placeholder="English name"
			/>
			<DetailItem
				label="Name (JA)"
				bind:value={editData.name_jp}
				editable={true}
				type="text"
				placeholder="Japanese name"
			/>
			<DetailItem
				label="Section"
				bind:value={editData.section}
				editable={true}
				type="number"
			/>
			<DetailItem
				label="Order"
				bind:value={editData.order}
				editable={true}
				type="number"
			/>
			<DetailItem
				label="Difficulty"
				bind:value={editData.difficulty}
				editable={true}
				type="number"
			/>
		</DetailsContainer>

		<DetailsContainer title="Flags">
			<DetailItem
				label="HL"
				bind:value={editData.hl}
				editable={true}
				type="checkbox"
			/>
			<DetailItem
				label="Extra"
				bind:value={editData.extra}
				editable={true}
				type="checkbox"
			/>
			<DetailItem
				label="Guidebooks"
				bind:value={editData.guidebooks}
				editable={true}
				type="checkbox"
			/>
			<DetailItem
				label="Unlimited"
				bind:value={editData.unlimited}
				editable={true}
				type="checkbox"
			/>
		</DetailsContainer>
	</section>
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

	.error-banner {
		color: colors.$error;
		font-size: typography.$font-small;
		padding: spacing.$unit-2x;
		background: colors.$error--bg--light;
	}

	.details {
		display: flex;
		flex-direction: column;
	}
</style>
