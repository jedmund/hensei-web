<script lang="ts">
	/**
	 * Reusable destructive-confirmation dialog for removing a unit (character /
	 * weapon / summon) from a team. Owned by the calling Unit component so the
	 * remove handler stays local; this just renders the modal chrome.
	 */
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import ModalHeader from '$lib/components/ui/ModalHeader.svelte'
	import ModalBody from '$lib/components/ui/ModalBody.svelte'
	import ModalFooter from '$lib/components/ui/ModalFooter.svelte'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		open: boolean
		type: 'character' | 'weapon' | 'summon'
		name?: string | null
		onConfirm: () => void | Promise<void>
	}

	let { open = $bindable(), type, name, onConfirm }: Props = $props()

	const typeLabel = $derived(
		type === 'character'
			? m.type_character()
			: type === 'weapon'
				? m.type_weapon()
				: m.type_summon()
	)

	async function handleConfirm() {
		try {
			await onConfirm()
		} finally {
			open = false
		}
	}
</script>

<Dialog bind:open size="small">
	<ModalHeader title={m.remove_unit_confirm_title({ type: typeLabel })} />
	<ModalBody>
		<p>
			{name
				? m.remove_unit_confirm_body({ name })
				: m.remove_unit_confirm_body_unnamed({ type: typeLabel })}
		</p>
	</ModalBody>
	<ModalFooter
		onCancel={() => (open = false)}
		primaryAction={{
			label: m.remove_unit_confirm_action(),
			onclick: handleConfirm,
			destructive: true
		}}
	/>
</Dialog>
