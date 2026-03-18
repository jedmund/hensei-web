
<script lang="ts">
	import { goto } from '$app/navigation'
	import { localizeHref } from '$lib/paraglide/runtime'
	import { createQuery } from '@tanstack/svelte-query'
	import { crewQueries } from '$lib/api/queries/crew.queries'
	import { useCreateCrew } from '$lib/api/mutations/crew.mutations'
	import { crewStore } from '$lib/stores/crew.store.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import * as m from '$lib/paraglide/messages'
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
			goto(localizeHref('/crew'))
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
			newErrors.name = m.crew_error_name_required()
		} else if (name.length > 100) {
			newErrors.name = m.crew_error_name_max()
		}

		if (gamertag && gamertag.length > 4) {
			newErrors.gamertag = m.crew_error_gamertag_max()
		}

		if (description && description.length > 500) {
			newErrors.description = m.crew_error_description_max()
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
			goto(localizeHref('/crew'))
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
	<title>{m.page_title_crew_create()}</title>
</svelte:head>

<div class="create-crew-page">
	{#if crewQuery.isLoading}
		<div class="loading-state">
			<p>{m.crew_loading()}</p>
		</div>
	{:else}
		<div class="form-container">
			<header class="page-header">
				<h1>{m.crew_create()}</h1>
				<p class="description">{m.crew_create_subtitle()}</p>
			</header>

			<form onsubmit={handleSubmit} class="crew-form">
				{#if errors.form}
					<div class="form-error">
						{errors.form}
					</div>
				{/if}

				<div class="form-group">
					<label for="name" class="form-label">
						{m.crew_name_label()} <span class="required">{m.crew_required_mark()}</span>
					</label>
					<input
						type="text"
						id="name"
						bind:value={name}
						class="form-input"
						class:error={errors.name}
						placeholder={m.crew_name_placeholder()}
						maxlength="100"
					/>
					{#if errors.name}
						<span class="field-error">{errors.name}</span>
					{/if}
					<span class="field-hint">{m.crew_name_counter({ length: String(name.length) })}</span>
				</div>

				<div class="form-group">
					<label for="gamertag" class="form-label">
						{m.crew_gamertag_label()}
					</label>
					<input
						type="text"
						id="gamertag"
						bind:value={gamertag}
						class="form-input"
						class:error={errors.gamertag}
						placeholder={m.crew_gamertag_placeholder()}
						maxlength="4"
					/>
					{#if errors.gamertag}
						<span class="field-error">{errors.gamertag}</span>
					{/if}
					<span class="field-hint">
						{m.crew_gamertag_hint()}
					</span>
				</div>

				<div class="form-group">
					<label for="granblueCrewId" class="form-label">
						{m.crew_ingame_id_label()}
					</label>
					<input
						type="text"
						id="granblueCrewId"
						bind:value={granblueCrewId}
						class="form-input"
						class:error={errors.granblueCrewId}
						placeholder={m.crew_ingame_id_placeholder()}
					/>
					{#if errors.granblueCrewId}
						<span class="field-error">{errors.granblueCrewId}</span>
					{/if}
					<span class="field-hint">
						{m.crew_ingame_id_hint()}
					</span>
				</div>

				<div class="form-group">
					<label for="description" class="form-label">
						{m.crew_description_label()}
					</label>
					<textarea
						id="description"
						bind:value={description}
						class="form-input form-textarea"
						class:error={errors.description}
						placeholder={m.crew_description_placeholder()}
						maxlength="500"
						rows="4"
					></textarea>
					{#if errors.description}
						<span class="field-error">{errors.description}</span>
					{/if}
					<span class="field-hint">{m.crew_description_counter({ length: String(description.length) })}</span>
				</div>

				<div class="form-actions">
					<Button
						variant="secondary"
						type="button"
						onclick={() => goto(localizeHref('/crew'))}
					>
						{m.crew_cancel()}
					</Button>
					<Button
						variant="primary"
						type="submit"
						disabled={createCrewMutation.isPending}
					>
						{createCrewMutation.isPending ? m.crew_creating() : m.crew_create()}
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
	@use '$src/themes/layout' as layout;

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
		border-radius: layout.$item-corner-small;
		font-size: 0.875rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-half;
	}

	.form-label {
		font-weight: typography.$medium;
		font-size: 0.875rem;

		.required {
			color: var(--error-text, #dc2626);
		}
	}

	.form-input {
		padding: spacing.$unit spacing.$unit-half;
		border: 1px solid var(--border-color);
		border-radius: layout.$item-corner-small;
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
