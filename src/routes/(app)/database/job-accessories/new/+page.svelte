
<script lang="ts">
	// SvelteKit imports
	import { goto } from '$app/navigation'

	// Page metadata
	import PageMeta from '$lib/components/PageMeta.svelte'

	// TanStack Query
	import { useQueryClient } from '@tanstack/svelte-query'
	import { jobAccessoryKeys } from '$lib/api/queries/job.queries'
	import { jobAdapter } from '$lib/api/adapters/job.adapter'

	// Components
	import Button from '$lib/components/ui/Button.svelte'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'

	// Utils
	import { ACCESSORY_TYPES } from '$lib/utils/jobAccessoryUtils'

	const queryClient = useQueryClient()

	// Save state
	let isSaving = $state(false)
	let saveError = $state<string | null>(null)

	// Form data
	let formData = $state({
		name_en: '',
		name_jp: '',
		granblue_id: '',
		accessory_type: ACCESSORY_TYPES.SHIELD,
		rarity: 3,
		release_date: ''
	})

	// Validation
	const isValid = $derived(
		formData.name_en.trim() !== '' &&
		formData.granblue_id.trim() !== ''
	)

	async function handleCreate() {
		if (!isValid) return

		isSaving = true
		saveError = null

		try {
			const accessory = await jobAdapter.createAccessory(formData)

			// Invalidate cache
			await queryClient.invalidateQueries({ queryKey: jobAccessoryKeys.all })

			// Navigate to the new accessory
			goto(`/database/job-accessories/${accessory.granblueId}`)
		} catch (error) {
			saveError = 'Failed to create accessory. Please try again.'
			console.error('Create error:', error)
		} finally {
			isSaving = false
		}
	}

	function handleCancel() {
		goto('/database/jobs?view=accessories')
	}
</script>

<PageMeta title="New Job Accessory" description="Create a new job accessory" />

<div class="page">
	<div class="header">
		<div class="header-content">
			<button class="back-button" onclick={handleCancel}>
				← Back to Accessories
			</button>
			<h1 class="title">New Job Accessory</h1>
		</div>
		<div class="header-actions">
			<Button variant="secondary" size="small" onclick={handleCancel} disabled={isSaving}>
				Cancel
			</Button>
			<Button variant="primary" size="small" onclick={handleCreate} disabled={isSaving || !isValid}>
				{isSaving ? 'Creating...' : 'Create'}
			</Button>
		</div>
	</div>

	{#if saveError}
		<div class="error-message">{saveError}</div>
	{/if}

	<section class="details">
		<DetailsContainer title="Names">
			<div class="form-field">
				<label for="name_en">English Name <span class="required">*</span></label>
				<input type="text" id="name_en" bind:value={formData.name_en} placeholder="Enter English name" />
			</div>
			<div class="form-field">
				<label for="name_jp">Japanese Name</label>
				<input type="text" id="name_jp" bind:value={formData.name_jp} placeholder="Enter Japanese name" />
			</div>
		</DetailsContainer>

		<DetailsContainer title="Identification">
			<div class="form-field">
				<label for="granblue_id">Granblue ID <span class="required">*</span></label>
				<input type="text" id="granblue_id" bind:value={formData.granblue_id} placeholder="e.g., 1234567" />
				<p class="hint">The unique game identifier for this accessory</p>
			</div>
		</DetailsContainer>

		<DetailsContainer title="Classification">
			<div class="form-field">
				<label for="accessory_type">Accessory Type</label>
				<select id="accessory_type" bind:value={formData.accessory_type}>
					<option value={ACCESSORY_TYPES.SHIELD}>Shield</option>
					<option value={ACCESSORY_TYPES.MANATURA}>Manatura</option>
				</select>
			</div>
			<div class="form-field">
				<label for="rarity">Rarity</label>
				<input type="number" id="rarity" bind:value={formData.rarity} min="0" max="4" />
			</div>
			<div class="form-field">
				<label for="release_date">Release Date</label>
				<input type="date" id="release_date" bind:value={formData.release_date} />
			</div>
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
		padding: spacing.$unit-2x 0;
		margin: 0 auto;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
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

	.back-button {
		background: none;
		border: none;
		color: var(--text-secondary);
		font-size: typography.$font-small;
		cursor: pointer;
		padding: 0;
		margin-bottom: spacing.$unit-half;

		&:hover {
			color: var(--text-primary);
		}
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

			.required {
				color: var(--red);
			}
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

			&::placeholder {
				color: var(--text-tertiary);
			}
		}

		select {
			cursor: pointer;
		}

		.hint {
			font-size: typography.$font-tiny;
			color: var(--text-tertiary);
			margin: 0;
		}
	}

	.error-message {
		padding: spacing.$unit-2x;
		margin-bottom: spacing.$unit-2x;
		background: #fee2e2;
		color: #991b1b;
		border-radius: layout.$item-corner;
	}
</style>
