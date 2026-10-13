<script lang="ts">
	/**
	 * The loadout's total blessing cost against the limit, as a pill-shaped
	 * gauge styled like LevelSegments. The fill is a pill inset by half a
	 * unit. The text is drawn twice: once on the track, and once in white on
	 * the fill, clipped to the fill's shape, so it reads on both.
	 */
	import * as m from '$lib/paraglide/messages'

	interface Props {
		total: number
		limit: number
	}

	let { total, limit }: Props = $props()

	const over = $derived(total > limit)
	const fill = $derived(limit > 0 ? Math.min(total / limit, 1) * 100 : 0)
	const label = $derived(m.solomonis_web_party_blessing_cost_gauge())
</script>

<div
	class="gauge"
	class:over
	role="meter"
	aria-label={label}
	aria-valuenow={total}
	aria-valuemin={0}
	aria-valuemax={limit}
>
	<div class="layer track">
		<span class="label">{label}</span>
		<span class="total">{total} / {limit}</span>
	</div>
	<div
		class="layer fill"
		style:clip-path="inset(0 {100 - fill}% 0 0 round 999px)"
		aria-hidden="true"
	>
		<span class="label">{label}</span>
		<span class="total">{total} / {limit}</span>
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/effects' as *;
	@use '$src/themes/colors' as *;

	.gauge {
		position: relative;
		height: $unit-5x;
		overflow: hidden;
		border-radius: $full-corner;
		background: var(--extra-purple-bg);
	}

	// Inset by half a unit; the fill layer is clipped to a pill of its width
	.layer {
		position: absolute;
		inset: $unit-half;
		border-radius: $full-corner;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 $unit-2x;
		font-size: $font-regular;
	}

	.total {
		font-weight: $medium;
		font-variant-numeric: tabular-nums;
	}

	.track {
		color: var(--extra-purple-text);
	}

	// Arcarum purple, slightly darker toward the bottom (lighter than LevelSegments, as the bar is larger)
	.fill {
		color: white;
		background: linear-gradient(
			to bottom,
			var(--extra-purple-primary),
			color-mix(in srgb, var(--extra-purple-primary) 90%, black)
		);
		@include smooth-transition($duration-quick, clip-path);
	}

	.over {
		.fill {
			background: linear-gradient(to bottom, $error, color-mix(in srgb, $error 90%, black));
		}

		.track .total {
			color: $error;
		}
	}
</style>
