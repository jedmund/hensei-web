<svelte:options runes={true} />

<script lang="ts">
	import { goto } from '$app/navigation'
	import { createQuery } from '@tanstack/svelte-query'
	import { crewQueries } from '$lib/api/queries/crew.queries'
	import {
		useUpdateCrew,
		useLeaveCrew,
		useTransferCaptain
	} from '$lib/api/mutations/crew.mutations'
	import { crewStore } from '$lib/stores/crew.store.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import { Dialog } from 'bits-ui'
	import type { PageData } from './$types'
	import { toast } from 'svelte-sonner'
	import { extractErrorMessage } from '$lib/utils/errors'

	interface Props {
		data: PageData
	}

	let { data }: Props = $props()

	// Check if user is an officer
	$effect(() => {
		if (!crewStore.isLoading && !crewStore.isOfficer) {
			goto('/crew')
		}
	})

	// Form state (pre-populated from store)
	let name = $state(crewStore.crew?.name ?? '')
	let gamertag = $state(crewStore.crew?.gamertag ?? '')
	let granblueCrewId = $state(crewStore.crew?.granblueCrewId ?? '')
	let description = $state(crewStore.crew?.description ?? '')

	// Sync form state when crew data changes
	$effect(() => {
		if (crewStore.crew) {
			name = crewStore.crew.name
			gamertag = crewStore.crew.gamertag ?? ''
			granblueCrewId = crewStore.crew.granblueCrewId ?? ''
			description = crewStore.crew.description ?? ''
		}
	})

	// Validation state
	let errors = $state<Record<string, string>>({})

	// Mutations
	const updateCrewMutation = useUpdateCrew()
	const leaveCrewMutation = useLeaveCrew()
	const transferCaptainMutation = useTransferCaptain()

	// Query for members (for captain transfer)
	const membersQuery = createQuery(() => crewQueries.members('active'))

	// Dialog states
	let leaveDialogOpen = $state(false)
	let transferDialogOpen = $state(false)
	let selectedTransferUserId = $state<string | null>(null)

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
			const crew = await updateCrewMutation.mutateAsync({
				name: name.trim(),
				gamertag: gamertag.trim() || undefined,
				granblueCrewId: granblueCrewId.trim() || undefined,
				description: description.trim() || undefined
			})

			// Update the store
			crewStore.setCrew(crew, crewStore.membership)
		} catch (error: any) {
			if (error.errors) {
				errors = error.errors
			} else {
				errors = { form: error.message || 'Failed to update crew' }
			}
		}
	}

	// Leave crew
	async function handleLeaveCrew() {
		try {
			await leaveCrewMutation.mutateAsync()
			crewStore.clear()
			goto('/crew')
		} catch (error) {
			console.error('Failed to leave crew:', error)
			toast.error(extractErrorMessage(error, 'Failed to leave crew'))
		}
		leaveDialogOpen = false
	}

	// Transfer captain
	async function handleTransferCaptain() {
		if (!selectedTransferUserId || !crewStore.crew) return

		try {
			await transferCaptainMutation.mutateAsync({
				crewId: crewStore.crew.id,
				userId: selectedTransferUserId
			})
			// Membership will be updated via query invalidation
			goto('/crew')
		} catch (error) {
			console.error('Failed to transfer captain:', error)
			toast.error(extractErrorMessage(error, 'Failed to transfer captain role'))
		}
		transferDialogOpen = false
	}

	// Get eligible transfer candidates (non-captain members)
	const transferCandidates = $derived(
		membersQuery.data?.members.filter((m) => m.role !== 'captain' && !m.retired) ?? []
	)
</script>

<svelte:head>
	<title>Crew Settings / granblue.team</title>
</svelte:head>

