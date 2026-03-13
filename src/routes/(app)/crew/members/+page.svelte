
<script lang="ts">
	import { page } from '$app/stores'
	import { goto } from '$app/navigation'
	import { createQuery, useQueryClient } from '@tanstack/svelte-query'
	import { crewQueries } from '$lib/api/queries/crew.queries'
	import {
		useRemoveMember,
		useUpdateMembership,
		useDeletePhantom,
		useDeclinePhantomClaim
	} from '$lib/api/mutations/crew.mutations'
	import { crewAdapter } from '$lib/api/adapters/crew.adapter'
	import { crewStore } from '$lib/stores/crew.store.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import DropdownMenu from '$lib/components/ui/DropdownMenu.svelte'
	import Input from '$lib/components/ui/Input.svelte'
	import DatePicker from '$lib/components/ui/DatePicker.svelte'
	import ModalHeader from '$lib/components/ui/ModalHeader.svelte'
	import ModalBody from '$lib/components/ui/ModalBody.svelte'
	import ModalFooter from '$lib/components/ui/ModalFooter.svelte'
	import SettingsRow from '$lib/components/ui/SettingsRow.svelte'
	import Switch from '$lib/components/ui/switch/Switch.svelte'
	import CrewHeader from '$lib/components/crew/CrewHeader.svelte'
	import CrewTabs from '$lib/components/crew/CrewTabs.svelte'
	import MemberRow from '$lib/components/crew/MemberRow.svelte'
	import PhantomRow from '$lib/components/crew/PhantomRow.svelte'
	import ScoutUserModal from '$lib/components/crew/ScoutUserModal.svelte'
	import BulkPhantomModal from '$lib/components/crew/BulkPhantomModal.svelte'
	import AssignPhantomModal from '$lib/components/crew/AssignPhantomModal.svelte'
	import ConfirmClaimModal from '$lib/components/crew/ConfirmClaimModal.svelte'
	import { DropdownMenu as DropdownMenuBase } from 'bits-ui'
	import { formatDate } from '$lib/utils/date'
	import type {
		MemberFilter,
		CrewMembership,
		PhantomPlayer,
		CrewInvitation
	} from '$lib/types/api/crew'
	import type { PageData } from './$types'
	import { toast } from 'svelte-sonner'
	import { extractErrorMessage } from '$lib/utils/errors'
	import * as m from '$lib/paraglide/messages'

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

	// Query for phantoms (needed for pending claims badge when viewing pending filter)
	const phantomsQuery = createQuery(() => ({
		...crewQueries.members('phantom'),
		enabled: filter === 'pending' && crewStore.isOfficer
	}))

	// Calculate active member count (real members only, not phantoms)
	// Used to determine if scouting is disabled - phantoms can be replaced by real members
	const activeMemberCount = $derived.by(() => {
		// Use active filter data if viewing active, otherwise use dedicated query
		const activeMembers =
			filter === 'active' ? (membersQuery.data?.members ?? []) : (activeQuery.data?.members ?? [])
		return activeMembers.filter((m) => !m.retired).length
	})

	const isRosterFull = $derived(activeMemberCount >= 30)

	// Mutations
	const removeMemberMutation = useRemoveMember()
	const updateMembershipMutation = useUpdateMembership()
	const deletePhantomMutation = useDeletePhantom()
	const declinePhantomClaimMutation = useDeclinePhantomClaim()

	// Filter options - Pending only shown to officers
	const filterOptions = $derived.by(() => {
		const options: { value: MemberFilter; label: string }[] = [
			{ value: 'all', label: m.crew_filter_all() },
			{ value: 'active', label: m.crew_filter_active() }
		]
		if (crewStore.isOfficer) {
			options.push({ value: 'pending', label: m.crew_filter_pending() })
		}
		options.push({ value: 'retired', label: m.crew_filter_retired() })
		return options
	})

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

	// Dialog state for editing member/phantom
	let editDialogOpen = $state(false)
	let editingMember = $state<CrewMembership | null>(null)
	let editingPhantom = $state<PhantomPlayer | null>(null)
	let editJoinDate = $state('')
	let editRetired = $state(false)
	let editRetiredAt = $state('')
	let editGranblueId = $state('')

	// Membership history for boomerang players
	interface EditableMembershipPeriod {
		id: string
		joinedAt: string
		retiredAt: string
		retired: boolean
	}
	let membershipHistory = $state<EditableMembershipPeriod[]>([])
	let loadingHistory = $state(false)

	// Dialog state for scout modal
	let scoutModalOpen = $state(false)

	// Dialog state for phantom creation
	let bulkPhantomDialogOpen = $state(false)

	// Dialog state for phantom deletion confirmation
	let deletePhantomDialogOpen = $state(false)
	let phantomToDelete = $state<PhantomPlayer | null>(null)

	// Dialog state for phantom assignment
	let assignPhantomDialogOpen = $state(false)
	let phantomToAssign = $state<PhantomPlayer | null>(null)

	// Dialog state for confirm claim
	let confirmClaimDialogOpen = $state(false)
	let phantomToClaim = $state<PhantomPlayer | null>(null)

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
			toast.error(extractErrorMessage(error, 'Action failed'))
		}

		confirmDialogOpen = false
		selectedMember = null
		confirmAction = null
	}

	// Member/phantom editing
	async function openEditMemberDialog(member: CrewMembership) {
		editingMember = member
		editingPhantom = null
		// Format date for input
		editJoinDate = member.joinedAt ? (member.joinedAt.split('T')[0] ?? '') : ''
		editRetired = member.retired
		editRetiredAt = member.retiredAt ? (member.retiredAt.split('T')[0] ?? '') : ''
		membershipHistory = []
		editDialogOpen = true

		// Fetch membership history for boomerang players
		if (crewStore.crew && member.user?.id) {
			loadingHistory = true
			try {
				const history = await crewAdapter.getMembershipHistory(crewStore.crew.id, member.user.id)
				// Only show multi-period UI if there are multiple memberships
				if (history.length > 1) {
					membershipHistory = history.map((m) => ({
						id: m.id,
						joinedAt: m.joinedAt ? (m.joinedAt.split('T')[0] ?? '') : '',
						retiredAt: m.retiredAt ? (m.retiredAt.split('T')[0] ?? '') : '',
						retired: m.retired
					}))
				}
			} catch (error) {
				console.error('Failed to fetch membership history:', error)
				toast.error(extractErrorMessage(error, 'Failed to load history'))
			}
			loadingHistory = false
		}
	}

	function openEditPhantomDialog(phantom: PhantomPlayer) {
		editingPhantom = phantom
		editingMember = null
		editJoinDate = phantom.joinedAt ? (phantom.joinedAt.split('T')[0] ?? '') : ''
		editRetired = phantom.retired
		editRetiredAt = phantom.retiredAt ? (phantom.retiredAt.split('T')[0] ?? '') : ''
		editGranblueId = phantom.granblueId ?? ''
		editDialogOpen = true
	}

	async function handleSaveEdit() {
		if (!crewStore.crew) return

		try {
			if (editingMember) {
				// Check if we have multiple membership periods (boomerang player)
				if (membershipHistory.length > 1) {
					// Update each membership period
					for (const period of membershipHistory) {
						await updateMembershipMutation.mutateAsync({
							crewId: crewStore.crew.id,
							membershipId: period.id,
							input: {
								joinedAt: period.joinedAt,
								retired: period.retired,
								retiredAt: period.retired ? period.retiredAt || undefined : undefined
							}
						})
					}
				} else {
					// Single membership period (normal case)
					await updateMembershipMutation.mutateAsync({
						crewId: crewStore.crew.id,
						membershipId: editingMember.id,
						input: {
							joinedAt: editJoinDate,
							retired: editRetired,
							retiredAt: editRetired ? editRetiredAt || undefined : undefined
						}
					})
				}
			} else if (editingPhantom) {
				// Call the phantom update directly through the adapter
				await crewAdapter.updatePhantom(crewStore.crew.id, editingPhantom.id, {
					joinedAt: editJoinDate,
					retired: editRetired,
					retiredAt: editRetired ? editRetiredAt || undefined : undefined,
					granblueId: editGranblueId || undefined
				})
				// Invalidate members query
				membersQuery.refetch()
			}
			// Invalidate GW event queries since membersDuringEvent depends on join dates
			queryClient.invalidateQueries({ queryKey: ['crew', 'gw'] })
		} catch (error) {
			console.error('Failed to update:', error)
			toast.error(extractErrorMessage(error, 'Failed to update member'))
		}

		editDialogOpen = false
		editingMember = null
		editingPhantom = null
		editJoinDate = ''
		editRetired = false
		editRetiredAt = ''
		editGranblueId = ''
		membershipHistory = []
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
			toast.error(extractErrorMessage(error, 'Failed to delete phantom'))
		}

		deletePhantomDialogOpen = false
		phantomToDelete = null
	}

	// Phantom assignment
	function openAssignPhantomDialog(phantom: PhantomPlayer) {
		phantomToAssign = phantom
		assignPhantomDialogOpen = true
	}

	// Confirm claim (opens modal)
	function openConfirmClaimDialog(phantom: PhantomPlayer) {
		phantomToClaim = phantom
		confirmClaimDialogOpen = true
	}

	// Decline claim (direct action, no confirmation needed)
	async function handleDeclineClaim(phantom: PhantomPlayer) {
		if (!crewStore.crew) return

		try {
			await declinePhantomClaimMutation.mutateAsync({
				crewId: crewStore.crew.id,
				phantomId: phantom.id
			})
		} catch (error) {
			console.error('Failed to decline phantom claim:', error)
			toast.error(extractErrorMessage(error, 'Failed to decline claim'))
		}
	}

	// Check if invitation is expired
	function isInvitationExpired(expiresAt: string): boolean {
		return new Date(expiresAt) < new Date()
	}

	// Get pending (non-expired) invitations count
	const pendingInvitationsCount = $derived(
		invitationsQuery.data?.filter((inv) => !isInvitationExpired(inv.expiresAt)).length ?? 0
	)

	// Get phantoms with pending claims (assigned but not confirmed)
	// Use phantom query when viewing pending filter since it doesn't include phantoms
	const pendingClaimPhantoms = $derived.by(() => {
		const phantoms = filter === 'pending'
			? phantomsQuery.data?.phantoms
			: membersQuery.data?.phantoms
		return phantoms?.filter((p) => p.claimedBy && !p.claimConfirmed) ?? []
	})
