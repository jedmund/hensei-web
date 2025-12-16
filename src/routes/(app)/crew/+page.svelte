<svelte:options runes={true} />

<script lang="ts">
	import { goto } from '$app/navigation'
	import { createQuery, useQueryClient } from '@tanstack/svelte-query'
	import { crewQueries } from '$lib/api/queries/crew.queries'
	import { gwAdapter } from '$lib/api/adapters/gw.adapter'
	import { useCreateCrew, useUpdateCrew } from '$lib/api/mutations/crew.mutations'
	import { crewStore } from '$lib/stores/crew.store.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import ModalHeader from '$lib/components/ui/ModalHeader.svelte'
	import ModalBody from '$lib/components/ui/ModalBody.svelte'
	import ModalFooter from '$lib/components/ui/ModalFooter.svelte'
	import Input from '$lib/components/ui/Input.svelte'
	import CrewHeader from '$lib/components/crew/CrewHeader.svelte'
	import type { PageData } from './$types'

	interface Props {
		data: PageData
	}

	let { data }: Props = $props()

	const queryClient = useQueryClient()

	// Query for the user's crew
	const crewQuery = createQuery(() => crewQueries.myCrew())

	// Query for pending invitations (shown when no crew)
	const invitationsQuery = createQuery(() => crewQueries.pendingInvitations())

	// Query for GW events (only when in crew)
	const eventsQuery = createQuery(() => ({
		queryKey: ['gw', 'events'],
		queryFn: () => gwAdapter.getEvents(),
		enabled: crewStore.isInCrew,
		staleTime: 1000 * 60 * 5
	}))

	// Element labels (matches GranblueEnums::ELEMENTS)
	const elementLabels: Record<number, string> = {
		0: 'Null',
		1: 'Wind',
		2: 'Fire',
		3: 'Water',
		4: 'Earth',
		5: 'Dark',
		6: 'Light'
	}

	// Element colors for badges
	const elementColors: Record<number, string> = {
		0: 'null',
		1: 'wind',
		2: 'fire',
		3: 'water',
		4: 'earth',
		5: 'dark',
		6: 'light'
	}

	// Mutations
	const createCrewMutation = useCreateCrew()
	const updateCrewMutation = useUpdateCrew()

	// Modal state
	let createModalOpen = $state(false)
	let settingsModalOpen = $state(false)

	// Create form state
	let crewName = $state('')
	let crewGamertag = $state('')
	let crewDescription = $state('')
	let error = $state<string | null>(null)

	// Settings form state
	let settingsName = $state('')
	let settingsGamertag = $state('')
	let settingsDescription = $state('')
	let settingsError = $state<string | null>(null)

	// Sync settings form when modal opens
	function openSettingsModal() {
		settingsName = crewStore.crew?.name ?? ''
		settingsGamertag = crewStore.crew?.gamertag ?? ''
		settingsDescription = crewStore.crew?.description ?? ''
		settingsError = null
		settingsModalOpen = true
	}

	// Validation
	const canCreate = $derived(crewName.trim().length > 0)
	const canSaveSettings = $derived(settingsName.trim().length > 0)

	// Handle create crew
	async function handleCreateCrew() {
		if (!canCreate) return

		error = null

		try {
			const crew = await createCrewMutation.mutateAsync({
				name: crewName.trim(),
				gamertag: crewGamertag.trim() || undefined,
				description: crewDescription.trim() || undefined
			})

			// Update the store - creator is always captain
			crewStore.setCrew(crew, {
				id: '', // Will be populated when fetching crew
				role: 'captain',
				retired: false,
				retiredAt: null,
				joinedAt: new Date().toISOString(),
				createdAt: new Date().toISOString()
			})

			// Close modal and reset form
			createModalOpen = false
			crewName = ''
			crewGamertag = ''
			crewDescription = ''
		} catch (err: any) {
			error = err.message || 'Failed to create crew'
		}
	}

	function handleCloseModal() {
		createModalOpen = false
		error = null
	}

	// Handle update crew settings
	async function handleUpdateSettings() {
		if (!canSaveSettings) return

		settingsError = null

		try {
			const crew = await updateCrewMutation.mutateAsync({
				name: settingsName.trim(),
				gamertag: settingsGamertag.trim() || undefined,
				description: settingsDescription.trim() || undefined
			})

			// Update the store
			crewStore.setCrew(crew, crewStore.membership)

			// Close modal
			settingsModalOpen = false
		} catch (err: any) {
			settingsError = err.message || 'Failed to update crew'
		}
	}

	function handleCloseSettingsModal() {
		settingsModalOpen = false
		settingsError = null
	}

	// Helper for formatting dates
	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		})
	}

	function formatEventStatus(status: string, startDate: string): string {
		if (status === 'upcoming') {
			const now = new Date()
			const start = new Date(startDate)
			const diffTime = start.getTime() - now.getTime()
			const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
			if (diffDays <= 0) return 'Starting soon'
			if (diffDays === 1) return 'in 1 day'
			return `in ${diffDays} days`
		}
		return status
	}
