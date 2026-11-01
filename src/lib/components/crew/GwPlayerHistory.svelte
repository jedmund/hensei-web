<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import { formatScore, toPlayerHistoryChartData } from '$lib/utils/gw'
	import { formatDateJST } from '$lib/utils/date'
	import type { EventScoreSummary } from '$lib/types/api/gw'
	import GwCrewHistoryChart from '$lib/components/charts/GwCrewHistoryChart.svelte'
	import CrewSectionHeader from '$lib/components/crew/CrewSectionHeader.svelte'
	import CrewStatusMessage from '$lib/components/crew/CrewStatusMessage.svelte'
	import GwStatsRow from '$lib/components/crew/GwStatsRow.svelte'
	import GwEventScoreRow from '$lib/components/crew/GwEventScoreRow.svelte'
	import GwGapRow from '$lib/components/crew/GwGapRow.svelte'

	interface Props {
		grandTotal: number
		eventScores: EventScoreSummary[]
		/** Shown on events the player has no score for */
		gapLabel: string
		onOpenGap: (eventNumber: number) => void
	}

	const { grandTotal, eventScores, gapLabel, onOpenGap }: Props = $props()

	// Count only events where the player was in the crew
	const eventsInCrew = $derived(eventScores.filter((e) => e.inCrew).length)

	const historyChartData = $derived(toPlayerHistoryChartData(eventScores, formatDateJST))
</script>

<GwStatsRow
	stats={[
		{ value: formatScore(grandTotal), label: m.gw_total_honors() },
		{ value: eventsInCrew, label: m.gw_events_count() }
	]}
/>

{#if historyChartData.length > 0}
	<div class="chart-section">
		<GwCrewHistoryChart data={historyChartData} height={300} />
	</div>
{/if}

{#if eventScores.length === 0}
	<CrewStatusMessage variant="empty" message={m.gw_no_honors()} />
{:else}
	<CrewSectionHeader title={m.gw_event_history()} />

	<ul class="event-list">
		{#each eventScores as eventScore (eventScore.gwEvent.id)}
			{#if eventScore.inCrew}
				<GwEventScoreRow {eventScore} />
			{:else}
				<GwGapRow
					{eventScore}
					label={gapLabel}
					onclick={() => onOpenGap(eventScore.gwEvent.eventNumber)}
				/>
			{/if}
		{/each}
	</ul>
{/if}

<style lang="scss">
	@use '$src/themes/crew' as crew;

	.chart-section {
		@include crew.chart-section;
	}

	.event-list {
		@include crew.row-list;
	}
</style>
