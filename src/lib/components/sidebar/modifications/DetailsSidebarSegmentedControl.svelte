<script lang="ts">
	import SegmentedControl from '$lib/components/ui/segmented-control/SegmentedControl.svelte'
	import Segment from '$lib/components/ui/segmented-control/Segment.svelte'

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
			<Segment value="user">This team</Segment>
			<Segment value="canonical">Info</Segment>
		</SegmentedControl>
	</div>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.details-sidebar-segmented-control {
		margin-bottom: spacing.$unit-2x;
		padding: 0 spacing.$unit-2x;
	}

	.segment-label {
		font-size: typography.$font-regular;
		font-weight: typography.$medium;

		&.disabled {
			color: var(--text-tertiary);
			opacity: 0.5;
		}
	}

	.disabled-segment {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: spacing.$unit;
		background: var(--background);
		border-radius: spacing.$unit-half;
		cursor: not-allowed;
		user-select: none;
	}
</style>
