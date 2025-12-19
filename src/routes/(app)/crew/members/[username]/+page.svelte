<svelte:options runes={true} />

<script lang="ts">
	import { goto } from '$app/navigation'
	import { page } from '$app/stores'
	import { createQuery } from '@tanstack/svelte-query'
	import { gwQueries } from '$lib/api/queries/gw.queries'
	import { formatScore, toPlayerHistoryChartData } from '$lib/utils/gw'
	import { formatDateJST } from '$lib/utils/date'
	import CrewHeader from '$lib/components/crew/CrewHeader.svelte'
	import GwEventScoreRow from '$lib/components/crew/GwEventScoreRow.svelte'
	import GwCrewHistoryChart from '$lib/components/charts/GwCrewHistoryChart.svelte'
	import ElementBadge from '$lib/components/ui/ElementBadge.svelte'

	const username = $derived($page.params.username ?? '')

	// Query for member's GW scores
	const scoresQuery = createQuery(() => gwQueries.memberGwScoresByUsername(username))

	const memberName = $derived(scoresQuery.data?.member?.user?.username ?? 'Member')

	// Count only events where player was in crew
	const eventsInCrew = $derived(
		scoresQuery.data?.eventScores.filter((e) => e.inCrew).length ?? 0
	)

	// Transform data for chart
	const historyChartData = $derived(
		scoresQuery.data?.eventScores
			? toPlayerHistoryChartData(scoresQuery.data.eventScores, formatDateJST)
			: []
	)
</script>

<svelte:head>
	<title>{memberName} / granblue.team</title>
</svelte:head>

<div class="page">
	<div class="card">
		{#if scoresQuery.isLoading}
			<div class="loading-state">
				<p>Loading...</p>
			</div>
		{:else if scoresQuery.isError}
			<div class="error-state">
				<p>Failed to load scores</p>
			</div>
		{:else if scoresQuery.data}
			{@const data = scoresQuery.data}

			<CrewHeader title={memberName} backHref="/crew/members" />

			<div class="stats-row">
				<div class="stat">
					<span class="stat-value">{formatScore(data.grandTotal)}</span>
					<span class="stat-label">Total Honors</span>
				</div>
				<div class="stat">
					<span class="stat-value">{eventsInCrew}</span>
					<span class="stat-label">Events</span>
				</div>
			</div>

			{#if historyChartData.length > 0}
				<div class="chart-section">
					<GwCrewHistoryChart data={historyChartData} height={300} />
				</div>
			{/if}

			{#if data.eventScores.length === 0}
				<div class="empty-state">No GW scores recorded yet.</div>
			{:else}
				<div class="section-header">
					<span class="section-title">Event History</span>
				</div>

				<ul class="event-list">
					{#each data.eventScores as eventScore (eventScore.gwEvent.id)}
						{#if eventScore.inCrew}
							<GwEventScoreRow {eventScore} />
						{:else}
							<li class="gap-row">
								<button
									class="gap-button"
									onclick={() => goto(`/crew/events/${eventScore.gwEvent.eventNumber}`)}
								>
									<div class="gap-info">
										<span class="event-number">GW #{eventScore.gwEvent.eventNumber}</span>
										<ElementBadge element={eventScore.gwEvent.element} />
									</div>
									<span class="gap-indicator">Not in crew</span>
								</button>
							</li>
						{/if}
					{/each}
				</ul>
			{/if}
		{/if}
	</div>
</div>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/effects' as effects;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.page {
		margin: 0 auto;
		max-width: var(--main-max-width);
	}

	.card {
		background: var(--card-bg);
		border: 0.5px solid rgba(0, 0, 0, 0.18);
		border-radius: layout.$page-corner;
		box-shadow: effects.$page-elevation;
		overflow: hidden;
	}

	.loading-state,
	.error-state {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: spacing.$unit-4x;
		gap: spacing.$unit-2x;
		color: var(--text-secondary);
		font-size: typography.$font-small;
	}

	.stats-row {
		display: flex;
		border-bottom: 1px solid rgba(0, 0, 0, 0.06);
	}

	.stat {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: spacing.$unit-2x;
		border-right: 1px solid rgba(0, 0, 0, 0.08);

		&:last-child {
			border-right: none;
		}
	}

	.stat-value {
		font-size: typography.$font-medium;
		font-weight: typography.$medium;
		margin-bottom: 2px;
	}

	.stat-label {
		font-size: typography.$font-small;
		color: var(--text-secondary);
	}

	.chart-section {
		padding: spacing.$unit-2x;
		border-bottom: 1px solid rgba(0, 0, 0, 0.06);
	}

	.section-header {
		display: flex;
		align-items: center;
		padding: spacing.$unit spacing.$unit-2x;
		background: rgba(0, 0, 0, 0.02);
		border-bottom: 1px solid rgba(0, 0, 0, 0.06);
	}

	.section-title {
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		color: var(--text-secondary);
	}

	.empty-state {
		text-align: center;
		color: var(--text-secondary);
		padding: spacing.$unit-3x;
		font-size: typography.$font-small;
	}

	.event-list {
		list-style: none;
		margin: 0;
		padding: spacing.$unit;
	}

	.gap-row {
		border-radius: layout.$item-corner;
		overflow: hidden;
	}

	.gap-button {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: spacing.$unit spacing.$unit-2x;
		background: rgba(0, 0, 0, 0.02);
		border: none;
		border-radius: layout.$item-corner;
		cursor: pointer;
		transition: background-color 0.15s;
		text-align: left;

		&:hover {
			background: rgba(0, 0, 0, 0.04);
		}
	}

	.gap-info {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
	}

	.gap-info .event-number {
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		color: var(--text-tertiary);
	}

	.gap-indicator {
		font-size: typography.$font-small;
		font-style: italic;
		color: var(--text-tertiary);
	}
</style>
