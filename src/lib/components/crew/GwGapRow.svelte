<script lang="ts">
	import ElementBadge from '$lib/components/ui/ElementBadge.svelte'
	import type { EventScoreSummary } from '$lib/types/api/gw'

	interface Props {
		/** An event the player has no score for */
		eventScore: EventScoreSummary
		/** Why there's no score (e.g. not in the crew yet) */
		label: string
		onclick: () => void
	}

	const { eventScore, label, onclick }: Props = $props()
</script>

<li class="gap-row">
	<button class="gap-button" {onclick}>
		<div class="gap-info">
			<span class="event-number">GW #{eventScore.gwEvent.eventNumber}</span>
			<ElementBadge element={eventScore.gwEvent.element} />
		</div>
		<span class="gap-indicator">{label}</span>
	</button>
</li>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

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
