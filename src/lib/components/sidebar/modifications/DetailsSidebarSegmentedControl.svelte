<script lang="ts">
	import SegmentedControl from '$lib/components/ui/segmented-control/SegmentedControl.svelte'
	import Segment from '$lib/components/ui/segmented-control/Segment.svelte'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		hasModifications: boolean
		selectedView: 'canonical' | 'user'
		onViewChange?: (view: 'canonical' | 'user') => void
	}

	let { hasModifications, selectedView = $bindable('user'), onViewChange }: Props = $props()

	function handleViewChange(value: string) {
		selectedView = value as 'canonical' | 'user'
		onViewChange?.(selectedView)
	}
</script>

{#if hasModifications}
	<div class="details-sidebar-segmented-control">
		<SegmentedControl
			bind:value={selectedView}
			onValueChange={handleViewChange}
			variant="background"
			size="small"
			grow
		>
			<Segment value="user">{m.details_tab_team()}</Segment>
			<Segment value="canonical">{m.details_tab_info()}</Segment>
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
