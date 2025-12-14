<svelte:options runes={true} />

<script lang="ts">
	import { page } from '$app/stores'
	import { goto } from '$app/navigation'
	import { createQuery, useQueryClient } from '@tanstack/svelte-query'
	import { crewQueries } from '$lib/api/queries/crew.queries'
	import {
		useRemoveMember,
		useUpdateMembership,
		useDeletePhantom
	} from '$lib/api/mutations/crew.mutations'
	import { crewAdapter } from '$lib/api/adapters/crew.adapter'
	import { crewStore } from '$lib/stores/crew.store.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import DropdownMenu from '$lib/components/ui/DropdownMenu.svelte'
	import ModalHeader from '$lib/components/ui/ModalHeader.svelte'
	import ModalBody from '$lib/components/ui/ModalBody.svelte'
	import ModalFooter from '$lib/components/ui/ModalFooter.svelte'
	import CrewHeader from '$lib/components/crew/CrewHeader.svelte'
	import ScoutUserModal from '$lib/components/crew/ScoutUserModal.svelte'
	import BulkPhantomModal from '$lib/components/crew/BulkPhantomModal.svelte'
	import { DropdownMenu as DropdownMenuBase } from 'bits-ui'
	import type { MemberFilter, CrewMembership, PhantomPlayer, CrewInvitation } from '$lib/types/api/crew'
	import type { PageData } from './$types'

	interface Props {
		data: PageData
	}

	let { data }: Props = $props()

	const queryClient = useQueryClient()

	// Get filter from URL
	const filter = $derived<MemberFilter>(
		($page.url.searchParams.get('filter') as MemberFilter) || 'all'
	)

	// Query for members based on filter
	const membersQuery = createQuery(() => crewQueries.members(filter))

	// Query for active members (needed for roster cap check regardless of current filter)
	const activeQuery = createQuery(() => ({
		...crewQueries.members('active'),
		enabled: filter !== 'active' // Only fetch separately if not already viewing active
	}))

	// Query for pending invitations (officers only)
	const invitationsQuery = createQuery(() => ({
		...crewQueries.crewInvitations(crewStore.crew?.id ?? ''),
		enabled: crewStore.isOfficer && !!crewStore.crew?.id
	}))

	// Calculate total active roster size (members + phantoms)
	const activeRosterSize = $derived.by(() => {
		// Use active filter data if viewing active, otherwise use dedicated query
		const activeMembers =
			filter === 'active'
				? (membersQuery.data?.members ?? [])
				: (activeQuery.data?.members ?? [])
		const activePhantoms =
			filter === 'active'
				? (membersQuery.data?.phantoms ?? [])
				: (activeQuery.data?.phantoms ?? [])

		const activeMemberCount = activeMembers.filter((m) => !m.retired).length
		const activePhantomCount = activePhantoms.filter((p) => !p.retired).length
		return activeMemberCount + activePhantomCount
	})

	const isRosterFull = $derived(activeRosterSize >= 30)

	// Mutations
	const removeMemberMutation = useRemoveMember()
	const updateMembershipMutation = useUpdateMembership()
	const deletePhantomMutation = useDeletePhantom()

	// Filter options
	const filterOptions: { value: MemberFilter; label: string }[] = [
		{ value: 'all', label: 'All' },
		{ value: 'active', label: 'Active' },
		{ value: 'phantom', label: 'Phantoms' },
		{ value: 'retired', label: 'Retired' }
	]

	// Change filter
	function handleFilterChange(newFilter: MemberFilter) {
		const url = new URL($page.url)
		if (newFilter === 'all') {
			url.searchParams.delete('filter')
		} else {
			url.searchParams.set('filter', newFilter)
		}
		goto(url.toString(), { replaceState: true })
	}

	// Dialog state for member actions
	let confirmDialogOpen = $state(false)
	let confirmAction = $state<'remove' | 'promote' | 'demote' | null>(null)
	let selectedMember = $state<CrewMembership | null>(null)

	// Dialog state for editing join date
	let editJoinDateDialogOpen = $state(false)
	let editingMember = $state<CrewMembership | null>(null)
	let editingPhantom = $state<PhantomPlayer | null>(null)
	let editJoinDate = $state('')

	// Dialog state for scout modal
	let scoutModalOpen = $state(false)

	// Pending invitations section visibility
	let invitationsSectionOpen = $state(true)

	// Dialog state for phantom creation
	let bulkPhantomDialogOpen = $state(false)

	// Dialog state for phantom deletion confirmation
	let deletePhantomDialogOpen = $state(false)
	let phantomToDelete = $state<PhantomPlayer | null>(null)

	// Role display helpers
	function getRoleLabel(role: string): string {
		switch (role) {
			case 'captain':
				return 'Captain'
			case 'vice_captain':
				return 'Vice Captain'
			default:
				return 'Member'
		}
	}

	function getRoleClass(role: string): string {
		switch (role) {
			case 'captain':
				return 'captain'
			case 'vice_captain':
				return 'officer'
			default:
				return ''
		}
	}

	// Member actions
	function openRemoveDialog(member: CrewMembership) {
		selectedMember = member
		confirmAction = 'remove'
		confirmDialogOpen = true
	}

	function openPromoteDialog(member: CrewMembership) {
		selectedMember = member
		confirmAction = 'promote'
		confirmDialogOpen = true
	}

	function openDemoteDialog(member: CrewMembership) {
		selectedMember = member
		confirmAction = 'demote'
		confirmDialogOpen = true
	}

	async function handleConfirmAction() {
		if (!selectedMember || !crewStore.crew) return

		try {
			if (confirmAction === 'remove') {
				await removeMemberMutation.mutateAsync({
					crewId: crewStore.crew.id,
					membershipId: selectedMember.id
				})
			} else if (confirmAction === 'promote') {
				await updateMembershipMutation.mutateAsync({
					crewId: crewStore.crew.id,
					membershipId: selectedMember.id,
					input: { role: 'vice_captain' }
				})
			} else if (confirmAction === 'demote') {
				await updateMembershipMutation.mutateAsync({
					crewId: crewStore.crew.id,
					membershipId: selectedMember.id,
					input: { role: 'member' }
				})
			}
		} catch (error) {
			console.error('Action failed:', error)
		}

		confirmDialogOpen = false
		selectedMember = null
		confirmAction = null
	}

	// Join date editing
	function openEditJoinDateDialog(member: CrewMembership) {
		editingMember = member
		editingPhantom = null
		// Format date for input
		editJoinDate = member.joinedAt ? member.joinedAt.split('T')[0] ?? '' : ''
		editJoinDateDialogOpen = true
	}

	function openEditPhantomJoinDateDialog(phantom: PhantomPlayer) {
		editingPhantom = phantom
		editingMember = null
		editJoinDate = phantom.joinedAt ? phantom.joinedAt.split('T')[0] ?? '' : ''
		editJoinDateDialogOpen = true
	}

	async function handleSaveJoinDate() {
		if (!crewStore.crew) return

		try {
			if (editingMember) {
				await updateMembershipMutation.mutateAsync({
					crewId: crewStore.crew.id,
					membershipId: editingMember.id,
					input: { joinedAt: editJoinDate }
				})
			} else if (editingPhantom) {
				// Call the phantom update directly through the adapter
				await crewAdapter.updatePhantom(crewStore.crew.id, editingPhantom.id, {
					joinedAt: editJoinDate
				})
				// Invalidate members query
				membersQuery.refetch()
			}
			// Invalidate GW event queries since membersDuringEvent depends on join dates
			queryClient.invalidateQueries({ queryKey: ['crew', 'gw'] })
		} catch (error) {
			console.error('Failed to update join date:', error)
		}

		editJoinDateDialogOpen = false
		editingMember = null
		editingPhantom = null
		editJoinDate = ''
	}

	function openDeletePhantomDialog(phantom: PhantomPlayer) {
		phantomToDelete = phantom
		deletePhantomDialogOpen = true
	}

	async function handleConfirmDeletePhantom() {
		if (!crewStore.crew || !phantomToDelete) return

		try {
			await deletePhantomMutation.mutateAsync({
				crewId: crewStore.crew.id,
				phantomId: phantomToDelete.id
			})
		} catch (error) {
			console.error('Failed to delete phantom:', error)
		}

		deletePhantomDialogOpen = false
		phantomToDelete = null
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
	function isInvitationExpired(expiresAt: string): boolean {
		return new Date(expiresAt) < new Date()
	}

	// Get pending (non-expired) invitations count
	const pendingInvitationsCount = $derived(
		invitationsQuery.data?.filter((inv) => !isInvitationExpired(inv.expiresAt)).length ?? 0
	)
</script>

<svelte:head>
	<title>Crew Members | Hensei</title>
</svelte:head>

<div class="page">
	<div class="card">
		<CrewHeader title="Members">
			{#snippet belowTitle()}
				<div class="filter-tabs">
					{#each filterOptions as option}
						<button
							class="filter-tab"
							class:active={filter === option.value}
							onclick={() => handleFilterChange(option.value)}
						>
							{option.label}
						</button>
					{/each}
				</div>
			{/snippet}
			{#snippet actions()}
				{#if crewStore.isOfficer}
					<Button
						variant="secondary"
						size="small"
						disabled={isRosterFull}
						onclick={() => (scoutModalOpen = true)}
					>
						Scout
					</Button>
					<DropdownMenu>
						{#snippet trigger({ props })}
							<Button variant="secondary" size="small" iconOnly icon="ellipsis" {...props} />
						{/snippet}
						{#snippet menu()}
							<DropdownMenuBase.Item
								class="dropdown-menu-item"
								onclick={() => (bulkPhantomDialogOpen = true)}
							>
								Add phantoms...
							</DropdownMenuBase.Item>
						{/snippet}
					</DropdownMenu>
				{/if}
			{/snippet}
		</CrewHeader>

		<!-- Pending Invitations Section (officers only) -->
		{#if crewStore.isOfficer && invitationsQuery.data && invitationsQuery.data.length > 0}
			<div class="invitations-section">
				<button
					class="invitations-header"
					onclick={() => (invitationsSectionOpen = !invitationsSectionOpen)}
				>
					<span class="invitations-title">
						Pending Invitations
						{#if pendingInvitationsCount > 0}
							<span class="invitations-count">{pendingInvitationsCount}</span>
						{/if}
					</span>
					<span class="toggle-icon" class:open={invitationsSectionOpen}>▼</span>
				</button>

				{#if invitationsSectionOpen}
					<ul class="invitations-list">
						{#each invitationsQuery.data as invitation}
							{@const expired = isInvitationExpired(invitation.expiresAt)}
							<li class="invitation-item" class:expired>
								<div class="invitation-info">
									<span class="invited-user">{invitation.user?.username ?? 'Unknown'}</span>
									{#if invitation.invitedBy}
										<span class="invited-by">
											Invited by {invitation.invitedBy.username}
										</span>
									{/if}
								</div>
								<div class="invitation-status">
									{#if expired}
										<span class="status-badge expired">Expired</span>
									{:else}
										<span class="expires-text">Expires {formatDate(invitation.expiresAt)}</span>
									{/if}
								</div>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		{/if}

		{#if membersQuery.isLoading}
			<div class="loading-state">
				<p>Loading...</p>
			</div>
		{:else if membersQuery.isError}
			<div class="error-state">
				<p>Failed to load members</p>
			</div>
		{:else}
			<!-- Regular members -->
			{#if membersQuery.data?.members && membersQuery.data.members.length > 0}
				<ul class="member-list">
					{#each membersQuery.data.members as member}
						<li class="member-item" class:retired={member.retired}>
							<div class="member-info">
								<span class="username">{member.user?.username ?? 'Unknown'}</span>
								<span class="role-badge {getRoleClass(member.role)}">
									{getRoleLabel(member.role)}
								</span>
								{#if member.joinedAt}
									<span class="joined-date">Joined {formatDate(member.joinedAt)}</span>
								{/if}
							</div>
							{#if crewStore.isOfficer}
								<DropdownMenu>
									{#snippet trigger({ props })}
										<Button variant="secondary" size="small" iconOnly icon="ellipsis" {...props} />
									{/snippet}
									{#snippet menu()}
										<DropdownMenuBase.Item
											class="dropdown-menu-item"
											onclick={() => openEditJoinDateDialog(member)}
										>
											Edit
										</DropdownMenuBase.Item>
										{#if crewStore.canActOnMember(member.role) && !member.retired && member.id !== crewStore.membership?.id}
											{#if member.role === 'member' && crewStore.canPromoteTo('vice_captain')}
												<DropdownMenuBase.Item
													class="dropdown-menu-item"
													onclick={() => openPromoteDialog(member)}
												>
													Promote
												</DropdownMenuBase.Item>
											{/if}
											{#if member.role === 'vice_captain' && crewStore.canDemote('vice_captain')}
												<DropdownMenuBase.Item
													class="dropdown-menu-item"
													onclick={() => openDemoteDialog(member)}
												>
													Demote
												</DropdownMenuBase.Item>
											{/if}
											<DropdownMenuBase.Item
												class="dropdown-menu-item danger"
												onclick={() => openRemoveDialog(member)}
											>
												Remove
											</DropdownMenuBase.Item>
										{/if}
									{/snippet}
								</DropdownMenu>
							{/if}
						</li>
					{/each}
				</ul>
			{:else if filter !== 'phantom'}
				<p class="empty-state">No members found</p>
			{/if}

			<!-- Phantom players -->
			{#if membersQuery.data?.phantoms && membersQuery.data.phantoms.length > 0}
				{#if filter === 'all' && membersQuery.data.members.length > 0}
					<div class="section-divider">
						<span>Phantom Players</span>
					</div>
				{/if}
				<ul class="member-list">
					{#each membersQuery.data.phantoms as phantom}
						<li class="member-item" class:retired={phantom.retired}>
							<div class="member-info">
								<div class="phantom-details">
									<span class="username">{phantom.name}</span>
									{#if phantom.granblueId}
										<span class="granblue-id">ID: {phantom.granblueId}</span>
									{/if}
									{#if phantom.joinedAt}
										<span class="joined-date">Joined {formatDate(phantom.joinedAt)}</span>
									{/if}
								</div>
								{#if phantom.claimConfirmed && phantom.claimedBy}
									<span class="status-badge claimed">
										Claimed by {phantom.claimedBy.username}
									</span>
								{:else if phantom.claimedBy}
									<span class="status-badge pending">
										Pending: {phantom.claimedBy.username}
									</span>
								{:else}
									<span class="status-badge unclaimed">Unclaimed</span>
								{/if}
							</div>
							{#if crewStore.isOfficer}
								<DropdownMenu>
									{#snippet trigger({ props })}
										<Button variant="secondary" size="small" iconOnly icon="ellipsis" {...props} />
									{/snippet}
									{#snippet menu()}
										<DropdownMenuBase.Item
											class="dropdown-menu-item"
											onclick={() => openEditPhantomJoinDateDialog(phantom)}
										>
											Edit
										</DropdownMenuBase.Item>
										<DropdownMenuBase.Item
											class="dropdown-menu-item danger"
											onclick={() => openDeletePhantomDialog(phantom)}
										>
											Delete
										</DropdownMenuBase.Item>
									{/snippet}
								</DropdownMenu>
							{/if}
						</li>
					{/each}
				</ul>
			{:else if filter === 'phantom'}
				<div class="empty-state">
					<p>No phantom players.</p>
					{#if crewStore.isOfficer}
						<Button variant="secondary" size="small" onclick={() => (bulkPhantomDialogOpen = true)}>
							Add phantoms...
						</Button>
					{/if}
				</div>
			{/if}
		{/if}
	</div>
</div>

<!-- Confirm Action Dialog -->
<Dialog bind:open={confirmDialogOpen}>
	{#snippet children()}
		<ModalHeader
			title={confirmAction === 'remove'
				? 'Remove Member'
				: confirmAction === 'promote'
					? 'Promote to Vice Captain'
					: 'Demote to Member'}
		/>

		<ModalBody>
			<p class="confirm-message">
				{#if confirmAction === 'remove'}
					Are you sure you want to remove {selectedMember?.user?.username ?? 'this member'} from the
					crew?
				{:else if confirmAction === 'promote'}
					Promote {selectedMember?.user?.username ?? 'this member'} to Vice Captain?
				{:else if confirmAction === 'demote'}
					Demote {selectedMember?.user?.username ?? 'this member'} from Vice Captain to Member?
				{/if}
			</p>
		</ModalBody>

		<ModalFooter
			onCancel={() => (confirmDialogOpen = false)}
			primaryAction={{
				label: confirmAction === 'remove' ? 'Remove' : confirmAction === 'promote' ? 'Promote' : 'Demote',
				onclick: handleConfirmAction,
				destructive: confirmAction === 'remove'
			}}
		/>
	{/snippet}
</Dialog>

<!-- Edit Join Date Dialog -->
<Dialog bind:open={editJoinDateDialogOpen}>
	{#snippet children()}
		<ModalHeader title="Edit player" />

		<ModalBody>
			<div class="modal-form">
				<div class="form-fields">
					<div class="form-field">
						<label for="joinDate">Join date</label>
						<input id="joinDate" type="date" bind:value={editJoinDate} class="date-input" />
					</div>
					<p class="help-text">
						This date is used to determine which events a member was active for when adding
						historical GW scores.
					</p>
				</div>
			</div>
		</ModalBody>

		<ModalFooter
			onCancel={() => (editJoinDateDialogOpen = false)}
			primaryAction={{
				label: 'Save',
				onclick: handleSaveJoinDate,
				disabled: !editJoinDate
			}}
		/>
	{/snippet}
</Dialog>

<!-- Delete Phantom Confirmation Dialog -->
<Dialog bind:open={deletePhantomDialogOpen}>
	{#snippet children()}
		<ModalHeader title="Delete Phantom Player" />

		<ModalBody>
			<p class="confirm-message">
				Are you sure you want to delete {phantomToDelete?.name ?? 'this phantom player'}? This
				action cannot be undone.
			</p>
		</ModalBody>

		<ModalFooter
			onCancel={() => (deletePhantomDialogOpen = false)}
			primaryAction={{
				label: 'Delete',
				onclick: handleConfirmDeletePhantom,
				destructive: true
			}}
		/>
	{/snippet}
</Dialog>

<!-- Scout User Modal -->
{#if crewStore.crew?.id}
	<ScoutUserModal bind:open={scoutModalOpen} crewId={crewStore.crew.id} />
	<BulkPhantomModal bind:open={bulkPhantomDialogOpen} crewId={crewStore.crew.id} />
{/if}

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/effects' as effects;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.page {
		padding: spacing.$unit-2x 0;
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

	.filter-tabs {
		display: flex;
		gap: spacing.$unit-half;
	}

	.filter-tab {
		padding: 4px spacing.$unit;
		background: none;
		border: none;
		border-radius: layout.$item-corner-small;
		color: var(--text-secondary);
		cursor: pointer;
		font-size: typography.$font-small;
		transition:
			color 0.15s,
			background-color 0.15s;

		&:hover {
			color: var(--text-primary);
			background: rgba(0, 0, 0, 0.04);
		}

		&.active {
			color: var(--text-primary);
			background: rgba(0, 0, 0, 0.06);
			font-weight: typography.$medium;
		}
	}

	.loading-state,
	.error-state {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: spacing.$unit-4x;
		color: var(--text-secondary);
		font-size: typography.$font-small;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: spacing.$unit-2x;
		text-align: center;
		color: var(--text-secondary);
		padding: spacing.$unit-4x;
		font-size: typography.$font-small;

		p {
			margin: 0;
		}
	}

	.member-list {
		list-style: none;
		margin: 0;
		padding: spacing.$unit;
	}

	.member-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: spacing.$unit spacing.$unit-2x;
		border-radius: layout.$item-corner;
		transition: background-color 0.15s;

		&:hover {
			background: rgba(0, 0, 0, 0.03);
		}

		&.retired {
			opacity: 0.6;
		}
	}

	.member-info {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
	}

	.phantom-details {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.username {
		font-size: typography.$font-small;
		font-weight: typography.$medium;
	}

	.granblue-id {
		font-size: typography.$font-small;
		color: var(--text-secondary);
	}

	.role-badge {
		display: inline-block;
		padding: 2px 8px;
		border-radius: layout.$item-corner-small;
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		background: rgba(0, 0, 0, 0.04);

		&.captain {
			background: var(--color-gold-light, #fef3c7);
			color: var(--color-gold-dark, #92400e);
		}

		&.officer {
			background: var(--color-blue-light, #dbeafe);
			color: var(--color-blue-dark, #1e40af);
		}
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

	.section-divider {
		display: flex;
		align-items: center;
		padding: spacing.$unit spacing.$unit-2x;
		background: rgba(0, 0, 0, 0.02);
		border-bottom: 1px solid rgba(0, 0, 0, 0.06);

		span {
			font-size: typography.$font-small;
			font-weight: typography.$medium;
			color: var(--text-secondary);
		}
	}

	.action-buttons {
		display: flex;
		gap: spacing.$unit-half;
	}

	.action-btn {
		padding: 4px 8px;
		border: none;
		border-radius: layout.$item-corner-small;
		background: rgba(0, 0, 0, 0.04);
		color: var(--text-secondary);
		font-size: typography.$font-small;
		cursor: pointer;
		transition: all 0.15s;

		&:hover {
			background: rgba(0, 0, 0, 0.08);
			color: var(--text-primary);
		}

		&.danger {
			color: colors.$error;

			&:hover {
				background: rgba(colors.$error, 0.1);
			}
		}
	}

	// Confirm dialog styles
	.confirm-message {
		color: var(--text-primary);
		line-height: 1.5;
		margin: 0;
	}

	// Modal form styles
	.modal-form {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-3x;
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
			min-height: 60px;

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

	.joined-date {
		font-size: typography.$font-small;
		color: var(--text-tertiary);
	}

	.date-input {
		padding: spacing.$unit spacing.$unit-2x;
		border: none;
		border-radius: layout.$input-corner;
		font-size: typography.$font-regular;
		font-family: inherit;
		background: var(--input-bound-bg);
		color: var(--text-primary);
		width: 100%;

		&:hover {
			background: var(--input-bound-bg-hover);
		}

		&:focus {
			outline: none;
			background: var(--input-bound-bg-hover);
		}
	}

	.help-text {
		font-size: typography.$font-small;
		color: var(--text-secondary);
		margin: 0;
		line-height: 1.4;
	}

	// Pending invitations section
	.invitations-section {
		border-bottom: 1px solid rgba(0, 0, 0, 0.06);
	}

	.invitations-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		padding: spacing.$unit-2x spacing.$unit-3x;
		background: rgba(0, 0, 0, 0.02);
		border: none;
		cursor: pointer;
		transition: background-color 0.15s;

		&:hover {
			background: rgba(0, 0, 0, 0.04);
		}
	}

	.invitations-title {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		color: var(--text-secondary);
	}

	.invitations-count {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 18px;
		height: 18px;
		padding: 0 6px;
		background: colors.$error;
		color: white;
		border-radius: 9px;
		font-size: 11px;
		font-weight: typography.$medium;
	}

	.toggle-icon {
		font-size: 10px;
		color: var(--text-tertiary);
		transition: transform 0.2s;

		&.open {
			transform: rotate(180deg);
		}
	}

	.invitations-list {
		list-style: none;
		margin: 0;
		padding: spacing.$unit;
	}

	.invitation-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: spacing.$unit spacing.$unit-2x;
		border-radius: layout.$item-corner;

		&:hover {
			background: rgba(0, 0, 0, 0.02);
		}

		&.expired {
			opacity: 0.5;
		}
	}

	.invitation-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.invited-user {
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		color: var(--text-primary);
	}

	.invited-by {
		font-size: typography.$font-tiny;
		color: var(--text-tertiary);
	}

	.invitation-status {
		display: flex;
		align-items: center;
	}

	.expires-text {
		font-size: typography.$font-tiny;
		color: var(--text-tertiary);
	}

	.status-badge.expired {
		font-size: typography.$font-tiny;
		color: colors.$error;
		background: colors.$error--bg--light;
		padding: 2px 8px;
		border-radius: 4px;
		font-weight: typography.$medium;
	}
</style>