<div class="settings-page">
	<header class="page-header">
		<h1>Crew Settings</h1>
	</header>

	<form onsubmit={handleSubmit} class="settings-form">
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
				maxlength="100"
			/>
			{#if errors.name}
				<span class="field-error">{errors.name}</span>
			{/if}
		</div>

		<div class="form-group">
			<label for="gamertag" class="form-label"> Gamertag </label>
			<input
				type="text"
				id="gamertag"
				bind:value={gamertag}
				class="form-input"
				class:error={errors.gamertag}
				maxlength="10"
			/>
			{#if errors.gamertag}
				<span class="field-error">{errors.gamertag}</span>
			{/if}
			<span class="field-hint"> Short tag displayed next to member usernames </span>
		</div>

		<div class="form-group">
			<label for="granblueCrewId" class="form-label"> In-Game Crew ID </label>
			<input type="text" id="granblueCrewId" bind:value={granblueCrewId} class="form-input" />
		</div>

		<div class="form-group">
			<label for="description" class="form-label"> Description </label>
			<textarea
				id="description"
				bind:value={description}
				class="form-input form-textarea"
				class:error={errors.description}
				maxlength="500"
				rows="4"
			></textarea>
			{#if errors.description}
				<span class="field-error">{errors.description}</span>
			{/if}
		</div>

		<div class="form-actions">
			<Button variant="primary" type="submit" disabled={updateCrewMutation.isPending}>
				{updateCrewMutation.isPending ? 'Saving...' : 'Save Changes'}
			</Button>
		</div>
	</form>

	<!-- Danger zone -->
	<div class="danger-zone">
		<h2>Danger Zone</h2>

		{#if crewStore.isCaptain}
			<div class="danger-item">
				<div class="danger-info">
					<h3>Transfer Captain</h3>
					<p>Transfer ownership of the crew to another member.</p>
				</div>
				<Button variant="secondary" size="small" onclick={() => (transferDialogOpen = true)}>
					Transfer
				</Button>
			</div>
		{/if}

		{#if crewStore.canLeaveCrew}
			<div class="danger-item">
				<div class="danger-info">
					<h3>Leave Crew</h3>
					<p>Leave this crew. You'll need an invitation to rejoin.</p>
				</div>
				<Button variant="secondary" size="small" onclick={() => (leaveDialogOpen = true)}>
					Leave Crew
				</Button>
			</div>
		{:else if crewStore.isCaptain}
			<p class="captain-note">As captain, you must transfer ownership before leaving the crew.</p>
		{/if}
	</div>
</div>

<!-- Leave Crew Dialog -->
<Dialog.Root bind:open={leaveDialogOpen}>
	<Dialog.Portal>
		<Dialog.Overlay class="dialog-overlay" />
		<Dialog.Content class="dialog-content">
			<Dialog.Title class="dialog-title">Leave Crew</Dialog.Title>
			<Dialog.Description class="dialog-description">
				Are you sure you want to leave {crewStore.crew?.name}? You'll need an invitation to rejoin.
			</Dialog.Description>
			<div class="dialog-actions">
				<Dialog.Close class="dialog-button secondary">Cancel</Dialog.Close>
				<button class="dialog-button primary danger" onclick={handleLeaveCrew}> Leave Crew </button>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>

<!-- Transfer Captain Dialog -->
<Dialog.Root bind:open={transferDialogOpen}>
	<Dialog.Portal>
		<Dialog.Overlay class="dialog-overlay" />
		<Dialog.Content class="dialog-content">
			<Dialog.Title class="dialog-title">Transfer Captain</Dialog.Title>
			<Dialog.Description class="dialog-description">
				Select a member to become the new captain. You will become a regular member.
			</Dialog.Description>

			{#if transferCandidates.length === 0}
				<p class="no-candidates">
					No eligible members to transfer to. The crew needs at least one other member.
				</p>
			{:else}
				<div class="transfer-list">
					{#each transferCandidates as member}
						<label class="transfer-option">
							<input
								type="radio"
								name="transferTarget"
								value={member.user?.id}
								bind:group={selectedTransferUserId}
							/>
							<span class="member-name">{member.user?.username}</span>
							<span class="member-role">
								{member.role === 'vice_captain' ? 'Vice Captain' : 'Member'}
							</span>
						</label>
					{/each}
				</div>
			{/if}

			<div class="dialog-actions">
				<Dialog.Close class="dialog-button secondary">Cancel</Dialog.Close>
				<button
					class="dialog-button primary"
					onclick={handleTransferCaptain}
					disabled={!selectedTransferUserId || transferCandidates.length === 0}
				>
					Transfer
				</button>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/effects' as effects;

	.settings-page {
		max-width: 500px;
	}

	.page-header {
		margin-bottom: spacing.$unit-3x;

		h1 {
			margin: 0;
		}
	}

	.settings-form {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x;
		margin-bottom: spacing.$unit-4x;
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
		margin-top: spacing.$unit;
	}

	// Danger zone
	.danger-zone {
		border-top: 1px solid var(--border-color);
		padding-top: spacing.$unit-3x;

		h2 {
			font-size: 1rem;
			color: var(--color-red, #dc2626);
			margin-bottom: spacing.$unit-2x;
		}
	}

	.danger-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: spacing.$unit-2x;
		background: var(--surface);
		border: 1px solid var(--border-color);
		border-radius: layout.$input-corner;
		margin-bottom: spacing.$unit;
	}

	.danger-info {
		h3 {
			font-size: 0.875rem;
			margin: 0 0 spacing.$unit-half 0;
		}

		p {
			font-size: 0.75rem;
			color: var(--text-secondary);
			margin: 0;
		}
	}

	.captain-note {
		font-size: 0.875rem;
		color: var(--text-secondary);
		font-style: italic;
	}

	// Dialog styles
	:global(.dialog-overlay) {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		z-index: effects.$z-popover;
	}

	.dialog-title {
		font-size: 1.125rem;
		font-weight: typography.$bold;
		margin-bottom: spacing.$unit;
	}

	.dialog-description {
		color: var(--text-secondary);
		margin-bottom: spacing.$unit-2x;
		line-height: 1.5;
	}

	.dialog-actions {
		display: flex;
		justify-content: flex-end;
		gap: spacing.$unit;
		margin-top: spacing.$unit-2x;
	}

	.dialog-button {
		padding: spacing.$unit spacing.$unit-2x;
		border: none;
		border-radius: layout.$item-corner-small;
		cursor: pointer;
		font-size: 0.875rem;
		transition: background 0.2s;

		&.secondary {
			background: var(--surface);
			color: var(--text-primary);

			&:hover {
				background: var(--surface-hover);
			}
		}

		&.primary {
			background: var(--color-blue, #3b82f6);
			color: white;

			&:hover {
				background: var(--color-blue-dark, #2563eb);
			}

			&.danger {
				background: var(--color-red, #dc2626);

				&:hover {
					background: var(--color-red-dark, #b91c1c);
				}
			}

			&:disabled {
				opacity: 0.5;
				cursor: not-allowed;
			}
		}
	}

	.no-candidates {
		color: var(--text-secondary);
		font-style: italic;
		margin-bottom: spacing.$unit-2x;
	}

	.transfer-list {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-half;
		margin-bottom: spacing.$unit-2x;
		max-height: 200px;
		overflow-y: auto;
	}

	.transfer-option {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
		padding: spacing.$unit;
		border: 1px solid var(--border-color);
		border-radius: layout.$item-corner-small;
		cursor: pointer;

		&:hover {
			background: var(--surface-hover);
		}

		input {
			margin: 0;
		}

		.member-name {
			flex: 1;
			font-weight: typography.$medium;
		}

		.member-role {
			font-size: 0.75rem;
			color: var(--text-secondary);
		}
	}
</style>
