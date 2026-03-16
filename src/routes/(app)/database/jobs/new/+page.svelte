
<script lang="ts">
	// SvelteKit imports
	import { goto } from '$app/navigation'

	// Page metadata
	import PageMeta from '$lib/components/PageMeta.svelte'

	// TanStack Query
	import { useQueryClient, createQuery } from '@tanstack/svelte-query'
	import { jobKeys, jobQueries } from '$lib/api/queries/job.queries'
	import { jobAdapter, type JobUpdatePayload } from '$lib/api/adapters/job.adapter'

	// Components
	import Button from '$lib/components/ui/Button.svelte'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'

	// Utils
	import { PROFICIENCIES, ROWS } from '$lib/utils/jobUtils'

	const queryClient = useQueryClient()

	// Fetch all jobs for base job selection
	const jobsQuery = createQuery(() => jobQueries.list())

	// Save state
	let isSaving = $state(false)
	let saveError = $state<string | null>(null)

	// Form data
	let formData = $state<JobUpdatePayload>({
		name_en: '',
		name_jp: '',
		granblue_id: '',
		proficiency1: 0,
		proficiency2: 0,
		row: '1',
		order: 0,
		master_level: false,
		ultimate_mastery: false,
		accessory: false,
		accessory_type: 0,
		aux_weapon: false,
		base_job_id: null
	})

	// Validation
	const isValid = $derived(
		formData.name_en?.trim() !== '' &&
		formData.granblue_id?.trim() !== ''
	)

	// Filter base jobs - only show row 4/5/ex2 jobs that could be base jobs
	const baseJobOptions = $derived(
		(jobsQuery.data ?? [])
			.filter(job => ['4', '5', 'ex2'].includes(String(job.row || '')))
			.sort((a, b) => (a.name?.en || '').localeCompare(b.name?.en || ''))
	)

	async function handleCreate() {
		if (!isValid) return

		isSaving = true
		saveError = null

		try {
			const job = await jobAdapter.createJob(formData)

			// Invalidate cache
			await queryClient.invalidateQueries({ queryKey: jobKeys.all })

			// Navigate to the new job
			goto(`/database/jobs/${job.granblueId}`)
		} catch (error) {
			saveError = 'Failed to create job. Please try again.'
			console.error('Create error:', error)
		} finally {
			isSaving = false
		}
	}

	function handleCancel() {
		goto('/database/jobs')
	}
</script>

<PageMeta title="New Job" description="Create a new job" />

<div class="page">
	<div class="header">
		<div class="header-content">
			<button class="back-button" onclick={handleCancel}>
				← Back to Jobs
			</button>
			<h1 class="title">New Job</h1>
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
				<input type="text" id="granblue_id" bind:value={formData.granblue_id} placeholder="e.g., 100001" />
				<p class="hint">The unique game identifier for this job</p>
			</div>
			<div class="form-field">
				<label for="order">Order</label>
				<input type="number" id="order" bind:value={formData.order} min="0" />
				<p class="hint">Display order within the job row</p>
			</div>
		</DetailsContainer>

		<DetailsContainer title="Classification">
			<div class="form-field">
				<label for="row">Row</label>
				<select id="row" bind:value={formData.row}>
					{#each ROWS as row}
						<option value={row.value}>{row.label}</option>
					{/each}
				</select>
			</div>
			<div class="form-field">
				<label for="proficiency1">Primary Proficiency</label>
				<select id="proficiency1" bind:value={formData.proficiency1}>
					{#each PROFICIENCIES as prof}
						<option value={prof.value}>{prof.label}</option>
					{/each}
				</select>
			</div>
			<div class="form-field">
				<label for="proficiency2">Secondary Proficiency</label>
				<select id="proficiency2" bind:value={formData.proficiency2}>
					{#each PROFICIENCIES as prof}
						<option value={prof.value}>{prof.label}</option>
					{/each}
				</select>
			</div>
			<div class="form-field">
				<label for="base_job_id">Base Job</label>
				<select id="base_job_id" bind:value={formData.base_job_id}>
					<option value={null}>None</option>
					{#each baseJobOptions as job}
						<option value={job.id}>{job.name?.en}</option>
					{/each}
				</select>
				<p class="hint">For EX2 jobs, select the Row IV/V job they are based on</p>
			</div>
		</DetailsContainer>

		<DetailsContainer title="Features">
			<div class="form-field checkbox-field">
				<label>
					<input type="checkbox" bind:checked={formData.master_level} />
					Master Level
				</label>
				<p class="hint">Job has master levels</p>
			</div>
			<div class="form-field checkbox-field">
				<label>
					<input type="checkbox" bind:checked={formData.ultimate_mastery} />
					Ultimate Mastery
				</label>
				<p class="hint">Job has ultimate mastery</p>
			</div>
			<div class="form-field checkbox-field">
				<label>
					<input type="checkbox" bind:checked={formData.accessory} />
					Accessory
				</label>
				<p class="hint">Job supports accessories (shields/manatura)</p>
			</div>
			<div class="form-field checkbox-field">
				<label>
					<input type="checkbox" bind:checked={formData.aux_weapon} />
					Auxiliary Weapon
				</label>
				<p class="hint">Job supports auxiliary weapon slot</p>
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

		input[type="text"],
		input[type="number"],
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

		&.checkbox-field {
			flex-direction: row;
			align-items: flex-start;
			flex-wrap: wrap;
			gap: spacing.$unit;

			label {
				display: flex;
				align-items: center;
				gap: spacing.$unit-half;
				cursor: pointer;
				color: var(--text-primary);

				input[type="checkbox"] {
					width: 16px;
					height: 16px;
					cursor: pointer;
				}
			}

			.hint {
				flex-basis: 100%;
				margin-top: 0;
			}
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
