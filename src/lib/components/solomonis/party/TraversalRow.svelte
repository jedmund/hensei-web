<script lang="ts">
	/**
	 * TraversalRow - one kind of space in TraversalSection: its icon, name
	 * and how many times the expedition reached it.
	 */
	import { getSolomonisSpaceIcon } from '$lib/utils/images'
	import type { SpaceStatKey } from './solomonisParty'

	interface Props {
		space: SpaceStatKey
		label: string
		count: number
	}

	let { space, label, count }: Props = $props()
</script>

<div class="traversal-row">
	<img src={getSolomonisSpaceIcon(space)} alt="" class="icon" />
	<span class="label">{label}</span>
	<span class="count">{count}</span>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;

	.traversal-row {
		display: flex;
		align-items: center;
		gap: $unit;
		min-height: $unit-4x;
	}

	.icon {
		width: $unit-3x;
		height: $unit-3x;
		object-fit: contain;
		flex-shrink: 0;
	}

	.label {
		flex: 1;
		min-width: 0;
		font-size: $font-regular;
		color: var(--text-secondary);
	}

	.count {
		font-size: $font-regular;
		font-weight: $medium;
		color: var(--text-primary);
		font-variant-numeric: tabular-nums;
	}
</style>
