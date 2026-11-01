<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import Button from '$lib/components/ui/Button.svelte'
	import ElementBadge from '$lib/components/ui/ElementBadge.svelte'
	import SegmentedControl from '$lib/components/ui/segmented-control/SegmentedControl.svelte'
	import Segment from '$lib/components/ui/segmented-control/Segment.svelte'
	import CrewHeader from '$lib/components/crew/CrewHeader.svelte'
	import { formatDateJST } from '$lib/utils/date'
	import type { EventTab } from '$lib/features/crew/eventTab'
	import type { GwEvent } from '$lib/types/api/gw'

	interface Props {
		gwEvent: GwEvent
		activeTab: EventTab
		onTabChange: (tab: EventTab) => void
		/** Show the Add score action */
		canAddScore: boolean
		onAddScore: () => void
	}

	const { gwEvent, activeTab, onTabChange, canAddScore, onAddScore }: Props = $props()
</script>

<CrewHeader title="GW #{gwEvent.eventNumber}" backHref="/crew">
	{#snippet belowTitle()}
		<div class="event-meta">
			<ElementBadge element={gwEvent.element} />
			<span class="event-dates">
				{formatDateJST(gwEvent.startDate)} – {formatDateJST(gwEvent.endDate)}
			</span>
		</div>
		<div class="tab-control">
			<SegmentedControl
				value={activeTab}
				onValueChange={(v) => onTabChange(v as EventTab)}
				size="small"
				variant="background"
				grow
			>
				<Segment value="individual">{m.gw_tab_individual()}</Segment>
				<Segment value="crew">{m.gw_tab_crew()}</Segment>
			</SegmentedControl>
		</div>
	{/snippet}
	{#snippet actions()}
		{#if canAddScore}
			<Button variant="primary" size="small" onclick={onAddScore}>{m.crew_gw_add_score()}</Button>
		{/if}
	{/snippet}
</CrewHeader>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.event-meta {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
	}

	.event-dates {
		font-size: typography.$font-small;
		color: var(--text-secondary);
	}

	.tab-control {
		margin-top: spacing.$unit;
	}
</style>
