<script lang="ts">
	/**
	 * TraversalSection - how many of each kind of space an expedition
	 * visited, laid out in two columns with the game's icons, as in its report.
	 */
	import * as m from '$lib/paraglide/messages'
	import DetailsSection from '$lib/components/sidebar/details/DetailsSection.svelte'
	import { getSolomonisSpaceIcon } from '$lib/utils/images'
	import type { SolomonisStats } from '$lib/types/api/solomonis'
	import { spaceStats, type SpaceStatKey } from './solomonisParty'

	interface Props {
		stats: SolomonisStats
	}

	let { stats }: Props = $props()

	const SPACE_LABELS: Record<SpaceStatKey, () => string> = {
		battle: m.solomonis_web_party_space_battle,
		strong: m.solomonis_web_party_space_strong,
		terrifying: m.solomonis_web_party_space_terrifying,
		ruler: m.solomonis_web_party_space_ruler,
		boss: m.solomonis_web_party_space_boss,
		event: m.solomonis_web_party_space_event,
		healing: m.solomonis_web_party_space_healing,
		chest: m.solomonis_web_party_space_chest,
		teleporter: m.solomonis_web_party_space_teleporter,
		special: m.solomonis_web_party_space_special
	}
</script>

<DetailsSection title={m.solomonis_web_party_spaces()}>
	<!-- Two columns like the game: combat spaces, then the rest -->
	<ul class="space-grid">
		{#each spaceStats(stats) as stat (stat.key)}
			<li class="space">
				<img src={getSolomonisSpaceIcon(stat.key)} alt="" class="space-icon" />
				<span class="space-label">{SPACE_LABELS[stat.key]()}</span>
				<span class="space-count">{stat.count}</span>
			</li>
		{/each}
	</ul>
</DetailsSection>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;

	// Two columns of five, separated by space alone
	.space-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		grid-template-rows: repeat(5, auto);
		grid-auto-flow: column;
		column-gap: $unit-3x;
		row-gap: $unit-half;
		margin: 0;
		padding: 0 $unit;
		list-style: none;
	}

	.space {
		display: flex;
		align-items: center;
		gap: $unit;
		min-height: $unit-4x;
	}

	.space-icon {
		width: $unit-3x;
		height: $unit-3x;
		object-fit: contain;
		flex-shrink: 0;
	}

	.space-label {
		flex: 1;
		min-width: 0;
		font-size: $font-regular;
		color: var(--text-secondary);
	}

	.space-count {
		font-size: $font-regular;
		font-weight: $medium;
		color: var(--text-primary);
		font-variant-numeric: tabular-nums;
	}
</style>
