
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
	import Button from '$lib/components/ui/Button.svelte'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'

	// Utils
	import { localizedName } from '$lib/utils/locale'
	import { ACCESSORY_TYPES } from '$lib/utils/jobAccessoryUtils'

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

	// Editable fields - initialized from accessory data
	let editData = $state({
		name_en: '',
		name_jp: '',
		granblue_id: '',
		accessory_type: ACCESSORY_TYPES.SHIELD,
		rarity: 0,
		release_date: ''
	})

	// Populate edit data when accessory loads
	$effect(() => {
		if (accessory) {
			editData = {
				name_en: accessory.name?.en || '',
				name_jp: accessory.name?.ja || '',
				granblue_id: accessory.granblueId || '',
				accessory_type: accessory.accessoryType || ACCESSORY_TYPES.SHIELD,
				rarity: accessory.rarity || 0,
				release_date: accessory.releaseDate || ''
			}
		}
	})

	async function saveChanges() {
		if (!accessory?.granblueId) return

		isSaving = true
		saveError = null
		saveSuccess = false

		try {
			await jobAdapter.updateAccessory(accessory.granblueId, editData)

			// Invalidate TanStack Query cache to refetch fresh data
			await queryClient.invalidateQueries({ queryKey: jobAccessoryKeys.all })

			saveSuccess = true

			// Navigate back to detail page after a short delay
			setTimeout(() => {
				goto(`/database/job-accessories/${editData.granblue_id}`)
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
	const pageTitle = $derived(m.page_title_db_edit({ name: accessory?.name?.en ?? 'Job Accessory' }))
</script>

<PageMeta title={pageTitle} description={m.page_desc_home()} />

<div class="page">
	{#if accessory}
		<div class="header">
			<div class="header-content">
				<h1 class="title">Edit: {localizedName(accessory.name)}</h1>
			</div>
			<div class="header-actions">
				<Button variant="secondary" size="small" onclick={handleCancel} disabled={isSaving}>
					Cancel
				</Button>
				<Button variant="primary" size="small" onclick={saveChanges} disabled={isSaving}>
					{isSaving ? 'Saving...' : 'Save'}
				</Button>
			</div>
		</div>

		{#if saveError}
			<div class="error-message">{saveError}</div>
		{/if}

		{#if saveSuccess}
			<div class="success-message">Changes saved successfully!</div>
		{/if}

		<section class="details">
			<DetailsContainer title="Names">
				<div class="form-field">
					<label for="name_en">English Name</label>
					<input type="text" id="name_en" bind:value={editData.name_en} />
				</div>
				<div class="form-field">
					<label for="name_jp">Japanese Name</label>
					<input type="text" id="name_jp" bind:value={editData.name_jp} />
				</div>
			</DetailsContainer>

			<DetailsContainer title="Identification">
				<div class="form-field">
					<label for="granblue_id">Granblue ID</label>
					<input type="text" id="granblue_id" bind:value={editData.granblue_id} />
				</div>
			</DetailsContainer>

			<DetailsContainer title="Classification">
				<div class="form-field">
					<label for="accessory_type">Accessory Type</label>
					<select id="accessory_type" bind:value={editData.accessory_type}>
						<option value={ACCESSORY_TYPES.SHIELD}>Shield</option>
						<option value={ACCESSORY_TYPES.MANATURA}>Manatura</option>
					</select>
				</div>
				<div class="form-field">
					<label for="rarity">Rarity</label>
					<input type="number" id="rarity" bind:value={editData.rarity} min="0" max="4" />
				</div>
				<div class="form-field">
					<label for="release_date">Release Date</label>
					<input type="date" id="release_date" bind:value={editData.release_date} />
				</div>
			</DetailsContainer>
		</section>
	{:else if accessoryQuery.isLoading}
		<div class="loading">Loading accessory...</div>
	{:else}
		<div class="error">Failed to load accessory</div>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/effects' as effects;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.page {
		padding: spacing.$unit-2x 0;
		margin: 0 auto;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: spacing.$unit-2x;
		padding: spacing.$unit-2x;
		background: var(--card-bg);
		border: 0.5px solid rgba(0, 0, 0, 0.18);
		border-radius: layout.$page-corner;
		box-shadow: effects.$page-elevation;
	}

	.header-content {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-half;
	}

	.header-actions {
		display: flex;
		gap: spacing.$unit;
	}

	.title {
		font-size: typography.$font-xlarge;
		font-weight: typography.$bold;
		margin: 0;
	}

	.details {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x;
	}

	.form-field {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-half;
		padding: spacing.$unit 0;

		label {
			font-size: typography.$font-small;
			font-weight: typography.$medium;
			color: var(--text-secondary);
		}

		input,
		select {
			padding: spacing.$unit spacing.$unit-2x;
			background: var(--input-bound-bg);
			border: 1px solid var(--table-border);
			border-radius: layout.$item-corner;
			font-size: typography.$font-medium;

			&:hover {
				background: var(--input-bound-bg-hover);
			}

			&:focus {
				outline: none;
				border-color: var(--blue);
				box-shadow: 0 0 0 2px var(--blue-focus-ring);
			}
		}

		select {
			cursor: pointer;
		}
	}

	.error-message {
		padding: spacing.$unit-2x;
		margin-bottom: spacing.$unit-2x;
		background: #fee2e2;
		color: #991b1b;
		border-radius: layout.$item-corner;
	}

	.success-message {
		padding: spacing.$unit-2x;
		margin-bottom: spacing.$unit-2x;
		background: #dcfce7;
		color: #166534;
		border-radius: layout.$item-corner;
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
