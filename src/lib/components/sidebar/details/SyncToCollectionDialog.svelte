
<script lang="ts">
	import Dialog from '../../ui/Dialog.svelte'
	import ModalHeader from '../../ui/ModalHeader.svelte'
	import ModalBody from '../../ui/ModalBody.svelte'
	import ModalFooter from '../../ui/ModalFooter.svelte'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		open: boolean
		type: 'character' | 'weapon' | 'summon'
		onConfirm: () => Promise<void>
	}

	let { open = $bindable(false), type, onConfirm }: Props = $props()

	const typeLabel = $derived(
		type === 'character'
			? m.type_character()
			: type === 'weapon'
				? m.type_weapon()
				: m.type_summon()
	)
</script>

<Dialog bind:open>
	{#snippet children()}
		<ModalHeader title={m.sync_to_collection_title()} />
		<ModalBody>
			<p class="sync-message">
				{m.sync_to_collection_body({ type: typeLabel })}
			</p>
		</ModalBody>
		<ModalFooter
			onCancel={() => {
				open = false
			}}
			primaryAction={{
				label: m.sync_to_collection_confirm(),
				onclick: async () => {
					await onConfirm()
					open = false
				}
			}}
		/>
	{/snippet}
</Dialog>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;

	.sync-message {
		margin: 0;
		font-size: $font-regular;
		line-height: 1.4;
		color: var(--text-primary);
	}
</style>
