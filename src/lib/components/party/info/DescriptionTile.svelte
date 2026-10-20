<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import type { Snippet } from 'svelte'
	import DescriptionPreview from './DescriptionPreview.svelte'
	import PartyActions from './PartyActions.svelte'
	import PartyByline from './PartyByline.svelte'
	import PartySettings from './PartySettings.svelte'
	import type { AvatarUser } from '$lib/utils/avatar'
	import type { PartyDifficulty } from '$lib/types/api/party'
	import type { PartyVisibility } from '$lib/types/visibility'

	interface Props {
		name?: string
		description?: string
		user?: AvatarUser | null
		collectionSourceUser?: AvatarUser | null
		sourceParty?: {
			shortcode?: string
			name?: string
			user?: AvatarUser | null
		} | null
		/** The currently authenticated user (for collection viewer switcher) */
		authUser?: AvatarUser | null
		/** Which collection is currently being viewed */
		activeCollectionUser?: 'viewer' | 'source'
		/** Callback when collection viewer is switched */
		onSwitchCollectionUser?: (target: 'viewer' | 'source') => void
		updatedAt?: string
		visibility?: PartyVisibility
		canEdit?: boolean
		onOpenDescription: () => void
		onEditDescription?: () => void
		onOpenEdit?: () => void
		onOpenCalculator?: () => void
		menu?: Snippet
		// Battle settings
		fullAuto?: boolean
		solo?: boolean
		autoGuard?: boolean
		autoSummon?: boolean
		chargeAttack?: boolean
		// Performance
		clearTime?: number | null
		buttonCount?: number | null
		chainCount?: number | null
		summonCount?: number | null
		// Computed difficulty assignment (null when not yet scoreable)
		difficulty?: PartyDifficulty | null
		/** Party shortcode, used to build the editor preview link */
		shortcode?: string
		/** When true, the difficulty tier chip becomes a link to the editor preview */
		isEditor?: boolean
	}

	let {
		name,
		description,
		user,
		collectionSourceUser,
		sourceParty,
		authUser,
		activeCollectionUser = 'viewer',
		onSwitchCollectionUser,
		updatedAt,
		visibility,
		canEdit = false,
		onOpenDescription,
		onEditDescription,
		onOpenEdit,
		onOpenCalculator,
		menu,
		fullAuto,
		solo,
		autoGuard,
		autoSummon,
		chargeAttack,
		clearTime,
		buttonCount,
		chainCount,
		summonCount,
		difficulty,
		shortcode,
		isEditor = false
	}: Props = $props()
</script>

<div class="description-tile">
	<!-- Header: Title + Actions -->
	<div class="tile-header-container">
		<div class="tile-header">
			<h1 class="party-name" class:empty={!name}>{name || m.party_untitled()}</h1>
			<PartyActions
				{authUser}
				{collectionSourceUser}
				{activeCollectionUser}
				{onSwitchCollectionUser}
				{canEdit}
				{onOpenEdit}
				{onOpenCalculator}
				{menu}
			/>
		</div>

		<PartyByline {user} {sourceParty} {collectionSourceUser} {visibility} {updatedAt} />
	</div>

	<PartySettings
		{solo}
		{chargeAttack}
		{fullAuto}
		{autoSummon}
		{autoGuard}
		{clearTime}
		{buttonCount}
		{chainCount}
		{summonCount}
		{difficulty}
		{shortcode}
		{isEditor}
	/>

	<DescriptionPreview
		{description}
		{canEdit}
		element={user?.avatar?.element}
		onOpen={onOpenDescription}
		onEdit={onEditDescription}
	/>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/effects' as *;
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
