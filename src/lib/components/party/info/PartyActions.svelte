<script lang="ts">
	/**
	 * The buttons beside a party's name: whose collection to view (when it
	 * uses someone else's), Edit for those who can, the calculator, and the
	 * page's menu.
	 */
	import * as m from '$lib/paraglide/messages'
	import type { Snippet } from 'svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Tooltip from '$lib/components/ui/Tooltip.svelte'
	import CollectionViewerSwitcher from './CollectionViewerSwitcher.svelte'
	import type { AvatarUser } from '$lib/utils/avatar'

	interface Props {
		/** The signed-in user, who can switch to viewing their own collection */
		authUser?: AvatarUser | null | undefined
		collectionSourceUser?: AvatarUser | null | undefined
		/** Which collection is being viewed */
		activeCollectionUser?: 'viewer' | 'source'
		onSwitchCollectionUser?: ((target: 'viewer' | 'source') => void) | undefined
		canEdit?: boolean
		onOpenEdit?: (() => void) | undefined
		onOpenCalculator?: (() => void) | undefined
		menu?: Snippet | undefined
		/** The "Add sticker" button and its picker */
		stickerPicker?: Snippet | undefined
	}

	let {
		authUser,
		collectionSourceUser,
		activeCollectionUser = 'viewer',
		onSwitchCollectionUser,
		canEdit = false,
		onOpenEdit,
		onOpenCalculator,
		menu,
		stickerPicker
	}: Props = $props()

	const showCollectionSwitcher = $derived(
		!!authUser?.username &&
			!!collectionSourceUser?.username &&
			authUser.username !== collectionSourceUser.username
	)
</script>

<div class="actions">
	{#if showCollectionSwitcher && authUser && collectionSourceUser}
		<CollectionViewerSwitcher
			{authUser}
			{collectionSourceUser}
			{activeCollectionUser}
			onSwitchCollectionUser={(v) => onSwitchCollectionUser?.(v)}
		/>
	{/if}
	{#if canEdit}
		<Button variant="secondary" size="small" onclick={onOpenEdit}>{m.action_edit()}</Button>
	{/if}
	{#if onOpenCalculator}
		<Tooltip content={m.calculator_open_short()}>
			<Button
				variant="ghost"
				size="small"
				iconOnly
				icon="calculator"
				aria-label={m.calculator_open_short()}
				onclick={onOpenCalculator}
			/>
		</Tooltip>
	{/if}
	{#if stickerPicker}
		{@render stickerPicker()}
	{/if}
	{#if menu}
		{@render menu()}
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;

	.actions {
		display: flex;
		align-items: center;
		gap: $unit-half;
		flex-shrink: 0;
	}
</style>