</script>

<svelte:head>
	<title>Crew Members / granblue.team</title>
</svelte:head>

<div class="page">
	<div class="card">
		<CrewHeader
			title={crewStore.crew?.name ?? ''}
			subtitle={crewStore.crew?.gamertag ?? undefined}
			description={crewStore.crew?.description ?? undefined}
		>
			{#snippet actions()}
				{#if crewStore.isOfficer}
					<Button
						variant="secondary"
						size="small"
						disabled={isRosterFull}
						onclick={() => (scoutModalOpen = true)}
					>
						{m.crew_scout()}
					</Button>
					<DropdownMenu>
						{#snippet trigger({ props })}
							<Button variant="ghost" size="small" iconOnly icon="ellipsis" {...props} />
						{/snippet}
						{#snippet menu()}
							<DropdownMenuBase.Item
								class="dropdown-menu-item"
								onclick={() => (bulkPhantomDialogOpen = true)}
							>
								{m.crew_add_phantoms()}
							</DropdownMenuBase.Item>
						{/snippet}
					</DropdownMenu>
				{/if}
			{/snippet}
		</CrewHeader>

		<CrewTabs userElement={data.currentUser?.element} />

		<div class="filter-tabs">
			{#each filterOptions as option}
				<button
					class="filter-tab"
					class:active={filter === option.value}
					onclick={() => handleFilterChange(option.value)}
				>
					{option.label}
					{#if option.value === 'pending' && (pendingInvitationsCount > 0 || pendingClaimPhantoms.length > 0)}
						<span class="tab-badge">{pendingInvitationsCount + pendingClaimPhantoms.length}</span>
					{/if}
				</button>
			{/each}
		</div>

		<!-- Pending tab (invitations and claims) -->
		{#if filter === 'pending'}
			{#if invitationsQuery.isLoading || phantomsQuery.isLoading}
				<div class="loading-state">
					<p>{m.crew_loading()}</p>
				</div>
			{:else}
				{#if invitationsQuery.data && invitationsQuery.data.length > 0}
					<div class="section-divider">
						<span>{m.crew_pending_invitations({ count: String(invitationsQuery.data.length) })}</span>
					</div>
					<ul class="member-list">
						{#each invitationsQuery.data as invitation}
							{@const expired = isInvitationExpired(invitation.expiresAt)}
							<li class="invitation-row" class:expired>
								<div class="invitation-info">
									<span class="invited-user">{invitation.user?.username ?? m.crew_unknown()}</span>
									{#if invitation.invitedBy}
										<span class="invited-by">
											{m.crew_invited_by({ username: invitation.invitedBy.username })}
										</span>
									{/if}
								</div>
								<div class="invitation-status">
									{#if expired}
										<span class="status-badge expired">{m.crew_expired()}</span>
									{:else}
										<span class="expires-text">{m.crew_expires({ date: formatDate(invitation.expiresAt) })}</span>
									{/if}
								</div>
							</li>
						{/each}
					</ul>
				{/if}

				{#if pendingClaimPhantoms.length > 0}
					<div class="section-divider">
						<span>{m.crew_pending_claims({ count: String(pendingClaimPhantoms.length) })}</span>
					</div>
					<ul class="member-list">
						{#each pendingClaimPhantoms as phantom}
							<PhantomRow
								{phantom}
								currentUserId={crewStore.membership?.user?.id}
								onEdit={() => openEditPhantomDialog(phantom)}
								onDelete={() => openDeletePhantomDialog(phantom)}
								onAssign={() => openAssignPhantomDialog(phantom)}
								onAccept={() => openConfirmClaimDialog(phantom)}
								onDecline={() => handleDeclineClaim(phantom)}
							/>
						{/each}
					</ul>
				{/if}

				{#if (!invitationsQuery.data || invitationsQuery.data.length === 0) && pendingClaimPhantoms.length === 0}
					<div class="empty-state">
						<p>{m.crew_no_pending()}</p>
					</div>
				{/if}
			{/if}
		{:else if membersQuery.isLoading}
			<div class="loading-state">
				<p>{m.crew_loading()}</p>
			</div>
		{:else if membersQuery.isError}
			<div class="error-state">
				<p>{m.crew_load_members_failed()}</p>
			</div>
		{:else}
			{@const hasMembers = membersQuery.data?.members && membersQuery.data.members.length > 0}
			{@const hasPhantoms = membersQuery.data?.phantoms && membersQuery.data.phantoms.length > 0}

			<!-- Empty state for active/retired when no members or phantoms -->
			{#if (filter === 'active' || filter === 'retired') && !hasMembers && !hasPhantoms}
				<div class="empty-state">
					<p>{m.crew_no_filter_players({ filter })}</p>
				</div>
			{:else}
				<!-- Regular members -->
				{#if hasMembers}
					{#if (filter === 'active' || filter === 'retired') && hasPhantoms}
						<div class="section-divider">
							<span>{m.crew_members_count({ count: String(membersQuery.data?.members.length ?? 0) })}</span>
						</div>
					{/if}
					<ul class="member-list">
						{#each membersQuery.data?.members ?? [] as member}
							<MemberRow
								{member}
								onEdit={() => openEditMemberDialog(member)}
								onPromote={() => openPromoteDialog(member)}
								onDemote={() => openDemoteDialog(member)}
								onRemove={() => openRemoveDialog(member)}
							/>
						{/each}
					</ul>
				{/if}

				<!-- Phantom players -->
				{#if hasPhantoms}
					{#if filter === 'all' || filter === 'active' || filter === 'retired'}
						<div class="section-divider">
							<span>{m.crew_phantoms_count({ count: String(membersQuery.data?.phantoms.length ?? 0) })}</span>
						</div>
					{/if}
					<ul class="member-list">
						{#each membersQuery.data?.phantoms ?? [] as phantom}
							<PhantomRow
								{phantom}
								currentUserId={crewStore.membership?.user?.id}
								onEdit={() => openEditPhantomDialog(phantom)}
								onDelete={() => openDeletePhantomDialog(phantom)}
								onAssign={() => openAssignPhantomDialog(phantom)}
								onAccept={() => openConfirmClaimDialog(phantom)}
								onDecline={() => handleDeclineClaim(phantom)}
							/>
						{/each}
					</ul>
				{/if}
			{/if}
		{/if}
	</div>
</div>

<!-- Confirm Action Dialog -->
<Dialog bind:open={confirmDialogOpen}>
	{#snippet children()}
		<ModalHeader
			title={confirmAction === 'remove'
				? m.crew_remove_member()
				: confirmAction === 'promote'
					? m.crew_promote_member()
					: m.crew_demote_member()}
		/>

		<ModalBody>
			<p class="confirm-message">
				{#if confirmAction === 'remove'}
					{m.crew_confirm_remove({ name: selectedMember?.user?.username ?? '' })}
				{:else if confirmAction === 'promote'}
					{m.crew_confirm_promote({ name: selectedMember?.user?.username ?? '' })}
				{:else if confirmAction === 'demote'}
					{m.crew_confirm_demote({ name: selectedMember?.user?.username ?? '' })}
				{/if}
			</p>
		</ModalBody>

		<ModalFooter
			onCancel={() => (confirmDialogOpen = false)}
			primaryAction={{
				label:
					confirmAction === 'remove'
						? m.crew_remove()
						: confirmAction === 'promote'
							? m.crew_promote()
							: m.crew_demote(),
				onclick: handleConfirmAction,
				destructive: confirmAction === 'remove'
			}}
		/>
	{/snippet}
</Dialog>

<!-- Edit Member/Phantom Dialog -->
<Dialog bind:open={editDialogOpen}>
	{#snippet children()}
		<ModalHeader title={m.crew_edit_player()} />

		<ModalBody>
			<div class="modal-form">
				<div class="form-fields">
					{#if editingPhantom}
						<Input
							label={m.crew_granblue_id()}
							bind:value={editGranblueId}
							maxLength={20}
							variant="contained"
						/>
					{/if}

					{#if loadingHistory}
						<p class="loading-text">{m.crew_membership_loading()}</p>
					{:else if membershipHistory.length > 1}
						<!-- Multiple membership periods (boomerang player) -->
						<div class="membership-periods">
							<h4 class="periods-title">{m.crew_membership_periods()}</h4>
							<p class="help-text">
								{m.crew_membership_hint()}
							</p>
							{#each membershipHistory as period, i}
								<div class="period-row">
									<span class="period-label">
										{#if i === 0}
											{m.crew_period_current()}
										{:else}
											{m.crew_period_number({ n: String(membershipHistory.length - i) })}
										{/if}
									</span>
									<div class="period-fields">
										<DatePicker
											label={m.crew_joined()}
											bind:value={period.joinedAt}
											contained
										/>
										{#if period.retired || i > 0}
											<DatePicker
												label={m.crew_left()}
												bind:value={period.retiredAt}
												contained
											/>
										{/if}
									</div>
								</div>
							{/each}
						</div>

						<!-- Retired toggle only affects current membership -->
						{#if !membershipHistory[0]?.retired}
							<SettingsRow title={m.crew_retired()} subtitle={m.crew_mark_retired()}>
								{#snippet control()}
									<Switch
										checked={editRetired}
										name="retired"
										onCheckedChange={(checked) => {
											editRetired = checked
											if (membershipHistory[0]) {
												membershipHistory[0].retired = checked
											}
										}}
									/>
								{/snippet}
							</SettingsRow>
							{#if editRetired && membershipHistory[0]}
								<DatePicker label={m.crew_retired_date()} bind:value={membershipHistory[0].retiredAt} contained />
							{/if}
						{/if}
					{:else}
						<!-- Single membership period (normal case) -->
						<DatePicker label={m.crew_join_date()} bind:value={editJoinDate} contained />
						<p class="help-text">
							{m.crew_join_date_hint()}
						</p>
						<SettingsRow title={m.crew_retired()} subtitle={m.crew_retired_hint()}>
							{#snippet control()}
								<Switch bind:checked={editRetired} name="retired" />
							{/snippet}
						</SettingsRow>
						{#if editRetired}
							<DatePicker label={m.crew_retired_date()} bind:value={editRetiredAt} contained />
							<p class="help-text">
								{m.crew_retired_date_hint()}
							</p>
						{/if}
					{/if}
				</div>
			</div>
		</ModalBody>

		<ModalFooter
			onCancel={() => (editDialogOpen = false)}
			primaryAction={{
				label: m.crew_save_button(),
				onclick: handleSaveEdit,
				disabled: membershipHistory.length > 1 ? !membershipHistory[0]?.joinedAt : !editJoinDate
			}}
		/>
	{/snippet}
</Dialog>

<!-- Delete Phantom Confirmation Dialog -->
<Dialog bind:open={deletePhantomDialogOpen}>
	{#snippet children()}
		<ModalHeader title={m.crew_delete_phantom_title()} />

		<ModalBody>
			<p class="confirm-message">
				{m.crew_confirm_delete_phantom({ name: phantomToDelete?.name ?? '' })}
			</p>
		</ModalBody>

		<ModalFooter
			onCancel={() => (deletePhantomDialogOpen = false)}
			primaryAction={{
				label: m.crew_phantom_delete(),
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
	<AssignPhantomModal
		bind:open={assignPhantomDialogOpen}
		crewId={crewStore.crew.id}
		phantom={phantomToAssign}
	/>
	<ConfirmClaimModal
		bind:open={confirmClaimDialogOpen}
		crewId={crewStore.crew.id}
		phantom={phantomToClaim}
	/>
{/if}

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/effects' as effects;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

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

	.filter-tabs {
		display: flex;
		gap: spacing.$unit-half;
		padding: spacing.$unit-2x spacing.$unit-2x spacing.$unit;
	}

	.filter-tab {
		display: flex;
		align-items: center;
		gap: spacing.$unit-half;
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

	.tab-badge {
		background: var(--color-orange, #f97316);
		color: white;
		font-size: 11px;
		font-weight: typography.$medium;
		padding: 1px 6px;
		border-radius: 10px;
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

	.section-divider {
		display: flex;
		align-items: center;
		padding: spacing.$unit spacing.$unit-2x;
		background: rgba(0, 0, 0, 0.02);
		border-bottom: 1px solid rgba(0, 0, 0, 0.06);

		&.pending-claims {
			background: var(--color-yellow-light, #fef9c3);
			border-bottom-color: var(--color-yellow-dark, #854d0e);

			span {
				color: var(--color-yellow-dark, #854d0e);
			}
		}

		span {
			font-size: typography.$font-small;
			font-weight: typography.$medium;
			color: var(--text-secondary);
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

	:global(fieldset) {
		border: none;
		padding: 0;
		margin: 0;
	}

	.help-text {
		font-size: typography.$font-small;
		color: var(--text-secondary);
		margin: 0;
		line-height: 1.4;
	}

	.loading-text {
		font-size: typography.$font-small;
		color: var(--text-secondary);
		margin: 0;
		font-style: italic;
	}

	.membership-periods {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x;
	}

	.periods-title {
		font-size: typography.$font-regular;
		font-weight: typography.$medium;
		margin: 0;
		color: var(--text-primary);
	}

	.period-row {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
		padding: spacing.$unit-2x;
		background: rgba(0, 0, 0, 0.02);
		border-radius: layout.$item-corner;
		border: 1px solid rgba(0, 0, 0, 0.06);
	}

	.period-label {
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		color: var(--text-secondary);
	}

	.period-fields {
		display: flex;
		gap: spacing.$unit-2x;

		:global(.date-picker) {
			flex: 1;
		}
	}

	// Invitation row styles
	.invitation-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: spacing.$unit spacing.$unit spacing.$unit spacing.$unit-2x;
		border-radius: layout.$item-corner;
		transition: background-color 0.15s;

		&:hover {
			background: rgba(0, 0, 0, 0.03);
		}

		&.expired {
			opacity: 0.5;
		}
	}

	.invitation-info {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-fourth;
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
		color: var(--danger);
		background: var(--danger-bg);
		padding: 2px 8px;
		border-radius: layout.$item-corner-small;
		font-weight: typography.$medium;
	}
</style>
