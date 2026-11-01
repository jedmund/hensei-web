<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import type { CrewMembersResponse, MemberFilter } from '$lib/types/api/crew'
	import { splitMemberSections } from '$lib/features/crew/memberList'
	import CrewSectionHeader from '$lib/components/crew/CrewSectionHeader.svelte'
	import CrewStatusMessage from '$lib/components/crew/CrewStatusMessage.svelte'
	import CrewMemberList, {
		type MemberListActions
	} from '$lib/components/crew/members/CrewMemberList.svelte'

	interface Props {
		/** Any filter but pending */
		filter: MemberFilter
		data: CrewMembersResponse | undefined
		crewId: string
		currentUserId?: string | undefined
		actions: MemberListActions
	}

	const { filter, data, crewId, currentUserId, actions }: Props = $props()

	const members = $derived(data?.members ?? [])
	const phantoms = $derived(data?.phantoms ?? [])
	const hasMembers = $derived(members.length > 0)
	const hasPhantoms = $derived(phantoms.length > 0)

	const sections = $derived(splitMemberSections(data?.members, data?.phantoms))
	const activeCount = $derived(sections.activeMembers.length + sections.activePhantoms.length)
	const retiredCount = $derived(sections.retiredMembers.length + sections.retiredPhantoms.length)
</script>

<!-- Empty state for active/retired when no members or phantoms -->
{#if (filter === 'active' || filter === 'retired') && !hasMembers && !hasPhantoms}
	<CrewStatusMessage variant="notice" message={m.crew_no_filter_players({ filter })} />
{:else if filter === 'all'}
	<!-- Active section: members sorted by role, then phantoms -->
	{#if activeCount > 0}
		<CrewSectionHeader title={m.crew_members_label()} count={activeCount} />
		<CrewMemberList
			members={sections.activeMembers}
			phantoms={sections.activePhantoms}
			{crewId}
			{currentUserId}
			{actions}
		/>
	{/if}

	<!-- Retired Players section (labeled): retired members, then retired phantoms -->
	{#if retiredCount > 0}
		<CrewSectionHeader title={m.crew_retired_players_label()} count={retiredCount} />
		<CrewMemberList
			members={sections.retiredMembers}
			phantoms={sections.retiredPhantoms}
			{crewId}
			{currentUserId}
			{actions}
		/>
	{/if}
{:else}
	<!-- Active or retired filter: keep existing members + phantoms delineation -->
	{#if hasMembers}
		{#if hasPhantoms}
			<CrewSectionHeader title={m.crew_members_label()} count={members.length} />
		{/if}
		<CrewMemberList {members} {crewId} {currentUserId} {actions} />
	{/if}

	{#if hasPhantoms}
		<CrewSectionHeader title={m.crew_phantoms_label()} count={phantoms.length} />
		<CrewMemberList {phantoms} {crewId} {currentUserId} {actions} />
	{/if}
{/if}
