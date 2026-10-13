<script lang="ts">
	/**
	 * LevelSegments - a short pill-shaped bar with one segment per level,
	 * filled up to `level`, with optional text beside it (`valueText`, e.g.
	 * "Lvl 2"). Read-only; `label` names it for screen readers.
	 */

	interface Props {
		level: number
		max: number
		label: string
		valueText?: string
	}

	let { level, max, label, valueText }: Props = $props()
</script>

<div class="level-segments" title={label}>
	<div
		class="segments"
		role="meter"
		aria-label={label}
		aria-valuenow={level}
		aria-valuemin={0}
		aria-valuemax={max}
	>
		{#each { length: max }, i (i)}
			<span class="segment" class:filled={i < level}></span>
		{/each}
	</div>
	{#if valueText}
		<span class="value" aria-hidden="true">{valueText}</span>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/typography' as *;

	.level-segments {
		display: inline-flex;
		align-items: center;
		gap: $unit;
		flex-shrink: 0;
	}

	.segments {
		display: flex;
		gap: $unit-fourth;
		width: $unit-12x;
		height: $unit;
		border-radius: $full-corner;
		overflow: hidden;
	}

	.segment {
		flex: 1;
		// Slightly rounded between segments; the bar's pill shape rounds the ends
		border-radius: $unit-fourth;
		background: var(--extra-purple-bg);

		// Arcarum purple, darker toward the bottom
		&.filled {
			background: linear-gradient(
				to bottom,
				var(--extra-purple-primary),
				color-mix(in srgb, var(--extra-purple-primary) 80%, black)
			);
		}
	}

	.value {
		min-width: $unit-5x;
		font-size: $font-regular;
		font-weight: $medium;
		color: var(--text-primary);
		font-variant-numeric: tabular-nums;
	}
</style>
