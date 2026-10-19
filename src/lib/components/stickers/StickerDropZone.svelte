<script lang="ts">
	/**
	 * Where a sticker dragged from the picker can go: a tinted area with a
	 * marching dashed outline, shown while a drag is on and stronger when the
	 * sticker is over it. Colored by the area's --zone-accent and --zone-fill
	 * (the team's element).
	 */
	interface Props {
		/** A sticker is being dragged */
		active: boolean
		/** It's over the zone, so it will land if let go */
		over: boolean
	}

	let { active, over }: Props = $props()
</script>

<div class="zone" class:active class:over aria-hidden="true">
	<svg class="zone-border"><rect /></svg>
</div>

<style lang="scss">
	@use '$src/themes/layout' as layout;

	.zone {
		position: absolute;
		inset: 0;
		border-radius: layout.$item-corner;
		background: transparent;
		opacity: 0;
		pointer-events: none;
		transition:
			opacity 0.2s ease,
			background-color 0.2s ease;

		&.active {
			opacity: 1;
			background: color-mix(in srgb, var(--zone-fill) 20%, transparent);
		}

		&.active.over {
			background: color-mix(in srgb, var(--zone-fill) 40%, transparent);
		}
	}

	.zone-border {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		overflow: visible;

		rect {
			x: 1px;
			y: 1px;
			width: calc(100% - 2px);
			height: calc(100% - 2px);
			rx: 10px;
			fill: none;
			stroke: color-mix(in srgb, var(--zone-accent) 55%, transparent);
			stroke-width: 2;
			stroke-dasharray: 8 6;
			animation: march 0.8s linear infinite;
			transition: stroke 0.2s ease;
		}

		.over & rect {
			stroke: var(--zone-accent);
		}

		@media (prefers-reduced-motion: reduce) {
			rect {
				animation: none;
			}
		}
	}

	@keyframes march {
		to {
			stroke-dashoffset: -14;
		}
	}
</style>
