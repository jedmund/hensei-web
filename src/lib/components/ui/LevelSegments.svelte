<script lang="ts">
	/**
	 * LevelSegments - a short pill-shaped bar with one segment per level,
	 * filled up to `level`. Read-only; `label` names it for screen readers.
	 */

	interface Props {
		level: number
		max: number
		label: string
	}

	let { level, max, label }: Props = $props()
</script>

<div
	class="segments"
	role="meter"
	aria-label={label}
	aria-valuenow={level}
	aria-valuemin={0}
	aria-valuemax={max}
	title={label}
>
	{#each { length: max }, i (i)}
		<span class="segment" class:filled={i < level}></span>
	{/each}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;

	.segments {
		display: flex;
		gap: $unit-fourth;
		width: $unit-12x;
		height: $unit;
		flex-shrink: 0;
		border-radius: $full-corner;
		overflow: hidden;
	}

	.segment {
		flex: 1;
		background: var(--input-bg);

		// Darker toward the bottom
		&.filled {
			background: linear-gradient(
				to bottom,
				var(--accent-blue),
				color-mix(in srgb, var(--accent-blue) 75%, black)
			);
		}
	}
</style>
