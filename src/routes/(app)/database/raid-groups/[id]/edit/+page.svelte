<svelte:options runes={true} />

<script lang="ts">
	import { goto } from '$app/navigation'
	import { page } from '$app/stores'
	import { createQuery, useQueryClient } from '@tanstack/svelte-query'
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

	// Get group ID from URL
	const groupId = $derived($page.params.id)

	// Query for group data
	const groupQuery = createQuery(() => ({
		queryKey: ['raid-groups', groupId],
		queryFn: () => raidAdapter.getGroupById(groupId ?? ''),
		enabled: !!groupId
	}))

	const group = $derived(groupQuery.data)

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

	// Sync edit data when group changes
	$effect(() => {
		if (group) {
			editData = {
				name_en: group.name.en || '',
				name_jp: group.name.ja || '',
				section: typeof group.section === 'string' ? parseInt(group.section) : group.section,
				order: group.order ?? 0,
				difficulty: group.difficulty ?? 1,
				hl: group.hl ?? false,
				extra: group.extra ?? false,
				guidebooks: group.guidebooks ?? false,
				unlimited: group.unlimited ?? false
			}
		}
	})

	// Validation
	const canSave = $derived(
		editData.name_en.trim() !== '' && editData.name_jp.trim() !== ''
	)

	// Save changes
	async function handleSave() {
		if (!canSave || !group || !groupId) return

		isSaving = true
		saveError = null

		try {
			await raidAdapter.updateGroup(groupId, {
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

			// Navigate back to detail page
			goto(`/database/raid-groups/${groupId}`)
		} catch (error: any) {
			saveError = error.message || 'Failed to save raid group'
		} finally {
			isSaving = false
		}
	}

	// Cancel and go back
	function handleCancel() {
		goto(`/database/raid-groups/${groupId}`)
	}
</script>

<div class="page">
	{#if groupQuery.isLoading}
		<div class="loading-state">
			<p>Loading raid group...</p>
		</div>
	{:else if group}
		<SidebarHeader title="Edit Raid Group">
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
	{:else}
		<div class="not-found">
			<h2>Raid Group Not Found</h2>
			<p>The raid group you're looking for could not be found.</p>
			<Button variant="secondary" onclick={() => goto('/database/raids?view=groups')}>
				Back to Groups
			</Button>
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

	.loading-state {
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

	.error-banner {
		color: var(--danger);
		font-size: typography.$font-small;
		padding: spacing.$unit-2x;
		background: var(--danger-bg);
	}

	.details {
		display: flex;
		flex-direction: column;
	}
</style>