</script>

<svelte:head>
	<title>Crew | Hensei</title>
</svelte:head>

<div class="page">
	<div class="card">
		{#if crewQuery.isLoading}
			<div class="loading-state">
				<p>Loading...</p>
			</div>
		{:else if crewQuery.isError || !crewStore.isInCrew}
			<!-- No crew state -->
			<div class="no-crew">
				<div class="no-crew-content">
					<p class="description">
						Crews let you team up with other players, track Guild War scores, and share strategies.
					</p>

					<div class="actions">
						<Button variant="primary" size="small" onclick={() => (createModalOpen = true)}>
							Create a Crew
						</Button>
					</div>
				</div>

				{#if invitationsQuery.data && invitationsQuery.data.length > 0}
					<div class="invitations-section">
						<ul class="invitation-list">
							{#each invitationsQuery.data as invitation}
								{#if invitation.crew && invitation.invitedBy}
									<li class="invitation-item">
										<div class="invitation-info">
											<span class="crew-name">{invitation.crew.name}</span>
											<span class="invited-by">
												from {invitation.invitedBy.username}
											</span>
										</div>
										<Button
											variant="secondary"
											size="small"
											onclick={() => goto(`/crew/join?invitation=${invitation.id}`)}
										>
											View
										</Button>
									</li>
								{/if}
							{/each}
						</ul>
					</div>
				{/if}
			</div>
		{:else}
			<!-- Has crew - show dashboard -->
			<div class="crew-dashboard">
				<CrewHeader
					title={crewStore.crew?.name ?? ''}
					subtitle={crewStore.crew?.gamertag ?? undefined}
					description={crewStore.crew?.description ?? undefined}
				>
					{#snippet actions()}
						{#if crewStore.isOfficer}
							<Button variant="secondary" size="small" onclick={openSettingsModal}>Settings</Button>
						{/if}
					{/snippet}
				</CrewHeader>

				<div class="stats-row">
					<a href="/crew/members" class="stat stat-link">
						<span class="stat-value">{crewStore.crew?.memberCount ?? 0}</span>
						<span class="stat-label">Members</span>
					</a>
					<div class="stat">
						<span
							class="stat-value role"
							class:captain={crewStore.isCaptain}
							class:officer={crewStore.isViceCaptain}
						>
							{#if crewStore.isCaptain}
								Captain
							{:else if crewStore.isViceCaptain}
								Vice Captain
							{:else}
								Member
							{/if}
						</span>
						<span class="stat-label">Your Role</span>
					</div>
				</div>

				<!-- GW Events Section -->
				<div class="section-header">
					<span class="section-title">Unite and Fight</span>
				</div>

				{#if eventsQuery.isLoading}
					<div class="loading-state">
						<p>Loading events...</p>
					</div>
				{:else if eventsQuery.data && eventsQuery.data.length > 0}
					<ul class="event-list">
						{#each eventsQuery.data as event}
							<li class="event-item" onclick={() => goto(`/crew/events/${event.eventNumber}`)}>
								<div class="event-info">
									<span class="event-number">{event.eventNumber}</span>
									<span class="element-badge element-{elementColors[event.element]}">
										{elementLabels[event.element] ?? 'Unknown'}
									</span>
								</div>
								<span class="event-dates">
									{formatDate(event.startDate)} – {formatDate(event.endDate)}
								</span>
								<span class="event-status status-{event.status ?? 'unknown'}"
									>{formatEventStatus(event.status ?? 'unknown', event.startDate)}</span
								>
							</li>
						{/each}
					</ul>
				{:else}
					<p class="empty-state">No events yet</p>
				{/if}
			</div>
		{/if}
	</div>
</div>

<!-- Create Crew Modal -->
<Dialog bind:open={createModalOpen} onOpenChange={(open) => !open && handleCloseModal()}>
	{#snippet children()}
		<ModalHeader title="Create a Crew" />

		<ModalBody>
			{#snippet children()}
				<div class="modal-form">
					{#if error}
						<div class="error-message">{error}</div>
					{/if}

					<div class="form-fields">
						<Input
							label="Crew Name"
							bind:value={crewName}
							placeholder="Enter crew name"
							maxLength={100}
							fullWidth
							contained
						/>

						<Input
							label="Gamertag (optional)"
							bind:value={crewGamertag}
							placeholder="Short tag, e.g. CREW"
							maxLength={5}
							fullWidth
							contained
						/>

						<div class="form-field">
							<label for="crew-description"
								>Description <span class="optional">(optional)</span></label
							>
							<textarea
								id="crew-description"
								bind:value={crewDescription}
								placeholder="Tell others about your crew"
								maxlength="500"
								rows="3"
							></textarea>
						</div>
					</div>
				</div>
			{/snippet}
		</ModalBody>

		<ModalFooter
			onCancel={handleCloseModal}
			cancelDisabled={createCrewMutation.isPending}
			primaryAction={{
				label: createCrewMutation.isPending ? 'Creating...' : 'Create Crew',
				onclick: handleCreateCrew,
				disabled: !canCreate || createCrewMutation.isPending
			}}
		/>
	{/snippet}
</Dialog>

<!-- Crew Settings Modal -->
<Dialog bind:open={settingsModalOpen} onOpenChange={(open) => !open && handleCloseSettingsModal()}>
	{#snippet children()}
		<ModalHeader title="Crew Settings" />

		<ModalBody>
			{#snippet children()}
				<div class="modal-form">
					{#if settingsError}
						<div class="error-message">{settingsError}</div>
					{/if}

					<div class="form-fields">
						<Input
							label="Crew Name"
							bind:value={settingsName}
							placeholder="Enter crew name"
							maxLength={100}
							fullWidth
							contained
						/>

						<Input
							label="Gamertag (optional)"
							bind:value={settingsGamertag}
							placeholder="Short tag, e.g. CREW"
							maxLength={5}
							fullWidth
							contained
						/>

						<div class="form-field">
							<label for="settings-description"
								>Description <span class="optional">(optional)</span></label
							>
							<textarea
								id="settings-description"
								bind:value={settingsDescription}
								placeholder="Tell others about your crew"
								maxlength="500"
								rows="3"
							></textarea>
						</div>
					</div>
				</div>
			{/snippet}
		</ModalBody>

		<ModalFooter
			onCancel={handleCloseSettingsModal}
			cancelDisabled={updateCrewMutation.isPending}
			primaryAction={{
				label: updateCrewMutation.isPending ? 'Saving...' : 'Save',
				onclick: handleUpdateSettings,
				disabled: !canSaveSettings || updateCrewMutation.isPending
			}}
		/>
	{/snippet}
</Dialog>

<style lang="scss">
	@use '$src/themes/effects' as effects;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/colors' as colors;

	.page {
		margin: 0 auto;
		max-width: var(--main-max-width);
	}

	.card {
		background: var(--card-bg);
		border: 0.5px solid rgba(0, 0, 0, 0.18);
		border-radius: layout.$page-corner;
		box-shadow: effects.$page-elevation;
		overflow: hidden;
	}

	.loading-state {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: spacing.$unit-4x;
		color: var(--text-secondary);
		font-size: typography.$font-small;
	}

	// No crew state
	.no-crew-content {
		padding: spacing.$unit-3x spacing.$unit-2x;
		text-align: center;

		.description {
			color: var(--text-primary);
			font-size: typography.$font-small;
			line-height: 1.5;
			margin-bottom: spacing.$unit-2x;
			max-width: 360px;
			margin-left: auto;
			margin-right: auto;
		}
	}

	.actions {
		display: flex;
		justify-content: center;
	}

	.invitations-section {
		// No border - flows naturally from content above
	}

	.invitation-list {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.invitation-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: spacing.$unit-2x;
		border-bottom: 1px solid rgba(0, 0, 0, 0.06);

		&:last-child {
			border-bottom: none;
		}
	}

	.invitation-info {
		display: flex;
		flex-direction: column;
		gap: 2px;

		.crew-name {
			font-size: typography.$font-regular;
			font-weight: typography.$medium;
		}

		.invited-by {
			font-size: typography.$font-small;
			color: var(--text-secondary);
		}
	}

	.stats-row {
		display: flex;
	}

	.stat {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: spacing.$unit-2x;
		border-right: 1px solid rgba(0, 0, 0, 0.08);

		&:last-child {
			border-right: none;
		}

		&.stat-link {
			text-decoration: none;
			color: inherit;
			transition: background-color 0.15s;

			&:hover {
				background: rgba(0, 0, 0, 0.02);
			}
		}
	}

	.stat-value {
		font-size: typography.$font-medium;
		font-weight: typography.$medium;
		margin-bottom: 2px;

		&.role {
			font-size: typography.$font-small;

			&.captain {
				color: var(--color-gold, #b8860b);
			}

			&.officer {
				color: var(--color-blue, #3b82f6);
			}
		}
	}

	.stat-label {
		font-size: typography.$font-small;
		color: var(--text-secondary);
	}

	// Section header
	.section-header {
		display: flex;
		align-items: center;
		padding: spacing.$unit spacing.$unit-2x;
		background: rgba(0, 0, 0, 0.02);
		border-top: 1px solid rgba(0, 0, 0, 0.06);
	}

	.section-title {
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		color: var(--text-secondary);
	}

	// Event list (similar to member list)
	.event-list {
		list-style: none;
		margin: 0;
		padding: spacing.$unit;
	}

	.event-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: spacing.$unit spacing.$unit-2x;
		border-radius: layout.$item-corner;
		transition: background-color 0.15s;
		cursor: pointer;

		&:hover {
			background: rgba(0, 0, 0, 0.03);
		}
	}

	.event-info {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
	}

	.event-number {
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		min-width: 24px;
	}

	.event-dates {
		font-size: typography.$font-small;
		color: var(--text-secondary);
	}

	.event-status {
		font-size: typography.$font-small;
		padding: 2px 6px;
		border-radius: layout.$item-corner-small;
		text-transform: capitalize;

		&.status-active {
			background: var(--color-green-light, #dcfce7);
			color: var(--color-green-dark, #166534);
		}

		&.status-upcoming {
			background: var(--color-blue-light, #dbeafe);
			color: var(--color-blue-dark, #1e40af);
		}

		&.status-finished {
			background: rgba(0, 0, 0, 0.04);
			color: var(--text-secondary);
		}
	}

	.element-badge {
		display: inline-block;
		padding: 2px 8px;
		border-radius: layout.$item-corner-small;
		font-size: typography.$font-small;
		font-weight: typography.$medium;

		&.element-null {
			background: rgba(0, 0, 0, 0.04);
			color: var(--text-secondary);
		}

		&.element-fire {
			background: #fee2e2;
			color: #dc2626;
		}

		&.element-water {
			background: #dbeafe;
			color: #2563eb;
		}

		&.element-earth {
			background: #fef3c7;
			color: #d97706;
		}

		&.element-wind {
			background: #d1fae5;
			color: #059669;
		}

		&.element-light {
			background: #fef9c3;
			color: #ca8a04;
		}

		&.element-dark {
			background: #ede9fe;
			color: #7c3aed;
		}
	}

	.empty-state {
		text-align: center;
		color: var(--text-secondary);
		padding: spacing.$unit-3x;
		font-size: typography.$font-small;
	}

	// Modal form styles
	.modal-form {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-3x;
	}

	.error-message {
		background-color: rgba(colors.$error, 0.1);
		border: 1px solid colors.$error;
		border-radius: layout.$card-corner;
		color: colors.$error;
		padding: spacing.$unit-2x;
	}

	.form-fields {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-3x;
	}

	.form-field {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-half;

		label {
			font-size: typography.$font-small;
			font-weight: typography.$medium;
			color: var(--text-primary);

			.optional {
				font-weight: typography.$normal;
				color: var(--text-secondary);
			}
		}

		textarea {
			padding: spacing.$unit-2x;
			border: none;
			border-radius: layout.$input-corner;
			font-size: typography.$font-regular;
			font-family: inherit;
			background: var(--input-bound-bg);
			color: var(--text-primary);
			resize: vertical;
			min-height: 80px;

			&:hover {
				background: var(--input-bound-bg-hover);
			}

			&::placeholder {
				color: var(--text-tertiary);
			}
		}
	}

	:global(fieldset) {
		border: none;
		padding: 0;
		margin: 0;
	}
</style>
