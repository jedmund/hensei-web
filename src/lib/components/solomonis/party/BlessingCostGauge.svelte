<script lang="ts">
	/** The loadout's total blessing cost against the limit, as a filled gauge. */
	import * as m from '$lib/paraglide/messages'

	interface Props {
		total: number
		limit: number
	}

	let { total, limit }: Props = $props()

	const over = $derived(total > limit)
	const fill = $derived(limit > 0 ? Math.min(total / limit, 1) * 100 : 0)
</script>

<div
	class="gauge"
	class:over
	role="meter"
	aria-label={m.solomonis_web_party_blessing_cost_gauge()}
	aria-valuenow={total}
	aria-valuemin={0}
	aria-valuemax={limit}
>
	<div class="fill" style:width="{fill}%"></div>
	<span class="label">{m.solomonis_web_party_blessing_cost_gauge()}</span>
	<span class="total">{total} / {limit}</span>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/effects' as *;
	@use '$src/themes/colors' as *;

	.gauge {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: $unit-5x;
		padding: 0 $unit-2x;
		overflow: hidden;
		border-radius: $item-corner;
		background: var(--input-bg);
	}

	.fill {
		position: absolute;
		inset: 0 auto 0 0;
		background: var(--accent-blue);
		opacity: 0.25;
		@include smooth-transition($duration-quick, width);
	}

	.label,
	.total {
		position: relative;
		font-size: $font-regular;
	}

	.label {
		color: var(--text-secondary);
	}

	.total {
		font-weight: $medium;
		color: var(--text-primary);
		font-variant-numeric: tabular-nums;
	}

	.over {
		.fill {
			background: $error;
		}

		.total {
			color: $error;
		}
	}
</style>
