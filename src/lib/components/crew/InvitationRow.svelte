<script lang="ts">
	import type { CrewInvitation } from '$lib/types/api/crew'
	import { formatDate } from '$lib/utils/date'
	import { useSendInvitation } from '$lib/api/mutations/crew.mutations'
	import { extractErrorMessage } from '$lib/utils/errors'
	import { toast } from 'svelte-sonner'
	import Button from '$lib/components/ui/Button.svelte'
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import ModalHeader from '$lib/components/ui/ModalHeader.svelte'
	import ModalBody from '$lib/components/ui/ModalBody.svelte'
	import ModalFooter from '$lib/components/ui/ModalFooter.svelte'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		invitation: CrewInvitation
		crewId: string
	}

	let { invitation, crewId }: Props = $props()

	const expired = $derived(new Date(invitation.expiresAt) < new Date())
	const username = $derived(invitation.user?.username ?? '')

	const sendInvitationMutation = useSendInvitation()

	let reinviteDialogOpen = $state(false)

	async function handleReinvite() {
		if (!invitation.user?.id || !crewId) return
		try {
			await sendInvitationMutation.mutateAsync({
				crewId,
				userId: invitation.user.id
			})
			toast.success(m.crew_reinvite_success())
			reinviteDialogOpen = false
		} catch (error) {
			toast.error(extractErrorMessage(error, m.crew_reinvite_failed()))
		}
	}
</script>

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
			<Button variant="ghost" size="small" onclick={() => (reinviteDialogOpen = true)}>
				{m.crew_reinvite()}
			</Button>
		{:else}
			<span class="expires-text">{m.crew_expires({ date: formatDate(invitation.expiresAt) })}</span>
		{/if}
	</div>
</li>

<Dialog bind:open={reinviteDialogOpen}>
	<ModalHeader title={m.crew_reinvite_title({ username })} />
	<ModalBody>
		<p class="confirm-message">{m.crew_reinvite_body({ username })}</p>
	</ModalBody>
	<ModalFooter
		onCancel={() => (reinviteDialogOpen = false)}
		cancelDisabled={sendInvitationMutation.isPending}
		primaryAction={{
			label: m.crew_reinvite(),
			onclick: handleReinvite,
			disabled: sendInvitationMutation.isPending
		}}
	/>
</Dialog>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

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

		&.expired .invitation-info {
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

	.confirm-message {
		color: var(--text-primary);
		line-height: 1.5;
		margin: 0;
	}
</style>
