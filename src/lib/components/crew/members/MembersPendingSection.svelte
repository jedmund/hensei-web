<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import type { CrewInvitation, PhantomPlayer } from '$lib/types/api/crew'
	import CrewSectionHeader from '$lib/components/crew/CrewSectionHeader.svelte'
	import CrewStatusMessage from '$lib/components/crew/CrewStatusMessage.svelte'
	import CrewMemberList, {
		type MemberListActions
	} from '$lib/components/crew/members/CrewMemberList.svelte'

	interface Props {
		activeInvitations: CrewInvitation[]
		expiredInvitations: CrewInvitation[]
		pendingClaims: PhantomPlayer[]
		crewId: string
		currentUserId?: string | undefined
		actions: MemberListActions
	}

	const {
		activeInvitations,
		expiredInvitations,
		pendingClaims,
		crewId,
		currentUserId,
		actions
	}: Props = $props()
</script>

{#if activeInvitations.length > 0}
	<CrewSectionHeader title={m.crew_pending_label()} count={activeInvitations.length} />
	<CrewMemberList invitations={activeInvitations} {crewId} />
{/if}

{#if expiredInvitations.length > 0}
	<CrewSectionHeader title={m.crew_expired()} count={expiredInvitations.length} />
	<CrewMemberList invitations={expiredInvitations} {crewId} />
{/if}

{#if pendingClaims.length > 0}
	<CrewSectionHeader title={m.crew_pending_claims({ count: String(pendingClaims.length) })} />
	<CrewMemberList phantoms={pendingClaims} {crewId} {currentUserId} {actions} />
{/if}

{#if activeInvitations.length === 0 && expiredInvitations.length === 0 && pendingClaims.length === 0}
	<CrewStatusMessage variant="notice" message={m.crew_no_pending()} />
{/if}
