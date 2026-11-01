<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import { toMultiPlayerChartData } from '$lib/utils/gw'
	import type { GwIndividualScore } from '$lib/types/api/gw'
	import type { PlayerScore } from '$lib/features/crew/playerScores'
	import GwMultiPlayerChart from '$lib/components/charts/GwMultiPlayerChart.svelte'
	import CrewSectionHeader from '$lib/components/crew/CrewSectionHeader.svelte'
	import CrewStatusMessage from '$lib/components/crew/CrewStatusMessage.svelte'
	import PlayerScoreRow from '$lib/components/crew/PlayerScoreRow.svelte'

	interface Props {
		individualScores: GwIndividualScore[] | undefined
		playerScores: PlayerScore[]
		isOfficer: boolean
		onEditScore: (player: PlayerScore) => void
	}

	const { individualScores, playerScores, isOfficer, onEditScore }: Props = $props()

	const multiPlayerChartData = $derived(
		individualScores ? toMultiPlayerChartData(individualScores) : new Map()
	)
</script>

{#if multiPlayerChartData.size > 0}
	<div class="chart-section">
		<GwMultiPlayerChart playerScores={multiPlayerChartData} />
	</div>
{/if}

<CrewSectionHeader title={m.gw_individual_scores()} />

{#if playerScores.length > 0}
	<ul class="player-list">
		{#each playerScores as player, index (player.id)}
			<PlayerScoreRow
				{player}
				rank={index + 1}
				{isOfficer}
				onEditScore={() => onEditScore(player)}
			/>
		{/each}
	</ul>
{:else}
	<CrewStatusMessage variant="empty" as="p" message={m.gw_no_scores_short()} />
{/if}

<style lang="scss">
	@use '$src/themes/crew' as crew;

	.chart-section {
		@include crew.chart-section;
	}

	.player-list {
		@include crew.row-list;
	}
</style>
