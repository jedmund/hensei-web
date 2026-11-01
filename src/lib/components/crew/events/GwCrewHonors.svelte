<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import { DropdownMenu as DropdownMenuBase } from 'bits-ui'
	import Button from '$lib/components/ui/Button.svelte'
	import DropdownMenu from '$lib/components/ui/DropdownMenu.svelte'
	import GwCrewBattleChart from '$lib/components/charts/GwCrewBattleChart.svelte'
	import { formatScore, toCrewBattleChartData } from '$lib/utils/gw'
	import { crewScoresByRound } from '$lib/features/crew/playerScores'
	import { GW_ROUND_LABELS, type GwCrewScore, type GwRound } from '$lib/types/api/gw'

	interface Props {
		crewScores: GwCrewScore[]
		isOfficer: boolean
		/** Record a round's score, or edit the one already recorded */
		onEditCrewScore: (round: GwRound, existingScore?: GwCrewScore) => void
	}

	const { crewScores, isOfficer, onEditCrewScore }: Props = $props()

	const crewBattleChartData = $derived(toCrewBattleChartData(crewScores))
	const rounds = $derived(crewScoresByRound(crewScores))
</script>

{#if crewBattleChartData.length > 0}
	<div class="chart-section">
		<GwCrewBattleChart data={crewBattleChartData} />
	</div>
{/if}

<div class="crew-score-table">
	<div class="crew-score-header">
		<span class="col-round">{m.gw_round()}</span>
		<span class="col-our-score">{m.gw_our_score()}</span>
		<span class="col-their-score">{m.gw_their_score()}</span>
		<span class="col-actions"></span>
	</div>
	{#each rounds as { round, score } (round)}
		<div class="crew-score-row">
			<div class="col-round">
				<span class="round-label">{GW_ROUND_LABELS[round]}</span>
				{#if score?.victory !== undefined && score.victory !== null}
					<span class="result-badge" class:win={score.victory} class:loss={!score.victory}>
						{score.victory ? m.gw_win() : m.gw_loss()}
					</span>
				{/if}
			</div>
			<div class="col-our-score">
				{#if score}
					<span class="score-value" class:winner={score.victory === true}
						>{formatScore(score.crewScore)}</span
					>
				{:else}
					<span class="score-empty">—</span>
				{/if}
			</div>
			<div class="col-their-score">
				{#if score}
					{#if score.opponentScore !== null}
						<span class="score-value" class:winner={score.victory === false}
							>{formatScore(score.opponentScore)}</span
						>
					{/if}
					{#if score.opponentName}
						<span class="opponent-name">({score.opponentName})</span>
					{/if}
				{:else}
					<span class="score-empty">—</span>
				{/if}
			</div>
			<div class="col-actions">
				{#if score}
					{#if isOfficer}
						<DropdownMenu>
							{#snippet trigger({ props })}
								<Button variant="ghost" size="small" iconOnly icon="ellipsis" {...props} />
							{/snippet}
							{#snippet menu()}
								<DropdownMenuBase.Item
									class="dropdown-menu-item"
									onclick={() => onEditCrewScore(round, score)}
								>
									{m.gw_edit_score()}
								</DropdownMenuBase.Item>
							{/snippet}
						</DropdownMenu>
					{/if}
				{:else if isOfficer}
					<Button size="small" onclick={() => onEditCrewScore(round)}>
						{m.gw_record()}
					</Button>
				{/if}
			</div>
		</div>
	{/each}
</div>

<style lang="scss">
	@use '$src/themes/crew' as crew;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.chart-section {
		@include crew.chart-section;
	}

	.crew-score-table {
		display: flex;
		flex-direction: column;
	}

	.crew-score-header {
		display: flex;
		align-items: center;
		padding: spacing.$unit spacing.$unit-2x;
		background: transparent;
		border-bottom: 1px solid var(--border-color, rgba(0, 0, 0, 0.06));
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		color: var(--text-secondary);
	}

	.crew-score-row {
		display: flex;
		align-items: center;
		padding: spacing.$unit spacing.$unit-2x;
		border-bottom: 1px solid var(--border-color, rgba(0, 0, 0, 0.04));
		transition: background-color 0.15s;

		&:last-child {
			border-bottom: none;
		}

		&:hover {
			background: var(--list-cell-bg-hover, rgba(0, 0, 0, 0.02));
		}
	}

	.col-round {
		flex: 2;
		display: flex;
		align-items: center;
		gap: spacing.$unit;
	}

	.col-our-score {
		width: 120px;
		display: flex;
		align-items: center;
		gap: spacing.$unit-half;
	}

	.col-their-score {
		flex: 1.4;
		display: flex;
		align-items: center;
		gap: spacing.$unit;
	}

	.col-actions {
		width: 80px;
		display: flex;
		justify-content: flex-end;
	}

	.round-label {
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		color: var(--text-primary);
	}

	.score-value {
		font-size: typography.$font-small;
		font-variant-numeric: tabular-nums;
		color: var(--text-secondary);

		&.winner {
			font-weight: typography.$medium;
			color: var(--text-primary);
		}
	}

	.score-empty {
		font-size: typography.$font-small;
		color: var(--text-tertiary);
	}

	.opponent-name {
		font-size: typography.$font-small;
		color: var(--text-tertiary);
	}

	.result-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 24px;
		height: 24px;
		padding: 0 spacing.$unit-half;
		border-radius: layout.$item-corner-small;
		font-size: typography.$font-small;
		font-weight: typography.$medium;

		&.win {
			background: var(--color-green-light, #dcfce7);
			color: var(--color-green-dark, #166534);
		}

		&.loss {
			background: var(--danger-bg);
			color: var(--danger);
		}
	}
</style>
