<svelte:options runes={true} />

<script lang="ts">
	import Dialog from '../../ui/Dialog.svelte'
	import ModalHeader from '../../ui/ModalHeader.svelte'
	import ModalBody from '../../ui/ModalBody.svelte'
	import ModalFooter from '../../ui/ModalFooter.svelte'

	interface Props {
		open: boolean
		onConfirm: () => Promise<void>
	}

	let { open = $bindable(false), onConfirm }: Props = $props()
</script>

<Dialog bind:open>
	{#snippet children()}
		<ModalHeader title="Clear collection source?" />
		<ModalBody>
			<p class="unlink-message">
				All collection links will be removed from items in this party. The items themselves will
				remain.
			</p>
		</ModalBody>
		<ModalFooter
			onCancel={() => {
				open = false
			}}
			primaryAction={{
				label: 'Clear',
				onclick: async () => {
					await onConfirm()
					open = false
				},
				destructive: true
			}}
		/>
	{/snippet}
</Dialog>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;

	.unlink-message {
		margin: 0;
		font-size: $font-regular;
		line-height: 1.4;
		color: var(--text-primary);
	}
</style>
