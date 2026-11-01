<script lang="ts">
	import { page } from '$app/stores'
	import { goto } from '$app/navigation'
	import { createQuery } from '@tanstack/svelte-query'
	import { crewQueries } from '$lib/api/queries/crew.queries'
	import { crewStore } from '$lib/stores/crew.store.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import DropdownMenu from '$lib/components/ui/DropdownMenu.svelte'
	import CrewHeader from '$lib/components/crew/CrewHeader.svelte'
	import CrewPage from '$lib/components/crew/CrewPage.svelte'
	import CrewStatusMessage from '$lib/components/crew/CrewStatusMessage.svelte'
	import CrewTabs from '$lib/components/crew/CrewTabs.svelte'
	import EditMemberDialog from '$lib/components/crew/EditMemberDialog.svelte'
	import ConfirmMemberActionDialog from '$lib/components/crew/ConfirmMemberActionDialog.svelte'
	import TransferCaptainDialog from '$lib/components/crew/TransferCaptainDialog.svelte'
	import ScoutUserModal from '$lib/components/crew/ScoutUserModal.svelte'
	import BulkPhantomModal from '$lib/components/crew/BulkPhantomModal.svelte'
	import MemberFilterTabs from '$lib/components/crew/members/MemberFilterTabs.svelte'
	import MembersListSection from '$lib/components/crew/members/MembersListSection.svelte'
	import MembersPendingSection from '$lib/components/crew/members/MembersPendingSection.svelte'
	import type { MemberListActions } from '$lib/components/crew/members/CrewMemberList.svelte'
	import {
		CREW_ROSTER_CAP,
		countActiveMembers,
		memberFilterFromUrl,
		memberFilterOptions,
		pendingClaimPhantoms,
		splitInvitations,
		urlForMemberFilter,
		type MemberAction
	} from '$lib/features/crew/memberList'
	import { DropdownMenu as DropdownMenuBase } from 'bits-ui'
	import type { MemberFilter, CrewMembership, PhantomPlayer } from '$lib/types/api/crew'
	import type { PageData } from './$types'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		data: PageData
	}

	let { data }: Props = $props()

	// Get filter from URL
	const filter = $derived<MemberFilter>(memberFilterFromUrl($page.url))

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

	// Active member count (real members only, not phantoms) decides whether
	// scouting is disabled - phantoms can be replaced by real members
	const activeMemberCount = $derived(
		countActiveMembers(
			filter === 'active' ? (membersQuery.data?.members ?? []) : (activeQuery.data?.members ?? [])
		)
	)

	const isRosterFull = $derived(activeMemberCount >= CREW_ROSTER_CAP)

	// Filter options - Pending only shown to officers
	const filterOptions = $derived(memberFilterOptions(crewStore.isOfficer))

	// Change filter
	function handleFilterChange(newFilter: MemberFilter) {
		goto(urlForMemberFilter($page.url, newFilter).toString(), { replaceState: true })
	}

	// Confirm action dialog state (remove/promote/demote)
	let confirmMember = $state<CrewMembership | null>(null)
	let confirmAction = $state<MemberAction | null>(null)

	function handleConfirmClose() {
		confirmMember = null
		confirmAction = null
	}

	// Captain transfer dialog state
	let captainTransferMember = $state<CrewMembership | null>(null)

	function handleCaptainTransferClose() {
		captainTransferMember = null
	}

	// Edit dialog state
	let editingMember = $state<CrewMembership | null>(null)
	let editingPhantom = $state<PhantomPlayer | null>(null)

	function handleEditClose() {
		editingMember = null
		editingPhantom = null
	}

	function handleEditSaved() {
		membersQuery.refetch()
	}

	const memberActions: MemberListActions = {
		onEditMember: (member) => {
			editingPhantom = null
			editingMember = member
		},
		onConfirm: (member, action) => {
			confirmMember = member
			confirmAction = action
		},
		onMakeCaptain: (member) => {
			captainTransferMember = member
		},
		onEditPhantom: (phantom) => {
			editingMember = null
			editingPhantom = phantom
		}
	}

	// Scout and phantom creation modals
	let scoutModalOpen = $state(false)
	let bulkPhantomDialogOpen = $state(false)

	// Split invitations into active (still pending) and expired
	const invitations = $derived(splitInvitations(invitationsQuery.data))

	// Phantoms with pending claims (assigned but not confirmed). The pending
	// filter's member query doesn't include phantoms, so it uses its own query
	const pendingClaims = $derived(
		pendingClaimPhantoms(
			filter === 'pending' ? phantomsQuery.data?.phantoms : membersQuery.data?.phantoms
		)
	)
</script>

<svelte:head>
	<title>Crew Members / granblue.team</title>
</svelte:head>

<CrewPage>
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

	<MemberFilterTabs
		options={filterOptions}
		value={filter}
		pendingCount={invitations.active.length + pendingClaims.length}
		onChange={handleFilterChange}
	/>

	<!-- Pending tab (invitations and claims) -->
	{#if filter === 'pending'}
		{#if invitationsQuery.isLoading || phantomsQuery.isLoading}
			<CrewStatusMessage message={m.crew_loading()} />
		{:else}
			<MembersPendingSection
				activeInvitations={invitations.active}
				expiredInvitations={invitations.expired}
				{pendingClaims}
				crewId={crewStore.crew?.id ?? ''}
				currentUserId={crewStore.membership?.user?.id}
				actions={memberActions}
			/>
		{/if}
	{:else if membersQuery.isLoading}
		<CrewStatusMessage message={m.crew_loading()} />
	{:else if membersQuery.isError}
		<CrewStatusMessage message={m.crew_load_members_failed()} />
	{:else}
		<MembersListSection
			{filter}
			data={membersQuery.data}
			crewId={crewStore.crew?.id ?? ''}
			currentUserId={crewStore.membership?.user?.id}
			actions={memberActions}
		/>
	{/if}
</CrewPage>

<!-- Confirm Member Action Dialog (remove/promote/demote) -->
<ConfirmMemberActionDialog
	member={confirmMember}
	action={confirmAction}
	onClose={handleConfirmClose}
/>

<!-- Transfer Captain Dialog -->
<TransferCaptainDialog member={captainTransferMember} onClose={handleCaptainTransferClose} />

<!-- Edit Member/Phantom Dialog -->
<EditMemberDialog
	member={editingMember}
	phantom={editingPhantom}
	onClose={handleEditClose}
	onSaved={handleEditSaved}
/>

<!-- Scout & Phantom Modals -->
{#if crewStore.crew?.id}
	<ScoutUserModal bind:open={scoutModalOpen} crewId={crewStore.crew.id} />
	<BulkPhantomModal bind:open={bulkPhantomDialogOpen} crewId={crewStore.crew.id} />
{/if}
