<script lang="ts">
	import SegmentedControl from '$lib/components/ui/segmented-control/SegmentedControl.svelte'
	import Segment from '$lib/components/ui/segmented-control/Segment.svelte'
	import * as m from '$lib/paraglide/messages'

	type DetailsSidebarView = 'canonical' | 'user' | 'skills'

	interface Props {
		showTeam: boolean
		/** Label for the Skills tab; the tab is hidden when omitted. */
		skillsLabel?: string
		selectedView: DetailsSidebarView
		onViewChange?: (view: DetailsSidebarView) => void
	}

	let { showTeam, skillsLabel, selectedView = $bindable('user'), onViewChange }: Props = $props()

	function handleViewChange(value: string) {
		selectedView = value as DetailsSidebarView
		onViewChange?.(selectedView)
	}
</script>

{#if showTeam || skillsLabel}
	<div class="details-sidebar-segmented-control">
		<SegmentedControl
			bind:value={selectedView}
			onValueChange={handleViewChange}
			variant="background"
			size="small"
			grow
		>
			{#if showTeam}
				<Segment value="user">{m.details_tab_team()}</Segment>
			{/if}
			<Segment value="canonical">{m.details_tab_info()}</Segment>
			{#if skillsLabel}
				<Segment value="skills">{skillsLabel}</Segment>
			{/if}
		</SegmentedControl>
	</div>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.details-sidebar-segmented-control {
		padding: 0 spacing.$unit-2x;
	}
</style>
