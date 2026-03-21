
<script lang="ts">
	import { page } from '$app/stores'
	import { goto } from '$app/navigation'
	import { createQuery } from '@tanstack/svelte-query'
	import { crewQueries } from '$lib/api/queries/crew.queries'
	import { crewStore } from '$lib/stores/crew.store.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import DropdownMenu from '$lib/components/ui/DropdownMenu.svelte'
	import CrewHeader from '$lib/components/crew/CrewHeader.svelte'
	import CrewTabs from '$lib/components/crew/CrewTabs.svelte'
	import MemberRow from '$lib/components/crew/MemberRow.svelte'
	import PhantomRow from '$lib/components/crew/PhantomRow.svelte'
	import InvitationRow from '$lib/components/crew/InvitationRow.svelte'
	import EditMemberDialog from '$lib/components/crew/EditMemberDialog.svelte'
	import ConfirmMemberActionDialog from '$lib/components/crew/ConfirmMemberActionDialog.svelte'
	import ScoutUserModal from '$lib/components/crew/ScoutUserModal.svelte'
	import BulkPhantomModal from '$lib/components/crew/BulkPhantomModal.svelte'
	import { DropdownMenu as DropdownMenuBase } from 'bits-ui'
	import type {
		MemberFilter,
		CrewMembership,
		PhantomPlayer
	} from '$lib/types/api/crew'
	import type { PageData } from './$types'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		data: PageData
	}

	let { data }: Props = $props()

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

	// Confirm action dialog state (remove/promote/demote)
	let confirmMember = $state<CrewMembership | null>(null)
	let confirmAction = $state<'remove' | 'promote' | 'demote' | null>(null)

	function openConfirmDialog(member: CrewMembership, action: 'remove' | 'promote' | 'demote') {
		confirmMember = member
		confirmAction = action
	}

	function handleConfirmClose() {
		confirmMember = null
		confirmAction = null
	}

	// Edit dialog state
	let editingMember = $state<CrewMembership | null>(null)
	let editingPhantom = $state<PhantomPlayer | null>(null)

	function openEditMemberDialog(member: CrewMembership) {
		editingPhantom = null
		editingMember = member
	}

	function openEditPhantomDialog(phantom: PhantomPlayer) {
		editingMember = null
		editingPhantom = phantom
	}

	function handleEditClose() {
		editingMember = null
		editingPhantom = null
	}

	function handleEditSaved() {
		membersQuery.refetch()
	}

	// Scout and phantom creation modals
	let scoutModalOpen = $state(false)
	let bulkPhantomDialogOpen = $state(false)

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
						{#each invitationsQuery.data as invitation (invitation.id)}
							<InvitationRow {invitation} />
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
								crewId={crewStore.crew?.id ?? ''}
								currentUserId={crewStore.membership?.user?.id}
								onEdit={() => openEditPhantomDialog(phantom)}
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
								onPromote={() => openConfirmDialog(member, 'promote')}
								onDemote={() => openConfirmDialog(member, 'demote')}
								onRemove={() => openConfirmDialog(member, 'remove')}
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
								crewId={crewStore.crew?.id ?? ''}
								currentUserId={crewStore.membership?.user?.id}
								onEdit={() => openEditPhantomDialog(phantom)}
							/>
						{/each}
					</ul>
				{/if}
			{/if}
		{/if}
	</div>
</div>

<!-- Confirm Member Action Dialog (remove/promote/demote) -->
<ConfirmMemberActionDialog
	member={confirmMember}
	action={confirmAction}
	onClose={handleConfirmClose}
/>

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

<style lang="scss">
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

		span {
			font-size: typography.$font-small;
			font-weight: typography.$medium;
			color: var(--text-secondary);
		}
	}
</style>
