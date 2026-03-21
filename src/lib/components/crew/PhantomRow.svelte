
<script lang="ts">
	import { goto } from '$app/navigation'
	import { localizeHref } from '$lib/paraglide/runtime'
	import Button from '$lib/components/ui/Button.svelte'
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import DropdownMenu from '$lib/components/ui/DropdownMenu.svelte'
	import ModalHeader from '$lib/components/ui/ModalHeader.svelte'
	import ModalBody from '$lib/components/ui/ModalBody.svelte'
	import ModalFooter from '$lib/components/ui/ModalFooter.svelte'
	import AssignPhantomModal from '$lib/components/crew/AssignPhantomModal.svelte'
	import ConfirmClaimModal from '$lib/components/crew/ConfirmClaimModal.svelte'
	import { DropdownMenu as DropdownMenuBase } from 'bits-ui'
	import { crewStore } from '$lib/stores/crew.store.svelte'
	import { useDeletePhantom, useDeclinePhantomClaim } from '$lib/api/mutations/crew.mutations'
	import { formatDate } from '$lib/utils/date'
	import { toast } from 'svelte-sonner'
	import { extractErrorMessage } from '$lib/utils/errors'
	import type { PhantomPlayer } from '$lib/types/api/crew'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		phantom: PhantomPlayer
		crewId: string
		currentUserId?: string
		onEdit?: () => void
	}

	const { phantom, crewId, currentUserId, onEdit }: Props = $props()

	// Mutations
	const deletePhantomMutation = useDeletePhantom()
	const declinePhantomClaimMutation = useDeclinePhantomClaim()

	// Status badge type
	type ClaimStatus = 'unclaimed' | 'pending' | 'claimed'

	const claimStatus = $derived.by((): ClaimStatus => {
		if (phantom.claimConfirmed && phantom.claimedBy) return 'claimed'
		if (phantom.claimedBy) return 'pending'
		return 'unclaimed'
	})

	// Check if current user is the one assigned to this phantom (can accept/decline)
	const canClaim = $derived(
		!!phantom.claimedBy &&
			!!currentUserId &&
			phantom.claimedBy.id === currentUserId &&
			!phantom.claimConfirmed
	)

	// Delete confirmation dialog
	let deleteDialogOpen = $state(false)

	async function handleConfirmDelete() {
		try {
			await deletePhantomMutation.mutateAsync({
				crewId,
				phantomId: phantom.id
			})
		} catch (error) {
			console.error('Failed to delete phantom:', error)
			toast.error(extractErrorMessage(error, 'Failed to delete phantom'))
		}
		deleteDialogOpen = false
	}

	// Assign phantom modal
	let assignDialogOpen = $state(false)

	// Confirm claim modal
	let confirmClaimDialogOpen = $state(false)

	// Decline claim (direct action)
	async function handleDecline() {
		try {
			await declinePhantomClaimMutation.mutateAsync({
				crewId,
				phantomId: phantom.id
			})
		} catch (error) {
			console.error('Failed to decline phantom claim:', error)
			toast.error(extractErrorMessage(error, 'Failed to decline claim'))
		}
	}
</script>

