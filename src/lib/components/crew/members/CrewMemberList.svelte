<script lang="ts" module>
	import type { CrewInvitation, CrewMembership, PhantomPlayer } from '$lib/types/api/crew'
	import type { MemberAction } from '$lib/features/crew/memberList'

	/** What the rows can ask the page to open */
	export interface MemberListActions {
		onEditMember: (member: CrewMembership) => void
		onConfirm: (member: CrewMembership, action: MemberAction) => void
		onMakeCaptain: (member: CrewMembership) => void
		onEditPhantom: (phantom: PhantomPlayer) => void
	}
</script>

<script lang="ts">
	import InvitationRow from '$lib/components/crew/InvitationRow.svelte'
	import MemberRow from '$lib/components/crew/MemberRow.svelte'
	import PhantomRow from '$lib/components/crew/PhantomRow.svelte'

	interface Props {
		/** Invitations, listed first */
		invitations?: CrewInvitation[]
		/** Members, listed next */
		members?: CrewMembership[]
		/** Phantoms, listed after the members */
		phantoms?: PhantomPlayer[]
		crewId: string
		currentUserId?: string | undefined
		/** Needed when listing members or phantoms */
		actions?: MemberListActions | undefined
	}

	const {
		invitations = [],
		members = [],
		phantoms = [],
		crewId,
		currentUserId,
		actions
	}: Props = $props()
</script>

<ul class="member-list">
	{#each invitations as invitation (invitation.id)}
		<InvitationRow {invitation} {crewId} />
	{/each}
	{#each members as member (member.id)}
		<MemberRow
			{member}
			onEdit={() => actions?.onEditMember(member)}
			onPromote={() => actions?.onConfirm(member, 'promote')}
			onDemote={() => actions?.onConfirm(member, 'demote')}
			onRemove={() => actions?.onConfirm(member, 'remove')}
			onMakeCaptain={() => actions?.onMakeCaptain(member)}
		/>
	{/each}
	{#each phantoms as phantom (phantom.id)}
		<PhantomRow {phantom} {crewId} {currentUserId} onEdit={() => actions?.onEditPhantom(phantom)} />
	{/each}
</ul>

<style lang="scss">
	@use '$src/themes/crew' as crew;

	.member-list {
		@include crew.row-list;
	}
</style>
