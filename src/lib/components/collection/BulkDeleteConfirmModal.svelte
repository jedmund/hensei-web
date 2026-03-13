<script lang="ts">
	import * as m from '$lib/paraglide/messages'
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

	const entityNameMap: Record<string, string> = {
		characters: m.collection_entity_characters(),
		weapons: m.collection_entity_weapons(),
		summons: m.collection_entity_summons(),
		artifacts: m.collection_entity_artifacts()
	}

	const itemLabel = $derived(entityNameMap[entityType] ?? entityType)
</script>

<Dialog bind:open>
	{#snippet children()}
		<ModalHeader title={m.collection_bulk_delete_title({ count, type: itemLabel })} />
		<ModalBody>
			<p class="message">
				{m.collection_bulk_delete_message({ count, type: itemLabel })}
			</p>
		</ModalBody>
		<ModalFooter
			{onCancel}
			cancelDisabled={deleting}
			primaryAction={{
				label: deleting ? m.collection_bulk_deleting() : m.collection_bulk_delete_confirm(),
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
