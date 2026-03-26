<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import { goto } from '$app/navigation'
	import {
		useAcceptInvitation,
		useRejectInvitation,
		useConfirmPhantomClaim,
		useDeclinePhantomClaim
	} from '$lib/api/mutations/crew.mutations'
	import Button from '$lib/components/ui/Button.svelte'
	import { formatDate } from '$lib/utils/date'
	import type { CrewInvitation, PhantomPlayer } from '$lib/types/api/crew'
	import { toast } from 'svelte-sonner'
	import { extractErrorMessage } from '$lib/utils/errors'

	interface Props {
		invitations?: CrewInvitation[]
		phantomClaims?: PhantomPlayer[]
		showSectionHeaders?: boolean
		onAcceptInvitation?: () => void
	}

	let {
		invitations = [],
		phantomClaims = [],
		showSectionHeaders = false,
		onAcceptInvitation
	}: Props = $props()

	// Mutations
	const acceptMutation = useAcceptInvitation()
	const rejectMutation = useRejectInvitation()
	const confirmClaimMutation = useConfirmPhantomClaim()
	const declineClaimMutation = useDeclinePhantomClaim()

	let processingId = $state<string | null>(null)

	const hasInvitations = $derived(invitations.length > 0)
	const hasPhantomClaims = $derived(phantomClaims.length > 0)

	async function handleAcceptInvitation(invitationId: string) {
		processingId = invitationId
		try {
			await acceptMutation.mutateAsync(invitationId)
			onAcceptInvitation?.()
			goto('/crew')
		} catch (error) {
			console.error('Failed to accept invitation:', error)
			toast.error(extractErrorMessage(error, 'Failed to accept invitation'))
			processingId = null
		}
	}

	async function handleRejectInvitation(invitationId: string) {
		processingId = invitationId
		try {
			await rejectMutation.mutateAsync(invitationId)
			processingId = null
		} catch (error) {
			console.error('Failed to reject invitation:', error)
			toast.error(extractErrorMessage(error, 'Failed to reject invitation'))
			processingId = null
		}
	}

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
			toast.error(extractErrorMessage(error, 'Failed to accept claim'))
			processingId = null
		}
	}

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
			toast.error(extractErrorMessage(error, 'Failed to decline claim'))
			processingId = null
		}
	}

	function isExpired(expiresAt: string): boolean {
		return new Date(expiresAt) < new Date()
	}
</script>

<!-- Phantom Claims Section -->
{#if hasPhantomClaims}
	<div class="section">
		{#if showSectionHeaders}
			<h3 class="section-title">{m.crew_notifications_phantom_section()}</h3>
			<p class="section-description">{m.crew_notifications_phantom_desc()}</p>
		{/if}
		<div class="notifications-list">
			{#each phantomClaims as phantom (phantom.id)}
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
									{m.crew_notifications_from_crew({
										name: crew.name,
										tag: crew.gamertag ? ` [${crew.gamertag}]` : ''
									})}
								</span>
								{#if phantom.joinedAt}
									<span class="notification-meta">
										{m.crew_notifications_joined({ date: formatDate(phantom.joinedAt) })}
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
								{isProcessing && declineClaimMutation.isPending
									? m.crew_notifications_declining()
									: m.crew_notifications_decline()}
							</Button>
							<Button
								variant="primary"
								size="small"
								onclick={() => handleAcceptPhantomClaim(phantom)}
								disabled={isProcessing}
							>
								{isProcessing && confirmClaimMutation.isPending
									? m.crew_notifications_accepting()
									: m.crew_notifications_accept()}
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
		{#if showSectionHeaders}
			<h3 class="section-title">{m.crew_notifications_crew_section()}</h3>
		{/if}
		<div class="notifications-list">
			{#each invitations as invitation (invitation.id)}
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
										{m.crew_invited_by({ username: invitedBy.username })}
									</span>
								{/if}
								{#if invitation.phantomPlayer}
									<span class="notification-meta">
										{m.crew_notifications_phantom_assigned({
											name: invitation.phantomPlayer.name
										})}
									</span>
								{/if}
							</div>

							{#if expired}
								<div class="expired-badge">{m.crew_expired()}</div>
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
									{isProcessing && rejectMutation.isPending
										? m.crew_notifications_declining()
										: m.crew_notifications_decline()}
								</Button>
								<Button
									variant="primary"
									size="small"
									onclick={() => handleAcceptInvitation(invitation.id)}
									disabled={isProcessing}
								>
									{isProcessing && acceptMutation.isPending
										? m.crew_notifications_joining()
										: m.crew_notifications_accept()}
								</Button>
							</div>
						{/if}
					</div>
				{/if}
			{/each}
		</div>
	</div>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

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
		color: var(--danger);
		background: var(--danger-bg);
		padding: spacing.$unit-quarter spacing.$unit-half;
		border-radius: layout.$item-corner-small;
		font-weight: typography.$medium;
	}

	.notification-actions {
		display: flex;
		justify-content: flex-end;
		gap: spacing.$unit;
	}
</style>
