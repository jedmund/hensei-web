<svelte:options runes={true} />

<script lang="ts">
	import { goto } from '$app/navigation'
	import {
		useAcceptInvitation,
		useRejectInvitation,
		useConfirmPhantomClaim,
		useDeclinePhantomClaim
	} from '$lib/api/mutations/crew.mutations'
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import ModalHeader from '$lib/components/ui/ModalHeader.svelte'
	import ModalBody from '$lib/components/ui/ModalBody.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import { formatDate } from '$lib/utils/date'
	import type { CrewInvitation, PhantomPlayer } from '$lib/types/api/crew'

	interface Props {
		open: boolean
		invitations: CrewInvitation[]
		phantomClaims: PhantomPlayer[]
		isLoading?: boolean
	}

	let { open = $bindable(false), invitations, phantomClaims, isLoading = false }: Props = $props()

	// Mutations for crew invitations
	const acceptMutation = useAcceptInvitation()
	const rejectMutation = useRejectInvitation()

	// Mutations for phantom claims
	const confirmClaimMutation = useConfirmPhantomClaim()
	const declineClaimMutation = useDeclinePhantomClaim()

	// Track which item is being processed
	let processingId = $state<string | null>(null)

	// Derived state
	const hasInvitations = $derived(invitations.length > 0)
	const hasPhantomClaims = $derived(phantomClaims.length > 0)
	const hasNotifications = $derived(hasInvitations || hasPhantomClaims)

	// Accept invitation
	async function handleAcceptInvitation(invitationId: string) {
		processingId = invitationId
		try {
			await acceptMutation.mutateAsync(invitationId)
			// Successfully joined - close modal and redirect to crew
			open = false
			goto('/crew')
		} catch (error) {
			console.error('Failed to accept invitation:', error)
			processingId = null
		}
	}

	// Reject invitation
	async function handleRejectInvitation(invitationId: string) {
		processingId = invitationId
		try {
			await rejectMutation.mutateAsync(invitationId)
			processingId = null
		} catch (error) {
			console.error('Failed to reject invitation:', error)
			processingId = null
		}
	}

	// Accept phantom claim
	async function handleAcceptPhantomClaim(phantom: PhantomPlayer) {
		if (!phantom.crew) return
		processingId = phantom.id
		try {
			await confirmClaimMutation.mutateAsync({
				crewId: phantom.crew.id,
				phantomId: phantom.id
			})
			processingId = null
		} catch (error) {
			console.error('Failed to accept phantom claim:', error)
			processingId = null
		}
	}

	// Decline phantom claim
	async function handleDeclinePhantomClaim(phantom: PhantomPlayer) {
		if (!phantom.crew) return
		processingId = phantom.id
		try {
			await declineClaimMutation.mutateAsync({
				crewId: phantom.crew.id,
				phantomId: phantom.id
			})
			processingId = null
		} catch (error) {
			console.error('Failed to decline phantom claim:', error)
			processingId = null
		}
	}

	// Check if invitation is expired
	function isExpired(expiresAt: string): boolean {
		return new Date(expiresAt) < new Date()
	}
</script>

