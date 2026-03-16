
<script lang="ts">
	// SvelteKit imports
	import { goto } from '$app/navigation'

	// Page metadata
	import PageMeta from '$lib/components/PageMeta.svelte'
	import * as m from '$lib/paraglide/messages'

	// TanStack Query
	import { createQuery, useQueryClient } from '@tanstack/svelte-query'
	import { jobQueries, jobAccessoryKeys } from '$lib/api/queries/job.queries'
	import { jobAdapter } from '$lib/api/adapters/job.adapter'
	import { withInitialData } from '$lib/query/ssr'

	// Components
	import SidebarHeader from '$lib/components/ui/SidebarHeader.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'

	// Utils
	import { localizedName } from '$lib/utils/locale'
	import { getAccessoryTypeOptions } from '$lib/utils/jobAccessoryUtils'
	import { getRarityOptions } from '$lib/utils/rarity'

	// Types
	import type { PageData } from './$types'

	let { data }: { data: PageData } = $props()

	const queryClient = useQueryClient()

	// Use TanStack Query with SSR initial data
	const accessoryQuery = createQuery(() => ({
		...jobQueries.accessoryById(data.accessory?.granblueId ?? ''),
		...withInitialData(data.accessory)
	}))

	// Get accessory from query
	const accessory = $derived(accessoryQuery.data)

	// Save state
	let isSaving = $state(false)
	let saveError = $state<string | null>(null)
	let saveSuccess = $state(false)

	const accessoryTypeOptions = getAccessoryTypeOptions()
	const rarityOptions = getRarityOptions()

	// Editable fields - initialized from accessory data
	let editData = $state({
		nameEn: '',
		nameJp: '',
		granblueId: '',
		accessoryType: 1,
		rarity: 0,
		releaseDate: ''
	})

	// Populate edit data when accessory loads
	$effect(() => {
		if (accessory) {
			editData = {
				nameEn: accessory.name?.en || '',
				nameJp: accessory.name?.ja || '',
				granblueId: accessory.granblueId || '',
				accessoryType: accessory.accessoryType || 1,
				rarity: accessory.rarity || 0,
				releaseDate: accessory.releaseDate || ''
			}
		}
	})

	async function saveChanges() {
		if (!accessory?.granblueId) return

		isSaving = true
		saveError = null
		saveSuccess = false

		try {
			const payload = {
				name_en: editData.nameEn,
				name_jp: editData.nameJp,
				granblue_id: editData.granblueId,
				accessory_type: editData.accessoryType,
				rarity: editData.rarity,
				release_date: editData.releaseDate || undefined
			}

			await jobAdapter.updateAccessory(accessory.granblueId, payload)

			// Invalidate TanStack Query cache to refetch fresh data
			await queryClient.invalidateQueries({ queryKey: jobAccessoryKeys.all })

			saveSuccess = true

			// Navigate back to detail page after a short delay
			setTimeout(() => {
				goto(`/database/job-accessories/${editData.granblueId}`)
			}, 500)
		} catch (error) {
			saveError = 'Failed to save changes. Please try again.'
			console.error('Save error:', error)
		} finally {
			isSaving = false
		}
	}

	function handleCancel() {
		goto(`/database/job-accessories/${accessory?.granblueId}`)
	}

	// Page title
	const pageTitle = $derived(
		m.page_title_db_edit({ name: accessory?.name?.en ?? 'Job Accessory' })
	)
</script>

<PageMeta title={pageTitle} description={m.page_desc_home()} />

<div class="page">
	{#if accessory}
		<SidebarHeader title="Edit: {localizedName(accessory.name)}">
			{#snippet leftAccessory()}
				<Button variant="secondary" size="small" onclick={handleCancel} disabled={isSaving}>
					Cancel
				</Button>
			{/snippet}
			{#snippet rightAccessory()}
				<Button variant="primary" size="small" onclick={saveChanges} disabled={isSaving}>
					{isSaving ? 'Saving...' : 'Save'}
				</Button>
			{/snippet}
		</SidebarHeader>

		{#if saveError}
			<div class="error-banner">{saveError}</div>
		{/if}

		{#if saveSuccess}
			<div class="success-banner">Changes saved successfully!</div>
		{/if}

		<section class="details">
			<DetailsContainer title="Basic Info">
				<DetailItem
					label="Name (EN)"
					bind:value={editData.nameEn}
					editable={true}
					type="text"
					placeholder="English name"
				/>
				<DetailItem
					label="Name (JP)"
					bind:value={editData.nameJp}
					editable={true}
					type="text"
					placeholder="日本語名"
				/>
				<DetailItem
					label="Granblue ID"
					bind:value={editData.granblueId}
					editable={true}
					type="text"
					placeholder="Granblue ID"
				/>
			</DetailsContainer>

			<DetailsContainer title="Classification">
				<DetailItem
					label="Accessory Type"
					bind:value={editData.accessoryType}
					editable={true}
					type="select"
					options={accessoryTypeOptions}
				/>
				<DetailItem
					label="Rarity"
					bind:value={editData.rarity}
					editable={true}
					type="select"
					options={rarityOptions}
				/>
				<DetailItem
					label="Release Date"
					bind:value={editData.releaseDate}
					editable={true}
					type="text"
					placeholder="YYYY-MM-DD"
				/>
			</DetailsContainer>
		</section>
	{:else if accessoryQuery.isLoading}
		<div class="loading">Loading accessory...</div>
	{:else}
		<div class="error">Failed to load accessory</div>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.page {
		background: var(--card-bg);
		border-radius: layout.$card-corner;
		box-shadow: var(--shadow-sm);
	}

	.details {
		display: flex;
		flex-direction: column;
	}

	.error-banner {
		color: var(--danger);
		font-size: typography.$font-small;
		padding: spacing.$unit-2x;
		background: var(--danger-bg);
	}

	.success-banner {
		color: var(--success);
		font-size: typography.$font-small;
		padding: spacing.$unit-2x;
		background: var(--success-bg);
	}

	.loading,
	.error {
		text-align: center;
		padding: spacing.$unit * 4;
		color: var(--text-secondary);
	}

	.error {
		color: var(--red);
	}
</style>