<li class="phantom-row" class:retired={phantom.retired}>
	<a href={localizeHref(`/crew/phantoms/${phantom.id}`)} class="phantom-link">
		<div class="phantom-info">
			<div class="phantom-details">
				<span class="name">{phantom.name}</span>
				{#if phantom.joinedAt}
					<span class="joined-date">{phantom.retired ? 'Retired' : 'Active'}&nbsp;&middot;&nbsp;{m.crew_joined_date({ date: formatDate(phantom.joinedAt) })}</span>
				{/if}
			</div>
		</div>
	</a>

	<div class="phantom-actions">
		{#if claimStatus === 'unclaimed'}
			<span class="status-badge unclaimed">{m.crew_phantom_unclaimed()}</span>
		{:else if claimStatus === 'pending'}
			<span class="status-badge pending">{m.crew_phantom_pending({ username: phantom.claimedBy?.username ?? '' })}</span>
		{:else if claimStatus === 'claimed'}
			<span class="status-badge claimed">{m.crew_phantom_claimed({ username: phantom.claimedBy?.username ?? '' })}</span>
		{/if}

		{#if crewStore.isOfficer}
			<!-- Officers get dropdown menu -->
			<DropdownMenu>
				{#snippet trigger({ props })}
					<Button variant="ghost" size="small" iconOnly icon="ellipsis" {...props} />
				{/snippet}
				{#snippet menu()}
					<DropdownMenuBase.Item
						class="dropdown-menu-item"
						onclick={() => goto(localizeHref(`/crew/phantoms/${phantom.id}`))}
					>
						{m.crew_view_crew_profile()}
					</DropdownMenuBase.Item>
					{#if onEdit}
						<DropdownMenuBase.Item class="dropdown-menu-item" onclick={onEdit}>
							{m.crew_edit()}
						</DropdownMenuBase.Item>
					{/if}
					{#if claimStatus === 'unclaimed'}
						<DropdownMenuBase.Item class="dropdown-menu-item" onclick={() => (assignDialogOpen = true)}>
							{m.crew_phantom_assign()}
						</DropdownMenuBase.Item>
					{/if}
					<DropdownMenuBase.Separator class="dropdown-menu-separator" />
					<DropdownMenuBase.Item class="dropdown-menu-item danger" onclick={() => (deleteDialogOpen = true)}>
						{m.crew_phantom_delete()}
					</DropdownMenuBase.Item>
				{/snippet}
			</DropdownMenu>
		{:else if canClaim}
			<!-- Non-officers who can accept/decline get two buttons -->
			<div class="claim-buttons">
				<Button variant="secondary" size="small" onclick={handleDecline}>
					{m.crew_phantom_decline()}
				</Button>
				<Button variant="primary" size="small" onclick={() => (confirmClaimDialogOpen = true)}>
					{m.crew_phantom_accept()}
				</Button>
			</div>
		{/if}
	</div>
</li>

<!-- Delete Phantom Confirmation -->
<Dialog bind:open={deleteDialogOpen}>
	{#snippet children()}
		<ModalHeader title={m.crew_delete_phantom_title()} />
		<ModalBody>
			<p class="confirm-message">
				{m.crew_confirm_delete_phantom({ name: phantom.name })}
			</p>
		</ModalBody>
		<ModalFooter
			onCancel={() => (deleteDialogOpen = false)}
			primaryAction={{
				label: m.crew_phantom_delete(),
				onclick: handleConfirmDelete,
				destructive: true
			}}
		/>
	{/snippet}
</Dialog>

<!-- Assign Phantom Modal -->
<AssignPhantomModal
	bind:open={assignDialogOpen}
	{crewId}
	{phantom}
/>

<!-- Confirm Claim Modal -->
<ConfirmClaimModal
	bind:open={confirmClaimDialogOpen}
	{crewId}
	{phantom}
/>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.phantom-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-radius: layout.$item-corner;
		transition: background-color 0.15s;

		&:hover {
			background: rgba(0, 0, 0, 0.03);
		}

		&.retired {
			opacity: 0.6;
		}
	}

	.phantom-link {
		flex: 1;
		display: flex;
		align-items: center;
		padding: spacing.$unit spacing.$unit spacing.$unit spacing.$unit-2x;
		text-decoration: none;
		color: inherit;
	}

	.phantom-info {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
	}

	.phantom-details {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-fourth;
	}

	.name {
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		color: var(--text-primary);
	}

	.joined-date {
		font-size: typography.$font-small;
		color: var(--text-tertiary);

		.retired & {
			color: var(--text-secondary);
		}
	}

	.phantom-actions {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
		padding-right: spacing.$unit;
	}

	.claim-buttons {
		display: flex;
		gap: spacing.$unit-half;
	}

	.status-badge {
		display: inline-block;
		padding: 2px 8px;
		border-radius: layout.$item-corner-small;
		font-size: typography.$font-small;

		&.unclaimed {
			background: rgba(0, 0, 0, 0.04);
			color: var(--text-secondary);
		}

		&.pending {
			background: var(--color-yellow-light, #fef9c3);
			color: var(--color-yellow-dark, #854d0e);
		}

		&.claimed {
			background: var(--color-green-light, #dcfce7);
			color: var(--color-green-dark, #166534);
		}
	}

	.confirm-message {
		color: var(--text-primary);
		line-height: 1.5;
		margin: 0;
	}
</style>
