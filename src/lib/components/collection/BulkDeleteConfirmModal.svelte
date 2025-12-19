<script lang="ts">
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import ModalHeader from '$lib/components/ui/ModalHeader.svelte'
	import ModalBody from '$lib/components/ui/ModalBody.svelte'
	import ModalFooter from '$lib/components/ui/ModalFooter.svelte'

	interface Props {
		open: boolean
		count: number
		entityType: string
		deleting?: boolean
		onConfirm: () => void
		onCancel: () => void
	}

	let {
		open = $bindable(),
		count,
		entityType,
		deleting = false,
		onConfirm,
		onCancel
	}: Props = $props()

	const itemLabel = $derived(count === 1 ? entityType.slice(0, -1) : entityType)
</script>

<Dialog bind:open>
	{#snippet children()}
		<ModalHeader title="Delete {count} {itemLabel}?" />
		<ModalBody>
			<p class="message">
				Are you sure you want to remove {count}
				{itemLabel} from your collection? This action cannot be undone.
			</p>
		</ModalBody>
		<ModalFooter
			{onCancel}
			cancelDisabled={deleting}
			primaryAction={{
				label: deleting ? 'Deleting...' : 'Yes, delete',
				onclick: onConfirm,
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
