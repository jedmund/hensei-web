<script lang="ts">
	import { goto } from '$app/navigation'
	import { localizeHref } from '$lib/paraglide/runtime'
	import { toast } from 'svelte-sonner'
	import { useTransferCaptain } from '$lib/api/mutations/crew.mutations'
	import { crewStore } from '$lib/stores/crew.store.svelte'
	import { extractErrorMessage } from '$lib/utils/errors'
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import ModalHeader from '$lib/components/ui/ModalHeader.svelte'
	import ModalBody from '$lib/components/ui/ModalBody.svelte'
	import ModalFooter from '$lib/components/ui/ModalFooter.svelte'
	import Input from '$lib/components/ui/Input.svelte'
	import type { CrewMembership } from '$lib/types/api/crew'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		member: CrewMembership | null
		onClose: () => void
	}

	let { member, onClose }: Props = $props()

	const transferCaptainMutation = useTransferCaptain()

	let typedName = $state('')
	let open = $derived(!!member)

	$effect(() => {
		if (member) typedName = ''
	})

	const memberName = $derived(member?.user?.displayName || member?.user?.username || '')
	const crewName = $derived(crewStore.crew?.name ?? '')
	const canConfirm = $derived(
		!!crewName && typedName.trim() === crewName.trim() && !transferCaptainMutation.isPending
	)

	function handleOpenChange(isOpen: boolean) {
		if (!isOpen) {
			typedName = ''
			onClose()
		}
	}

	async function handleConfirm() {
		if (!member?.user?.id || !crewStore.crew) return
		try {
			await transferCaptainMutation.mutateAsync({
				crewId: crewStore.crew.id,
				userId: member.user.id
			})
			toast.success(m.crew_transfer_captain_success())
			typedName = ''
			onClose()
			goto(localizeHref('/crew'))
		} catch (error) {
			toast.error(extractErrorMessage(error, m.crew_transfer_captain_failed()))
		}
	}
</script>

<Dialog bind:open onOpenChange={handleOpenChange}>
	<ModalHeader title={m.crew_transfer_captain()} />

	<ModalBody>
		<p class="message">
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			{@html m.crew_transfer_captain_body({ name: memberName, crewName })}
		</p>
		<p class="hint">{m.crew_transfer_captain_hint()}</p>
		<Input
			bind:value={typedName}
			placeholder={crewName}
			fullWidth
			autocomplete="off"
			autocapitalize="off"
			autocorrect="off"
			spellcheck={false}
		/>
	</ModalBody>

	<ModalFooter
		onCancel={() => {
			typedName = ''
			onClose()
		}}
		cancelDisabled={transferCaptainMutation.isPending}
		primaryAction={{
			label: m.crew_transfer(),
			onclick: handleConfirm,
			disabled: !canConfirm
		}}
	/>
</Dialog>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;

	.message {
		color: var(--text-primary);
		line-height: 1.5;
		margin: 0 0 spacing.$unit 0;

		:global(b) {
			font-weight: 600;
		}
	}

	.hint {
		color: var(--text-secondary);
		font-size: 0.875rem;
		margin: 0 0 spacing.$unit 0;
	}
</style>
