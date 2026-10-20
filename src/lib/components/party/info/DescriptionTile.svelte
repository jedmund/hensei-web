<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import type { Snippet } from 'svelte'
	import DescriptionPreview from './DescriptionPreview.svelte'
	import PartyActions from './PartyActions.svelte'
	import PartyByline from './PartyByline.svelte'
	import PartySettings from './PartySettings.svelte'
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
		menu?: Snippet
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
		menu
	}: Props = $props()
</script>

<div class="description-tile">
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
		overflow: hidden;
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
</style>
