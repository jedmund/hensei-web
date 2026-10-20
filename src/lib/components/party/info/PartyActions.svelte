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
		/** The overflow menu, last */
		menu?: Snippet | undefined
		/** The Remix button, before the calculator */
		remix?: Snippet | undefined
		/** The "Add sticker" button and its picker */
		stickerPicker?: Snippet | undefined
		/** The team's element, which colors the buttons' hover */
		element?: string | null | undefined
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
		remix,
		stickerPicker,
		element
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
	<!-- The team's actions, grouped on a raised pill -->
	<div
		class="action-pill"
		style:--pill-hover-bg={element ? `var(--${element}-nav-selected-bg)` : undefined}
		style:--pill-hover-text={element ? `var(--${element}-nav-selected-text)` : undefined}
	>
		{#if canEdit}
			<Tooltip content={m.party_edit_team()}>
				<Button
					variant="ghost"
					size="small"
					iconOnly
					icon="edit"
					aria-label={m.party_edit_team()}
					onclick={onOpenEdit}
				/>
			</Tooltip>
		{/if}
		{#if stickerPicker}
			{@render stickerPicker()}
		{/if}
		{#if remix}
			{@render remix()}
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
		{#if menu}
			{@render menu()}
		{/if}
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;

	.actions {
		display: flex;
		align-items: center;
		gap: $unit-half;
		flex-shrink: 0;
	}

	.action-pill {
		display: flex;
		align-items: center;
		gap: $unit-fourth;
		padding: $unit-fourth;
		border-radius: $full-corner;
		background: var(--card-bg);
		box-shadow: var(--shadow-sm);

		// Round hovers, to match the pill, in the team's element (as the
		// element-ghost button does); teams without one keep the usual hover
		:global([data-button-root]) {
			border-radius: $full-corner;
		}

		:global([data-button-root]:hover:not(:disabled)) {
			background-color: var(--pill-hover-bg, var(--button-bg));
			color: var(--pill-hover-text, var(--button-text-hover));
		}
	}
</style>
