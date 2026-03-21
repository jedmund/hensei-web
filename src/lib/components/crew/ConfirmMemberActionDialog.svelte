<script lang="ts">
	import type { CrewMembership } from '$lib/types/api/crew'
	import { useRemoveMember, useUpdateMembership } from '$lib/api/mutations/crew.mutations'
	import { crewStore } from '$lib/stores/crew.store.svelte'
	import { toast } from 'svelte-sonner'
	import { extractErrorMessage } from '$lib/utils/errors'
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import ModalHeader from '$lib/components/ui/ModalHeader.svelte'
	import ModalBody from '$lib/components/ui/ModalBody.svelte'
	import ModalFooter from '$lib/components/ui/ModalFooter.svelte'
	import * as m from '$lib/paraglide/messages'

	type MemberAction = 'remove' | 'promote' | 'demote'

	interface Props {
		member: CrewMembership | null
		action: MemberAction | null
		onClose: () => void
	}

	let { member, action, onClose }: Props = $props()

	const removeMemberMutation = useRemoveMember()
	const updateMembershipMutation = useUpdateMembership()

	let open = $state(false)

	$effect(() => {
		open = !!member && !!action
	})

	function handleOpenChange(isOpen: boolean) {
		if (!isOpen) {
			open = false
			onClose()
		}
	}

	const title = $derived(
		action === 'remove'
			? m.crew_remove_member()
			: action === 'promote'
				? m.crew_promote_member()
				: m.crew_demote_member()
	)

	const confirmLabel = $derived(
		action === 'remove'
			? m.crew_remove()
			: action === 'promote'
				? m.crew_promote()
				: m.crew_demote()
	)

	const message = $derived.by(() => {
		const name = member?.user?.username ?? ''
		if (action === 'remove') return m.crew_confirm_remove({ name })
		if (action === 'promote') return m.crew_confirm_promote({ name })
		return m.crew_confirm_demote({ name })
	})

	async function handleConfirm() {
		if (!member || !action || !crewStore.crew) return

		try {
			if (action === 'remove') {
				await removeMemberMutation.mutateAsync({
					crewId: crewStore.crew.id,
					membershipId: member.id
				})
			} else if (action === 'promote') {
				await updateMembershipMutation.mutateAsync({
					crewId: crewStore.crew.id,
					membershipId: member.id,
					input: { role: 'vice_captain' }
				})
			} else if (action === 'demote') {
				await updateMembershipMutation.mutateAsync({
					crewId: crewStore.crew.id,
					membershipId: member.id,
					input: { role: 'member' }
				})
			}
		} catch (error) {
			console.error('Action failed:', error)
			toast.error(extractErrorMessage(error, 'Action failed'))
		}

		open = false
		onClose()
	}
</script>

<Dialog bind:open onOpenChange={handleOpenChange}>
	{#snippet children()}
		<ModalHeader {title} />

		<ModalBody>
			<p class="confirm-message">{message}</p>
		</ModalBody>

		<ModalFooter
			onCancel={() => { open = false; onClose() }}
			primaryAction={{
				label: confirmLabel,
				onclick: handleConfirm,
				destructive: action === 'remove'
			}}
		/>
	{/snippet}
</Dialog>

<style>
	.confirm-message {
		color: var(--text-primary);
		line-height: 1.5;
		margin: 0;
	}
</style>