<Dialog bind:open>
	<ModalHeader title="Notifications" />

	<ModalBody>
		{#if isLoading}
			<div class="loading-state">
				<Icon name="loader-2" size={24} />
				<p>Loading notifications...</p>
			</div>
		{:else if !hasNotifications}
			<div class="empty-state">
				<Icon name="bell" size={32} />
				<p>No pending notifications</p>
				<p class="hint">You'll see crew invitations and phantom assignments here.</p>
			</div>
		{:else}
			<!-- Phantom Claims Section -->
			{#if hasPhantomClaims}
				<div class="section">
					<h3 class="section-title">Phantom Assignments</h3>
					<p class="section-description">Accept to inherit the phantom's GW scores and join date</p>
					<div class="notifications-list">
						{#each phantomClaims as phantom}
							{@const crew = phantom.crew}
							{@const isProcessing = processingId === phantom.id}

							{#if crew}
								<div class="notification-card">
									<div class="notification-content">
										<div class="notification-info">
											<div class="notification-title-row">
												<span class="notification-title">{phantom.name}</span>
											</div>
											<span class="notification-subtitle">
												From crew {crew.name}{crew.gamertag ? ` [${crew.gamertag}]` : ''}
											</span>
											{#if phantom.joinedAt}
												<span class="notification-meta">
													Joined {formatDate(phantom.joinedAt)}
												</span>
											{/if}
										</div>
									</div>

									<div class="notification-actions">
										<Button
											variant="secondary"
											size="small"
											onclick={() => handleDeclinePhantomClaim(phantom)}
											disabled={isProcessing}
										>
											{isProcessing && declineClaimMutation.isPending ? 'Declining...' : 'Decline'}
										</Button>
										<Button
											variant="primary"
											size="small"
											onclick={() => handleAcceptPhantomClaim(phantom)}
											disabled={isProcessing}
										>
											{isProcessing && confirmClaimMutation.isPending ? 'Accepting...' : 'Accept'}
										</Button>
									</div>
								</div>
							{/if}
						{/each}
					</div>
				</div>
			{/if}

			<!-- Crew Invitations Section -->
			{#if hasInvitations}
				<div class="section">
					<h3 class="section-title">Crew invites</h3>
					<div class="notifications-list">
						{#each invitations as invitation}
							{@const expired = isExpired(invitation.expiresAt)}
							{@const crew = invitation.crew}
							{@const invitedBy = invitation.invitedBy}
							{@const isProcessing = processingId === invitation.id}

							{#if crew}
								<div class="notification-card" class:expired>
									<div class="notification-content">
										<div class="notification-info">
											<div class="notification-title-row">
												<span class="notification-title">{crew.name}</span>
												{#if crew.gamertag}
													<span class="gamertag">[{crew.gamertag}]</span>
												{/if}
											</div>
											{#if invitedBy}
												<span class="notification-subtitle">
													Invited by {invitedBy.username}
												</span>
											{/if}
										</div>

										{#if expired}
											<div class="expired-badge">Expired</div>
										{:else}
											<div class="expires-info">
												Expires {formatDate(invitation.expiresAt)}
											</div>
										{/if}
									</div>

									{#if !expired}
										<div class="notification-actions">
											<Button
												variant="secondary"
												size="small"
												onclick={() => handleRejectInvitation(invitation.id)}
												disabled={isProcessing}
											>
												{isProcessing && rejectMutation.isPending ? 'Declining...' : 'Decline'}
											</Button>
											<Button
												variant="primary"
												size="small"
												onclick={() => handleAcceptInvitation(invitation.id)}
												disabled={isProcessing}
											>
												{isProcessing && acceptMutation.isPending ? 'Joining...' : 'Accept'}
											</Button>
										</div>
									{/if}
								</div>
							{/if}
						{/each}
					</div>
				</div>
			{/if}
		{/if}
	</ModalBody>
</Dialog>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: spacing.$unit;
		padding: spacing.$unit-4x;
		color: var(--text-secondary);

		:global(svg) {
			animation: spin 1s linear infinite;
		}

		p {
			margin: 0;
		}
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: spacing.$unit;
		padding: spacing.$unit-4x;
		text-align: center;
		color: var(--text-secondary);

		:global(svg) {
			opacity: 0.5;
		}

		p {
			margin: 0;
		}

		.hint {
			font-size: typography.$font-small;
			opacity: 0.8;
		}
	}

	.section {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x;

		&:not(:first-child) {
			margin-top: spacing.$unit-3x;
			padding-top: spacing.$unit-3x;
			border-top: 1px solid var(--border-color);
		}
	}

	.section-title {
		font-size: typography.$font-regular;
		font-weight: typography.$medium;
		color: var(--text-primary);
		margin: 0;
	}

	.section-description {
		margin: 0 0 spacing.$unit-2x 0;
		font-size: typography.$font-small;
		color: var(--text-secondary);
	}

	.notifications-list {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
	}

	.notification-card {
		background: var(--surface-secondary, #f9fafb);
		border: 1px solid var(--border-color);
		border-radius: layout.$input-corner;
		padding: spacing.$unit-2x;

		&.expired {
			opacity: 0.6;
		}
	}

	.notification-content {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: spacing.$unit-2x;
		margin-bottom: spacing.$unit;
	}

	.notification-info {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-quarter;
	}

	.notification-title-row {
		display: flex;
		align-items: baseline;
		gap: spacing.$unit-half;
	}

	.notification-title {
		font-weight: typography.$medium;
		color: var(--text-primary);
	}

	.gamertag {
		color: var(--text-secondary);
		font-size: typography.$font-small;
	}

	.notification-subtitle {
		font-size: typography.$font-small;
		color: var(--text-secondary);
	}

	.notification-meta {
		font-size: typography.$font-tiny;
		color: var(--text-tertiary);
	}

	.expires-info {
		font-size: typography.$font-tiny;
		color: var(--text-secondary);
		white-space: nowrap;
	}

	.expired-badge {
		font-size: typography.$font-tiny;
		color: colors.$error;
		background: colors.$error--bg--light;
		padding: spacing.$unit-quarter spacing.$unit-half;
		border-radius: layout.$item-corner-small;
		font-weight: typography.$medium;
	}

	.notification-actions {
		display: flex;
		justify-content: flex-end;
		gap: spacing.$unit;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style>
