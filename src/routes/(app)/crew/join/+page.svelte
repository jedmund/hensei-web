
<script lang="ts">
	import { page } from '$app/stores'
	import { goto } from '$app/navigation'
	import { createQuery } from '@tanstack/svelte-query'
	import { crewQueries } from '$lib/api/queries/crew.queries'
	import { useAcceptInvitation, useRejectInvitation } from '$lib/api/mutations/crew.mutations'
	import { crewStore } from '$lib/stores/crew.store.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import { formatDate } from '$lib/utils/date'
	import type { PageData } from './$types'
	import { toast } from 'svelte-sonner'
	import { extractErrorMessage } from '$lib/utils/errors'

	interface Props {
		data: PageData
	}

	let { data }: Props = $props()

	// Check if user already has a crew - redirect to crew page
	$effect(() => {
		if (crewStore.isInCrew && !crewStore.isLoading) {
			goto('/crew')
		}
	})

	// Get invitation ID from URL if present
	const selectedInvitationId = $derived($page.url.searchParams.get('invitation'))

	// Query for pending invitations
	const invitationsQuery = createQuery(() => crewQueries.pendingInvitations())

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
			// Successfully joined - redirect to crew
			goto('/crew')
		} catch (error) {
			console.error('Failed to accept invitation:', error)
			toast.error(extractErrorMessage(error, 'Failed to accept invitation'))
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
			toast.error(extractErrorMessage(error, 'Failed to reject invitation'))
			processingId = null
		}
	}

	// Check if invitation is expired
	function isExpired(expiresAt: string): boolean {
		return new Date(expiresAt) < new Date()
	}
</script>

<svelte:head>
	<title>Join Crew / granblue.team</title>
</svelte:head>

<div class="join-page">
	<header class="page-header">
		<h1>Join a Crew</h1>
		<p class="description">Accept an invitation to join a crew.</p>
	</header>

	{#if invitationsQuery.isLoading}
		<div class="loading-state">
			<p>Loading invitations...</p>
		</div>
	{:else if invitationsQuery.isError}
		<div class="error-state">
			<p>Failed to load invitations</p>
		</div>
	{:else if !invitationsQuery.data || invitationsQuery.data.length === 0}
		<div class="empty-state">
			<p>You don't have any pending invitations.</p>
			<p class="hint">
				Ask a crew captain or vice captain to send you an invitation.
			</p>
			<Button variant="secondary" onclick={() => goto('/crew')}>
				Go Back
			</Button>
		</div>
	{:else}
		<div class="invitations-list">
			{#each invitationsQuery.data as invitation}
				{@const expired = isExpired(invitation.expiresAt)}
				{@const highlighted = invitation.id === selectedInvitationId}
				{@const crew = invitation.crew}
				{@const invitedBy = invitation.invitedBy}

				{#if crew && invitedBy}
					<div class="invitation-card" class:highlighted class:expired>
						<div class="invitation-header">
							<h2 class="crew-name">{crew.name}</h2>
							{#if crew.gamertag}
								<span class="gamertag">[{crew.gamertag}]</span>
							{/if}
						</div>

						{#if 'description' in crew && crew.description}
							<p class="crew-description">{crew.description}</p>
						{/if}

						<div class="invitation-meta">
							<span class="invited-by">
								Invited by <strong>{invitedBy.username}</strong>
							</span>
							<span class="invited-date">
								{formatDate(invitation.createdAt)}
							</span>
						</div>

						{#if invitation.phantomPlayer}
							<div class="phantom-assignment">
								Phantom assigned: <strong>{invitation.phantomPlayer.name}</strong>
								{#if invitation.phantomPlayer.granblueId}
									<span class="granblue-id">({invitation.phantomPlayer.granblueId})</span>
								{/if}
							</div>
						{/if}

						{#if 'memberCount' in crew && crew.memberCount !== undefined}
							<div class="crew-stats">
								<span class="stat">
									{crew.memberCount} member{crew.memberCount === 1 ? '' : 's'}
								</span>
							</div>
						{/if}

					{#if expired}
						<div class="expired-notice">
							This invitation has expired.
						</div>
					{:else}
						<div class="expires-notice">
							Expires: {formatDate(invitation.expiresAt)}
						</div>

						<div class="invitation-actions">
							<Button
								variant="secondary"
								size="small"
								onclick={() => handleReject(invitation.id)}
								disabled={processingId === invitation.id}
							>
								{processingId === invitation.id && rejectMutation.isPending ? 'Declining...' : 'Decline'}
							</Button>
							<Button
								variant="primary"
								size="small"
								onclick={() => handleAccept(invitation.id)}
								disabled={processingId === invitation.id}
							>
								{processingId === invitation.id && acceptMutation.isPending ? 'Joining...' : 'Accept'}
							</Button>
						</div>
					{/if}
					</div>
				{/if}
			{/each}
		</div>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.join-page {
		max-width: 600px;
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

	.loading-state,
	.error-state {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 200px;
		color: var(--text-secondary);
	}

	.empty-state {
		text-align: center;
		padding: spacing.$unit-4x spacing.$unit-2x;
		background: var(--surface);
		border: 1px solid var(--border-color);
		border-radius: layout.$input-corner;

		p {
			margin-bottom: spacing.$unit;
		}

		.hint {
			color: var(--text-secondary);
			font-size: 0.875rem;
			margin-bottom: spacing.$unit-2x;
		}
	}

	.invitations-list {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x;
	}

	.invitation-card {
		background: var(--surface);
		border: 1px solid var(--border-color);
		border-radius: layout.$input-corner;
		padding: spacing.$unit-2x;
		transition: border-color 0.2s;

		&.highlighted {
			border-color: var(--color-blue, #3b82f6);
			box-shadow: 0 0 0 3px var(--color-blue-light, rgba(59, 130, 246, 0.1));
		}

		&.expired {
			opacity: 0.6;
		}
	}

	.invitation-header {
		display: flex;
		align-items: baseline;
		gap: spacing.$unit;
		margin-bottom: spacing.$unit;
	}

	.crew-name {
		font-size: 1.25rem;
		margin: 0;
	}

	.gamertag {
		color: var(--text-secondary);
		font-size: 0.875rem;
	}

	.crew-description {
		color: var(--text-secondary);
		margin-bottom: spacing.$unit-2x;
		line-height: 1.5;
	}

	.invitation-meta {
		display: flex;
		gap: spacing.$unit-2x;
		font-size: 0.875rem;
		color: var(--text-secondary);
		margin-bottom: spacing.$unit;
	}

	.crew-stats {
		font-size: 0.875rem;
		color: var(--text-secondary);
		margin-bottom: spacing.$unit-2x;
	}

	.expired-notice {
		color: var(--color-red, #dc2626);
		font-size: 0.875rem;
		padding: spacing.$unit;
		background: var(--color-red-light, #fef2f2);
		border-radius: layout.$item-corner-small;
	}

	.phantom-assignment {
		font-size: 0.875rem;
		color: var(--text-secondary);
		margin-bottom: spacing.$unit;

		.granblue-id {
			color: var(--text-tertiary);
		}
	}

	.expires-notice {
		font-size: 0.75rem;
		color: var(--text-secondary);
		margin-bottom: spacing.$unit-2x;
	}

	.invitation-actions {
		display: flex;
		justify-content: flex-end;
		gap: spacing.$unit;
	}
</style>
