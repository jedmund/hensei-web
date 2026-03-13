
<script lang="ts">
	import Dialog from '../../ui/Dialog.svelte'
	import ModalHeader from '../../ui/ModalHeader.svelte'
	import ModalBody from '../../ui/ModalBody.svelte'
	import ModalFooter from '../../ui/ModalFooter.svelte'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		open: boolean
		onConfirm: () => Promise<void>
	}

	let { open = $bindable(false), onConfirm }: Props = $props()
</script>

<Dialog bind:open>
	{#snippet children()}
		<ModalHeader title={m.unlink_collection_title()} />
		<ModalBody>
			<p class="unlink-message">
				{m.unlink_collection_body()}
			</p>
		</ModalBody>
		<ModalFooter
			onCancel={() => {
				open = false
			}}
			primaryAction={{
				label: m.unlink_collection_confirm(),
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
