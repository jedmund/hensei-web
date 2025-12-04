<svelte:options runes={true} />

<script lang="ts">
	import { goto } from '$app/navigation'
	import { createQuery } from '@tanstack/svelte-query'
	import { crewQueries } from '$lib/api/queries/crew.queries'
	import { useCreateCrew } from '$lib/api/mutations/crew.mutations'
	import { crewStore } from '$lib/stores/crew.store.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import type { PageData } from './$types'

	interface Props {
		data: PageData
	}

	let { data }: Props = $props()

	// Check if user already has a crew
	const crewQuery = createQuery(() => crewQueries.myCrew())

	// Redirect if user already has a crew
	$effect(() => {
		if (crewQuery.data && !crewQuery.isLoading) {
			goto('/crew')
		}
	})

	// Form state
	let name = $state('')
	let gamertag = $state('')
	let granblueCrewId = $state('')
	let description = $state('')

	// Validation state
	let errors = $state<Record<string, string>>({})

	// Create mutation
	const createCrewMutation = useCreateCrew()

	// Form validation
	function validate(): boolean {
		const newErrors: Record<string, string> = {}

		if (!name.trim()) {
			newErrors.name = 'Crew name is required'
		} else if (name.length > 100) {
			newErrors.name = 'Crew name must be 100 characters or less'
		}

		if (gamertag && gamertag.length > 10) {
			newErrors.gamertag = 'Gamertag must be 10 characters or less'
		}

		if (description && description.length > 500) {
			newErrors.description = 'Description must be 500 characters or less'
		}

		errors = newErrors
		return Object.keys(newErrors).length === 0
	}

	// Form submission
	async function handleSubmit(e: Event) {
		e.preventDefault()

		if (!validate()) return

		try {
			const crew = await createCrewMutation.mutateAsync({
				name: name.trim(),
				gamertag: gamertag.trim() || undefined,
				granblueCrewId: granblueCrewId.trim() || undefined,
				description: description.trim() || undefined
			})

			// Update the store
			crewStore.setCrew(crew, crew.currentMembership ?? null)

			// Navigate to crew dashboard
			goto('/crew')
		} catch (error: any) {
			// Handle API errors
			if (error.errors) {
				errors = error.errors
			} else {
				errors = { form: error.message || 'Failed to create crew' }
			}
		}
	}
</script>

<svelte:head>
	<title>Create Crew | Hensei</title>
</svelte:head>

<div class="create-crew-page">
	{#if crewQuery.isLoading}
		<div class="loading-state">
			<p>Loading...</p>
		</div>
	{:else}
		<div class="form-container">
			<header class="page-header">
				<h1>Create a Crew</h1>
				<p class="description">Start a new crew and invite players to join.</p>
			</header>

			<form onsubmit={handleSubmit} class="crew-form">
				{#if errors.form}
					<div class="form-error">
						{errors.form}
					</div>
				{/if}

				<div class="form-group">
					<label for="name" class="form-label">
						Crew Name <span class="required">*</span>
					</label>
					<input
						type="text"
						id="name"
						bind:value={name}
						class="form-input"
						class:error={errors.name}
						placeholder="Enter your crew name"
						maxlength="100"
					/>
					{#if errors.name}
						<span class="field-error">{errors.name}</span>
					{/if}
					<span class="field-hint">{name.length}/100 characters</span>
				</div>

				<div class="form-group">
					<label for="gamertag" class="form-label">
						Gamertag
					</label>
					<input
						type="text"
						id="gamertag"
						bind:value={gamertag}
						class="form-input"
						class:error={errors.gamertag}
						placeholder="e.g., CREW"
						maxlength="10"
					/>
					{#if errors.gamertag}
						<span class="field-error">{errors.gamertag}</span>
					{/if}
					<span class="field-hint">
						Short tag displayed next to member usernames (optional)
					</span>
				</div>

				<div class="form-group">
					<label for="granblueCrewId" class="form-label">
						In-Game Crew ID
					</label>
					<input
						type="text"
						id="granblueCrewId"
						bind:value={granblueCrewId}
						class="form-input"
						class:error={errors.granblueCrewId}
						placeholder="Your Granblue Fantasy crew ID"
					/>
					{#if errors.granblueCrewId}
						<span class="field-error">{errors.granblueCrewId}</span>
					{/if}
					<span class="field-hint">
						The numeric ID from your in-game crew (optional)
					</span>
				</div>

				<div class="form-group">
					<label for="description" class="form-label">
						Description
					</label>
					<textarea
						id="description"
						bind:value={description}
						class="form-input form-textarea"
						class:error={errors.description}
						placeholder="Tell others about your crew"
						maxlength="500"
						rows="4"
					></textarea>
					{#if errors.description}
						<span class="field-error">{errors.description}</span>
					{/if}
					<span class="field-hint">{description.length}/500 characters</span>
				</div>

				<div class="form-actions">
					<Button
						variant="secondary"
						type="button"
						onclick={() => goto('/crew')}
					>
						Cancel
					</Button>
					<Button
						variant="primary"
						type="submit"
						disabled={createCrewMutation.isPending}
					>
						{createCrewMutation.isPending ? 'Creating...' : 'Create Crew'}
					</Button>
				</div>
			</form>
		</div>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.create-crew-page {
		min-height: 400px;
	}

	.loading-state {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 300px;
		color: var(--text-secondary);
	}

	.form-container {
		max-width: 500px;
		margin: 0 auto;
	}

	.page-header {
		margin-bottom: spacing.$unit-3x;

		h1 {
			margin-bottom: spacing.$unit-half;
		}

		.description {
			color: var(--text-secondary);
		}
	}

	.crew-form {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x;
	}

	.form-error {
		background: var(--error-background, #fef2f2);
		border: 1px solid var(--error-border, #fecaca);
		color: var(--error-text, #dc2626);
		padding: spacing.$unit spacing.$unit-2x;
		border-radius: 4px;
		font-size: 0.875rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-half;
	}

	.form-label {
		font-weight: 500;
		font-size: 0.875rem;

		.required {
			color: var(--error-text, #dc2626);
		}
	}

	.form-input {
		padding: spacing.$unit spacing.$unit-half;
		border: 1px solid var(--border-color);
		border-radius: 4px;
		background: var(--input-background, var(--background));
		color: var(--text-primary);
		font-size: 1rem;
		transition: border-color 0.2s;

		&:focus {
			outline: none;
			border-color: var(--focus-color, #3b82f6);
		}

		&.error {
			border-color: var(--error-border, #dc2626);
		}
	}

	.form-textarea {
		resize: vertical;
		min-height: 100px;
		font-family: inherit;
	}

	.field-error {
		color: var(--error-text, #dc2626);
		font-size: 0.75rem;
	}

	.field-hint {
		color: var(--text-secondary);
		font-size: 0.75rem;
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: spacing.$unit;
		margin-top: spacing.$unit;
	}
</style>
