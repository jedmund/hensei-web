<script lang="ts">
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import ModalHeader from '$lib/components/ui/ModalHeader.svelte'
	import ModalBody from '$lib/components/ui/ModalBody.svelte'
	import ModalFooter from '$lib/components/ui/ModalFooter.svelte'

	interface Props {
		open: boolean
		partyName: string
		deleting?: boolean
		onDelete: () => void
		onCancel: () => void
	}

	let { open = $bindable(), partyName, deleting = false, onDelete, onCancel }: Props = $props()
</script>

<Dialog bind:open>
	{#snippet children()}
		<ModalHeader title="Delete {partyName}?" />
		<ModalBody>
			<p class="message">Are you sure you want to permanently delete this team?</p>
		</ModalBody>
		<ModalFooter
			{onCancel}
			cancelDisabled={deleting}
			primaryAction={{
				label: deleting ? 'Deleting...' : 'Yes, delete',
				onclick: onDelete,
				destructive: true,
				disabled: deleting
			}}
		/>
	{/snippet}
</Dialog>

<style lang="scss">
	@use '$src/themes/typography' as *;

	.message {
		margin: 0;
		font-size: $font-regular;
		line-height: 1.4;
		color: var(--text-primary);
		text-align: left;
	}
</style>
