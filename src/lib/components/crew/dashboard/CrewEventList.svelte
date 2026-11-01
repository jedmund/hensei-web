<script lang="ts">
	import { goto } from '$app/navigation'
	import { localizeHref } from '$lib/paraglide/runtime'
	import { formatDateJST } from '$lib/utils/date'
	import { formatScore, toCrewHistoryChartData } from '$lib/utils/gw'
	import { formatEventStatus } from '$lib/features/crew/eventStatus'
	import type { GwEvent } from '$lib/types/api/gw'
	import ElementBadge from '$lib/components/ui/ElementBadge.svelte'
	import GwCrewHistoryChart from '$lib/components/charts/GwCrewHistoryChart.svelte'
	import CrewSectionHeader from '$lib/components/crew/CrewSectionHeader.svelte'
	import CrewStatusMessage from '$lib/components/crew/CrewStatusMessage.svelte'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		events: GwEvent[] | undefined
		isLoading: boolean
	}

	const { events, isLoading }: Props = $props()

	// Transform events data for history chart
	const historyChartData = $derived(events ? toCrewHistoryChartData(events, formatDateJST) : [])
</script>

<CrewSectionHeader title={m.crew_unite_and_fight()} rule="top" />

{#if historyChartData.length > 0}
	<div class="chart-section">
		<GwCrewHistoryChart data={historyChartData} />
	</div>
{/if}

{#if isLoading}
	<CrewStatusMessage message={m.crew_loading_events()} />
{:else if events && events.length > 0}
	<ul class="event-list">
		{#each events as event (event.id)}
			<li class="event-item">
				<button
					type="button"
					class="event-button"
					onclick={() => goto(localizeHref(`/crew/events/${event.eventNumber}`))}
				>
					<div class="event-info">
						<span class="event-number">{event.eventNumber}</span>
						<ElementBadge element={event.element} />
					</div>
					<span class="event-dates">
						{formatDateJST(event.startDate)} – {formatDateJST(event.endDate)}
					</span>
					<span class="event-score">
						{#if event.crewTotalScore !== undefined}
							{formatScore(event.crewTotalScore)}
						{/if}
					</span>
					<span class="event-status status-{event.status ?? 'unknown'}"
						>{formatEventStatus(event.status ?? 'unknown', event.startDate)}</span
					>
				</button>
			</li>
		{/each}
	</ul>
{:else}
	<CrewStatusMessage variant="empty" as="p" message={m.crew_no_events()} />
{/if}

<style lang="scss">
	@use '$src/themes/crew' as crew;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.chart-section {
		@include crew.chart-section;
	}

	.event-list {
		@include crew.row-list;
	}

	.event-item {
		list-style: none;
	}

	.event-button {
		all: unset;
		display: flex;
		align-items: center;
		gap: spacing.$unit-2x;
		padding: spacing.$unit spacing.$unit-2x;
		border-radius: layout.$item-corner;
		transition: background-color 0.15s;
		cursor: pointer;
		width: 100%;
		box-sizing: border-box;

		&:hover {
			background: var(--list-cell-bg-hover, rgba(0, 0, 0, 0.03));
		}

		&:focus-visible {
			outline: 2px solid var(--focus-ring-color, #3b82f6);
			outline-offset: 2px;
		}
	}

	.event-info {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
		width: 140px;
	}

	.event-number {
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		min-width: 24px;
		color: var(--text-primary);
	}

	.event-dates {
		flex: 1;
		font-size: typography.$font-small;
		color: var(--text-secondary);
	}

	.event-score {
		width: 140px;
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		font-variant-numeric: tabular-nums;
		text-align: right;
		color: var(--text-primary);
	}

	.event-status {
		width: 80px;
		font-size: typography.$font-small;
		padding: 2px 6px;
		border-radius: layout.$item-corner-small;
		text-align: center;
		text-transform: capitalize;
		white-space: nowrap;

		&.status-active {
			background: var(--color-green-light, #dcfce7);
			color: var(--color-green-dark, #166534);
		}

		&.status-upcoming {
			background: var(--color-blue-light, #dbeafe);
			color: var(--color-blue-dark, #1e40af);
		}

		&.status-finished {
			background: rgba(0, 0, 0, 0.04);
			color: var(--text-secondary);
		}
	}
</style>
