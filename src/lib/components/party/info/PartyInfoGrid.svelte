<script lang="ts">
	import type { Party } from '$lib/types/api/party'
	import DescriptionTile from './DescriptionTile.svelte'
	import RaidTile from './RaidTile.svelte'
	import BattleTile from './BattleTile.svelte'
	import VideoTile from './VideoTile.svelte'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import RaidPartiesPane from '$lib/components/sidebar/RaidPartiesPane.svelte'
	import { getRaidImage } from '$lib/utils/images'

	interface Props {
		party: Party
		canEdit: boolean
		onOpenDescription: () => void
		onOpenEdit?: () => void
	}

	let { party, canEdit, onOpenDescription, onOpenEdit }: Props = $props()

	// Check if data exists for each tile
	const hasDescription = $derived(!!party.description)
	const hasRaid = $derived(!!party.raid)
	const hasVideo = $derived(!!party.videoUrl)

	// Show tile if: has data OR (is owner's team and can prompt to fill)
	const showDescription = $derived(hasDescription || canEdit)
	const showRaid = $derived(hasRaid || canEdit)
	// Video tile only shown when there's a video (no empty placeholder)
	const showVideo = $derived(hasVideo)
	// Battle tile always shown - settings have default values

	function handleRaidClick() {
		if (!party.raid) return

		const raidName =
			typeof party.raid.name === 'string'
				? party.raid.name
				: party.raid.name?.en || 'Raid Parties'

		sidebar.openWithComponent(raidName, RaidPartiesPane, { raid: party.raid }, {
			scrollable: true,
			image: getRaidImage(party.raid.slug)
		})
	}
</script>

<div class="party-info-grid">
	<!-- Row 1: Description + Video -->
	<div class="row row-1" class:single={!showVideo}>
		{#if showDescription}
			<DescriptionTile description={party.description} onOpen={onOpenDescription} />
		{/if}

		{#if showVideo}
			<VideoTile videoUrl={party.videoUrl} />
		{/if}
	</div>

	<!-- Row 2: Battle + Raid -->
	<div class="row row-2" class:single={!showRaid}>
		<BattleTile
			fullAuto={party.fullAuto}
			autoGuard={party.autoGuard}
			autoSummon={party.autoSummon}
			chargeAttack={party.chargeAttack}
			clearTime={party.clearTime}
			buttonCount={party.buttonCount}
			chainCount={party.chainCount}
			summonCount={party.summonCount}
			clickable={canEdit}
			onclick={onOpenEdit}
		/>

		{#if showRaid}
			<RaidTile raid={party.raid} onclick={handleRaidClick} />
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
		grid-template-columns: 2fr 1fr;

		&.single {
			grid-template-columns: 1fr;
		}
	}

	.row-2 {
		grid-template-columns: repeat(2, 1fr);

		&.single {
			grid-template-columns: 1fr;
		}
	}

	// Tablet breakpoint
	@media (max-width: 1024px) {
		.row-1 {
			grid-template-columns: 1fr;
		}

		.row-2 {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	// Mobile breakpoint
	@media (max-width: 768px) {
		.row-1,
		.row-2 {
			grid-template-columns: 1fr;
		}
	}
</style>
