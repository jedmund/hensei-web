
<script lang="ts">
	import { goto } from '$app/navigation'
	import ElementBadge from '$lib/components/ui/ElementBadge.svelte'
	import { formatScore } from '$lib/utils/gw'
	import type { EventScoreSummary } from '$lib/types/api/gw'

	interface Props {
		eventScore: EventScoreSummary
	}

	let { eventScore }: Props = $props()
</script>

<li class="event-item">
	<button
		class="event-button"
		onclick={() => goto(`/crew/events/${eventScore.gwEvent.eventNumber}`)}
	>
		<div class="event-info">
			<span class="event-number">GW #{eventScore.gwEvent.eventNumber}</span>
			<ElementBadge element={eventScore.gwEvent.element} />
		</div>
		<span class="event-score">{formatScore(eventScore.totalScore ?? 0)}</span>
	</button>
</li>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.event-item {
		border-radius: layout.$item-corner;
		overflow: hidden;
	}

	.event-button {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: spacing.$unit spacing.$unit-2x;
		background: transparent;
		border: none;
		border-radius: layout.$item-corner;
		cursor: pointer;
		transition: background-color 0.15s;
		text-align: left;

		&:hover {
			background: var(--list-cell-bg-hover, rgba(0, 0, 0, 0.03));
		}
	}

	.event-info {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
	}

	.event-number {
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		color: var(--text-primary);
	}

	.event-score {
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		font-variant-numeric: tabular-nums;
		color: var(--text-secondary);
	}
</style>
