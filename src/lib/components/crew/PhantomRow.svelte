<svelte:options runes={true} />

<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte'
	import DropdownMenu from '$lib/components/ui/DropdownMenu.svelte'
	import { DropdownMenu as DropdownMenuBase } from 'bits-ui'
	import { crewStore } from '$lib/stores/crew.store.svelte'
	import { formatDate } from '$lib/utils/date'
	import type { PhantomPlayer } from '$lib/types/api/crew'

	interface Props {
		phantom: PhantomPlayer
		currentUserId?: string
		onEdit?: () => void
		onDelete?: () => void
		onAssign?: () => void
		onAccept?: () => void
		onDecline?: () => void
	}

	const { phantom, currentUserId, onEdit, onDelete, onAssign, onAccept, onDecline }: Props =
		$props()

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
</script>

<li class="phantom-row" class:retired={phantom.retired}>
	<div class="phantom-info">
		<div class="phantom-details">
			<span class="name">{phantom.name}</span>
			{#if phantom.granblueId}
				<span class="granblue-id">ID: {phantom.granblueId}</span>
			{/if}
			{#if phantom.joinedAt}
				<span class="joined-date">Joined {formatDate(phantom.joinedAt)}</span>
			{/if}
		</div>
	</div>

	<div class="phantom-actions">
		{#if claimStatus === 'unclaimed'}
			<span class="status-badge unclaimed">Unclaimed</span>
		{:else if claimStatus === 'pending'}
			<span class="status-badge pending">Pending: {phantom.claimedBy?.username}</span>
		{:else if claimStatus === 'claimed'}
			<span class="status-badge claimed">Claimed by {phantom.claimedBy?.username}</span>
		{/if}

		{#if crewStore.isOfficer}
			<!-- Officers get dropdown menu -->
			<DropdownMenu>
				{#snippet trigger({ props })}
					<Button variant="ghost" size="small" iconOnly icon="ellipsis" {...props} />
				{/snippet}
				{#snippet menu()}
					{#if onEdit}
						<DropdownMenuBase.Item class="dropdown-menu-item" onclick={onEdit}>
							Edit
						</DropdownMenuBase.Item>
					{/if}
					{#if claimStatus === 'unclaimed' && onAssign}
						<DropdownMenuBase.Item class="dropdown-menu-item" onclick={onAssign}>
							Assign to...
						</DropdownMenuBase.Item>
					{/if}
					{#if onDelete}
						<DropdownMenuBase.Separator class="dropdown-menu-separator" />
						<DropdownMenuBase.Item class="dropdown-menu-item danger" onclick={onDelete}>
							Delete
						</DropdownMenuBase.Item>
					{/if}
				{/snippet}
			</DropdownMenu>
		{:else if canClaim}
			<!-- Non-officers who can accept/decline get two buttons -->
			<div class="claim-buttons">
				{#if onDecline}
					<Button variant="secondary" size="small" onclick={onDecline}>
						Decline
					</Button>
				{/if}
				{#if onAccept}
					<Button variant="primary" size="small" onclick={onAccept}>
						Accept
					</Button>
				{/if}
			</div>
		{/if}
	</div>
</li>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.phantom-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: spacing.$unit spacing.$unit spacing.$unit spacing.$unit-2x;
		border-radius: layout.$item-corner;
		transition: background-color 0.15s;

		&:hover {
			background: rgba(0, 0, 0, 0.03);
		}

		&.retired {
			opacity: 0.6;
		}
	}

	.phantom-info {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
	}

	.phantom-details {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.name {
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		color: var(--text-primary);
	}

	.granblue-id {
		font-size: typography.$font-small;
		color: var(--text-secondary);
	}

	.joined-date {
		font-size: typography.$font-small;
		color: var(--text-tertiary);
	}

	.phantom-actions {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
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
</style>
