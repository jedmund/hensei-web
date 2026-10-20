<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import type { Snippet } from 'svelte'
	import DescriptionPreview from './DescriptionPreview.svelte'
	import PartyActions from './PartyActions.svelte'
	import PartyByline from './PartyByline.svelte'
	import PartySettings from './PartySettings.svelte'
	import StickerArea from '$lib/components/stickers/StickerArea.svelte'
	import type { AvatarUser } from '$lib/utils/avatar'
	import type { Party } from '$lib/types/api/party'

	/**
	 * The top of a party page: its name and actions, who it's by, its
	 * settings chips, and the start of its description.
	 */
	interface Props {
		party: Party
		/** The signed-in user (for the collection viewer switcher) */
		authUser?: AvatarUser | null
		/** Which collection is currently being viewed */
		activeCollectionUser?: 'viewer' | 'source'
		onSwitchCollectionUser?: (target: 'viewer' | 'source') => void
		canEdit?: boolean
		/** When true, the difficulty tier chip links to the editor preview */
		isEditor?: boolean
		onOpenDescription: () => void
		onEditDescription?: () => void
		onOpenEdit?: () => void
		onOpenCalculator?: () => void
		/** The overflow menu, last in the header */
		menu?: Snippet
		/** The Remix button, before the calculator */
		remix?: Snippet | undefined
		/** The "Add sticker" button and its picker */
		stickerPicker?: Snippet | undefined
		/** The viewer can give this team a sticker */
		canGiveSticker?: boolean
	}

	let {
		party,
		authUser,
		activeCollectionUser = 'viewer',
		onSwitchCollectionUser,
		canEdit = false,
		isEditor = false,
		onOpenDescription,
		onEditDescription,
		onOpenEdit,
		onOpenCalculator,
		menu,
		remix,
		stickerPicker,
		canGiveSticker = false
	}: Props = $props()
</script>

<div class="description-tile" data-sticker-bounds>
	<!-- Header: Title + Actions -->
	<div class="tile-header-container">
		<div class="tile-header">
			<h1 class="party-name" class:empty={!party.name}>{party.name || m.party_untitled()}</h1>
			<PartyActions
				{authUser}
				collectionSourceUser={party.collectionSourceUser}
				{activeCollectionUser}
				{onSwitchCollectionUser}
				{canEdit}
				{onOpenEdit}
				{onOpenCalculator}
				{menu}
				{remix}
				{stickerPicker}
			/>
		</div>

		<PartyByline
			user={party.user}
			sourceParty={party.sourceParty}
			collectionSourceUser={party.collectionSourceUser}
			visibility={party.visibility}
			updatedAt={party.lastUpdated ?? party.updatedAt}
		/>
	</div>

	<PartySettings {party} {isEditor} />

	<DescriptionPreview
		description={party.description}
		{canEdit}
		element={party.user?.avatar?.element}
		onOpen={onOpenDescription}
		onEdit={onEditDescription}
	/>

	<!-- Stickers the team has received, then the picker -->
	{#if (party.placedStickers?.length ?? 0) > 0 || party.mySticker || canGiveSticker}
		<div class="stickers">
			<StickerArea {party} canGive={canGiveSticker} />
		</div>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/typography' as *;

	.description-tile {
		background: var(--card-bg);
		border: 0.5px solid var(--button-bg);
		border-radius: $card-corner;
		padding: $unit-2x $unit-2x $unit $unit-2x;
		display: flex;
		flex-direction: column;
		gap: $unit;
		// Visible so placed stickers can hang past the card's edges
		overflow: visible;
		position: relative;
	}

	.tile-header-container {
		display: flex;
		flex-direction: column;
		gap: $unit-half;
	}

	.tile-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: $unit;
	}

	.party-name {
		font-size: $font-large;
		font-weight: $medium;
		color: var(--text-primary);
		margin: 0;
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;

		&.empty {
			color: var(--text-tertiary);
		}
	}

	.stickers {
		// The tile's top padding again below the sticker area
		padding-bottom: $unit;
		transition:
			margin 0.3s cubic-bezier(0.2, 0.8, 0.2, 1),
			padding 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);

		// An empty area (no stickers yet) takes no space until a drag opens it
		&:has(:global(.area.collapsed)) {
			margin-top: -$unit;
			padding-bottom: 0;
		}
	}
</style>
