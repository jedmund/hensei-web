<script lang="ts">
	import type { Party } from '$lib/types/api/party'
	import DescriptionTile from './DescriptionTile.svelte'
	import RaidTile from './RaidTile.svelte'
	import PerformanceTile from './PerformanceTile.svelte'
	import SettingsTile from './SettingsTile.svelte'
	import VideoTile from './VideoTile.svelte'

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
	const hasPerformanceData = $derived(
		party.clearTime != null ||
			party.buttonCount != null ||
			party.chainCount != null ||
			party.summonCount != null
	)
	const hasVideo = $derived(!!party.videoUrl)

	// Show tile if: has data OR (is owner's team and can prompt to fill)
	const showDescription = $derived(hasDescription || canEdit)
	const showRaid = $derived(hasRaid || canEdit)
	const showPerformance = $derived(hasPerformanceData || canEdit)
	const showVideo = $derived(hasVideo || canEdit)
	// Settings always shown - they have default values
</script>

<div class="party-info-grid">
	<!-- Row 1: Description + Raid -->
	<div class="row row-1">
		{#if showDescription}
			<DescriptionTile description={party.description} onOpen={onOpenDescription} />
		{/if}

		{#if showRaid}
			<RaidTile raid={party.raid} />
		{/if}
	</div>

	<!-- Row 2: Performance, Settings, Video -->
	<div class="row row-2">
		{#if showPerformance}
			<PerformanceTile
				clearTime={party.clearTime}
				buttonCount={party.buttonCount}
				chainCount={party.chainCount}
				summonCount={party.summonCount}
				clickable={canEdit}
				onclick={onOpenEdit}
			/>
		{/if}

		<SettingsTile
			fullAuto={party.fullAuto}
			autoGuard={party.autoGuard}
			autoSummon={party.autoSummon}
			chargeAttack={party.chargeAttack}
			clickable={canEdit}
			onclick={onOpenEdit}
		/>

		{#if showVideo}
			<VideoTile videoUrl={party.videoUrl} />
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

		// If only one item, let it take full width
		&:has(> :only-child) {
			grid-template-columns: 1fr;
		}
	}

	.row-2 {
		grid-template-columns: repeat(3, 1fr);

		// Adjust columns based on number of children
		&:has(> :nth-child(2):last-child) {
			grid-template-columns: repeat(2, 1fr);
		}

		&:has(> :only-child) {
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

			&:has(> :nth-child(3)) {
				grid-template-columns: repeat(2, 1fr);

				// Third item spans full width
				> :nth-child(3) {
					grid-column: 1 / -1;
				}
			}
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
