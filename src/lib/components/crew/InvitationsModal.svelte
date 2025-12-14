<svelte:options runes={true} />

<script lang="ts">
	import { goto } from '$app/navigation'
	import { useAcceptInvitation, useRejectInvitation } from '$lib/api/mutations/crew.mutations'
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import ModalHeader from '$lib/components/ui/ModalHeader.svelte'
	import ModalBody from '$lib/components/ui/ModalBody.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import type { CrewInvitation } from '$lib/types/api/crew'

	interface Props {
		open: boolean
		invitations: CrewInvitation[]
		isLoading?: boolean
	}

	let { open = $bindable(false), invitations, isLoading = false }: Props = $props()

	// Mutations
	const acceptMutation = useAcceptInvitation()
	const rejectMutation = useRejectInvitation()

	// Track which invitation is being processed
	let processingId = $state<string | null>(null)

	// Accept invitation
	async function handleAccept(invitationId: string) {
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
	async function handleReject(invitationId: string) {
		processingId = invitationId
		try {
			await rejectMutation.mutateAsync(invitationId)
			processingId = null
		} catch (error) {
			console.error('Failed to reject invitation:', error)
			processingId = null
		}
	}

	// Format date
	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		})
	}

	// Check if invitation is expired
	function isExpired(expiresAt: string): boolean {
		return new Date(expiresAt) < new Date()
	}
</script>

<Dialog bind:open>
	<ModalHeader title="Crew Invitations" description="Accept or decline pending invitations" />

	<ModalBody>
		{#if isLoading}
			<div class="loading-state">
				<Icon name="loader-2" size={24} />
				<p>Loading invitations...</p>
			</div>
		{:else if invitations.length === 0}
			<div class="empty-state">
				<Icon name="mail" size={32} />
				<p>No pending invitations</p>
				<p class="hint">You'll see crew invitations here when you receive them.</p>
			</div>
		{:else}
			<div class="invitations-list">
				{#each invitations as invitation}
					{@const expired = isExpired(invitation.expiresAt)}
					{@const crew = invitation.crew}
					{@const invitedBy = invitation.invitedBy}
					{@const isProcessing = processingId === invitation.id}

					{#if crew}
						<div class="invitation-card" class:expired>
							<div class="invitation-content">
								<div class="crew-info">
									<div class="crew-name-row">
										<span class="crew-name">{crew.name}</span>
										{#if crew.gamertag}
											<span class="gamertag">[{crew.gamertag}]</span>
										{/if}
									</div>
									{#if invitedBy}
										<span class="invited-by">
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
								<div class="invitation-actions">
									<Button
										variant="secondary"
										size="small"
										onclick={() => handleReject(invitation.id)}
										disabled={isProcessing}
									>
										{isProcessing && rejectMutation.isPending ? 'Declining...' : 'Decline'}
									</Button>
									<Button
										variant="primary"
										size="small"
										onclick={() => handleAccept(invitation.id)}
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
		{/if}
	</ModalBody>
</Dialog>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

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

	.invitations-list {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
	}

	.invitation-card {
		background: var(--surface-secondary, #f9fafb);
		border: 1px solid var(--border-color);
		border-radius: 8px;
		padding: spacing.$unit-2x;

		&.expired {
			opacity: 0.6;
		}
	}

	.invitation-content {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: spacing.$unit-2x;
		margin-bottom: spacing.$unit;
	}

	.crew-info {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-quarter;
	}

	.crew-name-row {
		display: flex;
		align-items: baseline;
		gap: spacing.$unit-half;
	}

	.crew-name {
		font-weight: typography.$medium;
		color: var(--text-primary);
	}

	.gamertag {
		color: var(--text-secondary);
		font-size: typography.$font-small;
	}

	.invited-by {
		font-size: typography.$font-small;
		color: var(--text-secondary);
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
		border-radius: 4px;
		font-weight: typography.$medium;
	}

	.invitation-actions {
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
