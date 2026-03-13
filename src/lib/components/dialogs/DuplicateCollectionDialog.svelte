<script lang="ts">
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import ModalHeader from '$lib/components/ui/ModalHeader.svelte'
	import ModalBody from '$lib/components/ui/ModalBody.svelte'
	import ModalFooter from '$lib/components/ui/ModalFooter.svelte'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		open: boolean
		onConfirm: () => void
		onCancel: () => void
	}

	let { open = $bindable(), onConfirm, onCancel }: Props = $props()
</script>

<Dialog bind:open>
	{#snippet children()}
		<ModalHeader title={m.duplicate_collection_title()} />
		<ModalBody>
			<p class="message">
				{m.duplicate_collection_body()}
			</p>
		</ModalBody>
		<ModalFooter
			{onCancel}
			primaryAction={{
				label: m.duplicate_collection_confirm(),
				onclick: onConfirm
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
