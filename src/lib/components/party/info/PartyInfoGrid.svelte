<script lang="ts">
	import type { Snippet } from 'svelte'
	import type { Party } from '$lib/types/api/party'
	import type { RaidFull } from '$lib/types/api/raid'
	import DescriptionTile from './DescriptionTile.svelte'
	import RaidTile from './RaidTile.svelte'
	import VideoTile from './VideoTile.svelte'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import * as m from '$lib/paraglide/messages'
	import PartiesPane from '$lib/components/sidebar/PartiesPane.svelte'
	import CalculatorPane from '$lib/components/sidebar/CalculatorPane.svelte'
	import { getCharacterImage, getRaidImage } from '$lib/utils/images'
	import { appLocale, localizedName } from '$lib/utils/locale'
	import type { FilterItem } from '$lib/types/filter'
	import { isFullExpedition, solomonisName } from '$lib/components/solomonis/party/solomonisParty'
	import { openSolomonisDetailsPane } from '$lib/components/solomonis/party/openSolomonisPanes'

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
		isEditor?: boolean
	}

	let {
		party,
		canEdit,
		onOpenDescription,
		onEditDescription,
		onOpenEdit,
		onRaidSelect,
		menu,
		authUser,
		activeCollectionUser,
		onSwitchCollectionUser,
		isEditor = false
	}: Props = $props()

	// Check if data exists for each tile
	const hasRaid = $derived(!!party.raid)
	const hasVideo = $derived(!!party.videoUrl)

	// Show tile if: has data OR (is owner's team and can prompt to fill)
	const showRaid = $derived(hasRaid || canEdit)
	const showVideo = $derived(hasVideo || canEdit)
	const showRow2 = $derived(showVideo || showRaid)

	function handleOpenCalculator() {
		if (!party.shortcode) return
		sidebar.openWithComponent(
			m.pane_skill_boosts(),
			CalculatorPane,
			{ shortcode: party.shortcode, element: party.element },
			{ scrollable: true }
		)
	}

	// Evoking Solomonis: the tile shows the route Evoker and opens the details pane
	const expedition = $derived(isFullExpedition(party.solomonis) ? party.solomonis : null)
	const locale = appLocale()

	function handleViewSolomonisDetails() {
		openSolomonisDetailsPane(() => party, canEdit)
	}

	function handleRaidClick() {
		if (!party.raid) return

		const raidName = localizedName(party.raid.name)
		// Solomonis zones have no element; their teams differ by route Evoker
		// instead, and some elements have two Evokers.
		const evokerFilter: FilterItem[] | undefined = expedition
			? [
					{
						kind: 'evoker' as const,
						value: expedition.routeEvoker.granblueId,
						label: solomonisName(expedition.routeEvoker.name, locale)
					}
				]
			: undefined

		sidebar.openWithComponent(
			raidName,
			PartiesPane,
			{
				pinnedFilters: [
					{
						kind: 'raid' as const,
						value: party.raid.id,
						label: localizedName(party.raid.name) ?? party.raid.slug,
						pinned: true
					}
				],
				defaultElement: party.element,
				defaultFilters: evokerFilter,
				excludedKinds: ['raid'] as const,
				resetKey: expedition
					? `${party.raid.id}:${expedition.routeEvoker.granblueId}`
					: party.raid.id
			},
			{
				scrollable: true,
				image: expedition
					? getCharacterImage(expedition.routeEvoker.granblueId, 'square')
					: getRaidImage(party.raid.slug)
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
			updatedAt={party.lastUpdated ?? party.updatedAt}
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
			onOpenCalculator={handleOpenCalculator}
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
			difficulty={party.difficulty}
			shortcode={party.shortcode}
			{isEditor}
		/>
	</div>

	<!-- Row 2: Video + Raid -->
	{#if showRow2}
		<div class="row row-2" class:single={!showVideo || !showRaid}>
			{#if showVideo}
				<VideoTile videoUrl={party.videoUrl} {canEdit} onAdd={onOpenEdit} />
			{/if}

			{#if showRaid}
				<RaidTile
					raid={party.raid}
					{canEdit}
					onclick={handleRaidClick}
					{onRaidSelect}
					{expedition}
					onViewDetails={expedition ? handleViewSolomonisDetails : undefined}
				/>
			{/if}
		</div>
	{/if}
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
