<script lang="ts">
	import type { Snippet } from 'svelte'
	import type { Party } from '$lib/types/api/party'
	import type { RaidFull } from '$lib/types/api/raid'
	import DescriptionTile from './DescriptionTile.svelte'
	import RaidTile from './RaidTile.svelte'
	import VideoTile from './VideoTile.svelte'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import PartiesPane from '$lib/components/sidebar/PartiesPane.svelte'
	import { getRaidImage } from '$lib/utils/images'
	import { localizedName } from '$lib/utils/locale'

	type AvatarUser = {
		username?: string
		avatar?: {
			picture?: string | null
			element?: string | null
		} | null
	}

	interface Props {
		party: Party
		canEdit: boolean
		onOpenDescription: () => void
		onEditDescription?: () => void
		onOpenEdit?: () => void
		onRaidSelect?: (raid: RaidFull | null) => void
		menu?: Snippet
		authUser?: AvatarUser | null
		activeCollectionUser?: 'viewer' | 'source'
		onSwitchCollectionUser?: (target: 'viewer' | 'source') => void
	}

	let { party, canEdit, onOpenDescription, onEditDescription, onOpenEdit, onRaidSelect, menu, authUser, activeCollectionUser, onSwitchCollectionUser }: Props = $props()

	// Check if data exists for each tile
	const hasRaid = $derived(!!party.raid)

	// Show tile if: has data OR (is owner's team and can prompt to fill)
	const showRaid = $derived(hasRaid || canEdit)

	function handleRaidClick() {
		if (!party.raid) return

		const raidName = localizedName(party.raid.name)

		sidebar.openWithComponent(
			raidName,
			PartiesPane,
			{
				pinnedFilters: [{
					kind: 'raid' as const,
					value: party.raid.id,
					label: localizedName(party.raid.name) ?? party.raid.slug,
					pinned: true
				}],
				defaultElement: party.element,
				excludedKinds: ['raid'] as const,
				resetKey: party.raid.id
			},
			{
				scrollable: true,
				image: getRaidImage(party.raid.slug)
			}
		)
	}
</script>

<div class="party-info-grid">
	<!-- Row 1: Description -->
	<div class="row row-1">
		<DescriptionTile
			name={party.name}
			description={party.description}
			updatedAt={party.updatedAt}
			visibility={party.visibility}
			user={party.user}
			collectionSourceUser={party.collectionSourceUser}
			sourceParty={party.sourceParty}
			{authUser}
			{activeCollectionUser}
			{onSwitchCollectionUser}
			{canEdit}
			{onOpenDescription}
			{onEditDescription}
			{onOpenEdit}
			{menu}
			fullAuto={party.fullAuto}
			solo={party.solo}
			autoGuard={party.autoGuard}
			autoSummon={party.autoSummon}
			chargeAttack={party.chargeAttack}
			clearTime={party.clearTime}
			buttonCount={party.buttonCount}
			chainCount={party.chainCount}
			summonCount={party.summonCount}
		/>
	</div>

	<!-- Row 2: Video + Raid -->
	<div class="row row-2" class:single={!showRaid}>
		<VideoTile videoUrl={party.videoUrl} {canEdit} onAdd={onOpenEdit} />

		{#if showRaid}
			<RaidTile raid={party.raid} {canEdit} onclick={handleRaidClick} {onRaidSelect} />
		{/if}
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;

	.party-info-grid {
		display: flex;
		flex-direction: column;
		gap: $unit-2x;
	}

	.row {
		display: grid;
		gap: $unit-2x;
	}

	.row-1 {
		grid-template-columns: 1fr;
	}

	.row-2 {
		grid-template-columns: repeat(2, 1fr);

		&.single {
			grid-template-columns: 1fr;
		}
	}

	// Mobile breakpoint
	@media (max-width: 768px) {
		.row-2 {
			grid-template-columns: 1fr;
		}
	}
</style>
